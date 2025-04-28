import axios from "axios";
import { toast } from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: "https://ecommerce-h3q3.vercel.app/api",
  withCredentials: true,
  timeout: 15000
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the full error for debugging
    console.error("API Error:", error);
    
    // Handle CORS and network errors
    if (error.message && error.message.includes('Network Error')) {
      toast.error("Connection issue. This might be due to CORS or network problems.");
    } else if (error.response) {
      // Handle server errors
      const message = error.response.data?.message || "An error occurred";
      toast.error(message);
    } else {
      toast.error("An unexpected error occurred");
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;