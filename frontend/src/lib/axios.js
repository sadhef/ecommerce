import axios from "axios";

// Create a base URL that points to the backend API
const baseURL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://ecommerce-h3q3.vercel.app'  // Production backend URL
  : 'http://localhost:5000';  // Development backend URL

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // still try to send cookies when possible
  timeout: 15000, // 15 seconds timeout (increased for serverless cold starts)
});

// Add interceptor to include auth tokens from localStorage in request headers
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    if (refreshToken) {
      config.headers['X-Refresh-Token'] = refreshToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh and common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const res = await axios.post(`${baseURL}/auth/refresh-token`, {}, {
            headers: {
              'X-Refresh-Token': refreshToken
            }
          });
          
          // If token refresh was successful
          if (res.data.accessToken) {
            // Store the new token
            localStorage.setItem('accessToken', res.data.accessToken);
            
            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            
            // Retry the original request
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // If refresh failed, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    
    // Handle common errors
    if (error.response) {
      console.error(`API Error: ${error.response.status}`, error.response.data);
      
      if (error.response.status === 401) {
        console.log("Authentication error - you may need to log in again");
      }
    } else if (error.request) {
      console.error("No response received from server", error.request);
    } else {
      console.error("Request error:", error.message);
    }
    
    // Pass the error along to be handled by the caller
    return Promise.reject(error);
  }
);

export default axiosInstance;