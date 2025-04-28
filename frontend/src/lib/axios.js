import axios from "axios";
import toast from "react-hot-toast";

// Determine API base URL based on environment
const getBaseURL = () => {
  // First check if we have an environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Then check the window location to determine if we're in production or development
  const isProduction = window.location.hostname !== 'localhost';
  
  if (isProduction) {
    // Priority order for production API endpoints
    const possibleBackends = [
      'https://ecommerce-h3q3.vercel.app/api',
      'https://ri-carts-api.vercel.app/api',
      `${window.location.origin}/api` // Same-origin API (if backend and frontend are deployed together)
    ];
    
    // We'll return the first one, but will try the others if this fails
    return possibleBackends[0];
  } else {
    // Development environment
    return 'http://localhost:5000/api';
  }
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Important for sending/receiving cookies
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Store backup API endpoints to try if primary fails
const backupEndpoints = [
  'https://ecommerce-h3q3.vercel.app/api',
  'https://ri-carts-api.vercel.app/api',
  `${window.location.origin}/api`
].filter(url => url !== getBaseURL());

let currentBackupIndex = 0;
let isUsingBackup = false;

// Function to switch to a backup API endpoint
const switchToBackupEndpoint = () => {
  if (currentBackupIndex < backupEndpoints.length) {
    const newBaseURL = backupEndpoints[currentBackupIndex];
    console.log(`Switching to backup API endpoint: ${newBaseURL}`);
    axiosInstance.defaults.baseURL = newBaseURL;
    currentBackupIndex++;
    isUsingBackup = true;
    return true;
  }
  return false;
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization header if we have a token in localStorage
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Log the request in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // This flag prevents infinite retry loops
    if (originalRequest._isRetry) {
      return Promise.reject(error);
    }
    
    // Connection errors and service unavailable (could be CORS or network)
    if ((!error.response && error.message.includes('Network Error')) ||
        error.response?.status === 503) {
      
      // If we're already using a backup and failed, move to the next one
      if (isUsingBackup) {
        const switched = switchToBackupEndpoint();
        if (switched && !originalRequest._isRetry) {
          originalRequest._isRetry = true;
          return axiosInstance(originalRequest);
        }
      }
      // First time encountering an error with the primary endpoint
      else if (!isUsingBackup && !originalRequest._isRetry) {
        const switched = switchToBackupEndpoint();
        if (switched) {
          originalRequest._isRetry = true;
          return axiosInstance(originalRequest);
        }
      }
      
      // Show error only after all backup attempts
      if (!originalRequest._noErrorToast) {
        toast.error('Connection issue. Please try again later.', {
          id: 'connection-error',
          duration: 5000
        });
      }
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshResponse = await axiosInstance.post('/auth/refresh-token');
        
        if (refreshResponse.data?.accessToken) {
          // Store the new token
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          
          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data
        localStorage.removeItem("accessToken");
        
        // Show login required toast
        toast.error('Session expired. Please login again.', { 
          id: 'session-expired',
          duration: 5000
        });
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Network errors
    if (!error.response && !originalRequest._noErrorToast) {
      toast.error('Network error. Please check your connection.', {
        id: 'network-error',
        duration: 5000
      });
    }
    
    // Server errors
    if (error.response?.status >= 500 && error.response?.status !== 503 && !originalRequest._noErrorToast) {
      toast.error('Server error. Please try again later.', {
        id: 'server-error',
        duration: 5000
      });
    }
    
    return Promise.reject(error);
  }
);

// Export the axios instance
export default axiosInstance;

// Export a silent version that doesn't show error toasts
export const silentAxios = (config) => {
  const newConfig = { ...config, _noErrorToast: true };
  return axiosInstance(newConfig);
};