import axios from "axios";

// Create a base URL that works in both development and production
const baseURL = import.meta.env.PROD 
  ? '/api'  // In production, use relative path
  : 'http://localhost:5000/api';  // In development, use the full URL

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // send cookies to the server
  timeout: 10000, // 10 seconds timeout
});

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Log the error for debugging
      console.error(`API Error: ${error.response.status}`, error.response.data);
      
      // Handle specific error codes
      if (error.response.status === 401) {
        // Unauthorized - could redirect to login or refresh token
        console.log("Authentication error - you may need to log in again");
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server", error.request);
    } else {
      // Something happened in setting up the request
      console.error("Request error:", error.message);
    }
    
    // Pass the error along to be handled by the caller
    return Promise.reject(error);
  }
);

export default axiosInstance;