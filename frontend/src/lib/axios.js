import axios from "axios";
import toast from "react-hot-toast";

// Determine API base URL based on environment
const getBaseURL = () => {
  // If deployed to Vercel or similar platform
  if (import.meta.env.PROD) {
    // For single-domain deployment
    if (window.location.hostname === 'ecommerce-h3q3.vercel.app') {
      return '/api';
    }
    // For separate frontend/backend deployment
    return 'https://ecommerce-h3q3.vercel.app/api';
  }
  // Local development
  return 'http://localhost:5000/api';
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Important for sending/receiving cookies
  timeout: 15000, // 15 seconds timeout - increased for potential slow connections
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - runs before each request
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization header if we have a token in localStorage
    // This is a backup approach in case cookies don't work
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - runs after each response
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // No auto retry for these URLs to prevent infinite loops
    const noRetryUrls = ['/auth/refresh-token', '/auth/login', '/auth/signup'];
    
    // Database connection errors (status 503)
    if (error.response?.status === 503) {
      toast.error('Database connection issue. Please try again later.', {
        id: 'db-error',
        duration: 5000
      });
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors that aren't token refresh attempts
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !noRetryUrls.includes(originalRequest.url)) {
      
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshResponse = await axiosInstance.post('/auth/refresh-token');
        
        if (refreshResponse.data?.accessToken) {
          // Store the new token
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);
          
          // Update the authorization header
          axiosInstance.defaults.headers.common['Authorization'] = 
            `Bearer ${refreshResponse.data.accessToken}`;
          
          // Retry the original request with the new token
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // Clear any stored auth data
        localStorage.removeItem("accessToken");
        
        // Show login required toast once
        toast.error('Session expired. Please login again.', {
          id: 'session-expired',
          duration: 5000
        });
        
        // If we're not already on the login page, redirect
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Network errors (no response)
    if (!error.response) {
      toast.error('Network error. Please check your connection.', {
        id: 'network-error',
        duration: 5000
      });
    }
    
    // Server errors (500 range)
    if (error.response?.status >= 500 && error.response?.status !== 503) {
      toast.error('Server error. Please try again later.', {
        id: 'server-error',
        duration: 5000
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;