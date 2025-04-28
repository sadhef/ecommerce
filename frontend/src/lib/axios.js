import axios from "axios";
import toast from "react-hot-toast";

// Determine API base URL based on environment
const getBaseURL = () => {
  // Always use the full URL to the backend API
  return 'https://ecommerce-h3q3.vercel.app/api';
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

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization header if we have a token in localStorage
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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is a CORS error
    if (error.message && error.message.includes('Network Error')) {
      toast.error('CORS or network error. Please contact support.', {
        id: 'cors-error',
        duration: 5000
      });
      console.error('CORS or network error:', error);
      return Promise.reject(error);
    }
    
    // Database connection errors (status 503)
    if (error.response?.status === 503) {
      toast.error('Database connection issue. Please try again later.', {
        id: 'db-error',
        duration: 5000
      });
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
    if (!error.response) {
      toast.error('Network error. Please check your connection.', {
        id: 'network-error',
        duration: 5000
      });
    }
    
    // Server errors
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