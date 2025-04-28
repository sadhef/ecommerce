import axios from "axios";

// Create a base URL that points to the backend API
const baseURL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://ri-cart.vercel.app'  // Production backend URL
  : 'http://localhost:5000';  // Development backend URL

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // send cookies to the server
  timeout: 15000, // 15 seconds timeout (increased for serverless cold starts)
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