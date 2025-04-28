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

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    // For debugging, log where requests are going in development
    if (import.meta.env.DEV) {
      console.log(`Request to: ${config.baseURL}${config.url}`);
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
    // Log all errors for debugging
    console.error("Axios error:", error.message);
    
    // Handle network errors
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      return Promise.reject({
        response: {
          status: 0,
          data: { message: "Network error. Please check your connection." }
        }
      });
    }
    
    // Handle CORS errors
    if (error.message.includes('NetworkError') || error.message.includes('Network Error')) {
      console.error("Possible CORS issue:", error);
      toast.error("Connection issue. Please try again later.");
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // You could redirect to login page here
      console.log("Authentication error, please login again");
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;