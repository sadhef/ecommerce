import axios from "axios";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: "https://ecommerce-h3q3.vercel.app/api",
  withCredentials: true,
  timeout: 15000
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    
    // Show user-friendly error messages
    if (!error.response) {
      toast.error("Network error. Please try again later.");
    } else {
      const message = error.response.data?.message || "An error occurred";
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;