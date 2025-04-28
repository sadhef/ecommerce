import axios from "axios";

// Determine environment and set baseURL accordingly
const getBaseUrl = () => {
  // Check if we're in production or development
  if (import.meta.env.MODE === "production") {
    return "https://ecommerce-h3q3.vercel.app/api";
  }
  return "http://localhost:5000/api"; // Local development
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Send cookies for cross-site requests
  timeout: 15000, // Set a reasonable timeout
});

// Add request interceptor to handle common headers
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add common headers here if needed
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
    // Handle network errors
    if (!error.response) {
      console.error("Network Error:", error.message);
      // Return a more specific error for network issues
      return Promise.reject({
        response: {
          status: 0,
          data: { message: "Network error. Please check your connection." }
        }
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;