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
  withCredentials: true, // Send cookies with cross-site requests
  timeout: 15000, // Set a reasonable timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    // For debugging in development only
    if (import.meta.env.DEV) {
      console.log(`Request to: ${config.baseURL}${config.url}`, config);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the detailed error for debugging
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
        toast.error("Authentication failed. Please log in again.");
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