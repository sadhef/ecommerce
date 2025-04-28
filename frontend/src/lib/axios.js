import axios from "axios";
import { toast } from "react-hot-toast";

// Determine environment and set baseURL accordingly
const getBaseUrl = () => {
  // Check if we're in production (deployed to Vercel)
  if (import.meta.env.PROD) {
    return "https://ecommerce-h3q3.vercel.app/api";
  }
  return "http://localhost:5000/api"; // Local development
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000, // Set a reasonable timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to attach token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`Request: ${config.method.toUpperCase()} ${config.url}`, config);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`Response from ${response.config.url}:`, response.status);
    }
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error("API Error:", error);
    
    // Handle network errors
    if (!error.response) {
      const errorMessage = "Network error. Please check your connection.";
      toast.error(errorMessage);
      return Promise.reject({
        response: {
          status: 0,
          data: { message: errorMessage }
        }
      });
    }
    
    // Handle specific error status codes
    switch (error.response.status) {
      case 401:
        // Only show error message if it's not an automatic auth check
        if (!error.config.url.includes("/auth/profile")) {
          toast.error("Authentication failed. Please log in again.");
        }
        
        // Clear token on auth failure
        localStorage.removeItem('token');
        break;
      case 403:
        toast.error("You don't have permission to perform this action.");
        break;
      case 404:
        toast.error("Resource not found.");
        break;
      case 500:
        toast.error("Server error. Please try again later.");
        break;
      default:
        // Show message from the server or a default one
        const message = error.response.data?.message || "An unexpected error occurred";
        toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;