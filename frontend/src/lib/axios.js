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

// Function to get tokens from multiple storage types
const getToken = (key) => {
  // Try localStorage first
  let token = localStorage.getItem(key);
  
  // If not found in localStorage, try sessionStorage
  if (!token) {
    token = sessionStorage.getItem(key);
  }
  
  return token;
};

// Add interceptor to include auth tokens from storage in request headers
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getToken('accessToken');
    const refreshToken = getToken('refreshToken');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    if (refreshToken) {
      config.headers['X-Refresh-Token'] = refreshToken;
    }
    
    // For mobile browsers, also include token in the request body for POST/PUT/PATCH
    if (accessToken && ['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
      // Make sure we have a data object to add the token to
      config.data = config.data || {};
      
      // Add the token to the body if it's not already there
      if (typeof config.data === 'object' && !config.data.accessToken) {
        // If data is FormData, append the token
        if (config.data instanceof FormData) {
          config.data.append('accessToken', accessToken);
        } 
        // If data is JSON object, add the token property
        else {
          config.data.accessToken = accessToken;
        }
      }
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
        const refreshToken = getToken('refreshToken');
        
        if (refreshToken) {
          const res = await axios.post(`${baseURL}/auth/refresh-token`, {}, {
            headers: {
              'X-Refresh-Token': refreshToken
            }
          });
          
          // If token refresh was successful
          if (res.data.accessToken) {
            // Store the new token in both localStorage and sessionStorage
            localStorage.setItem('accessToken', res.data.accessToken);
            sessionStorage.setItem('accessToken', res.data.accessToken);
            
            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            
            // If the original request was a POST/PUT/PATCH, add token to body as well
            if (['post', 'put', 'patch'].includes(originalRequest.method?.toLowerCase())) {
              // Make sure we have a data object
              originalRequest.data = originalRequest.data || {};
              
              // Add the new token to the body
              if (typeof originalRequest.data === 'object') {
                if (originalRequest.data instanceof FormData) {
                  // For FormData, first remove any existing token and then add the new one
                  try {
                    originalRequest.data.delete('accessToken');
                  } catch (e) {
                    // Ignore errors if the key doesn't exist
                  }
                  originalRequest.data.append('accessToken', res.data.accessToken);
                } else {
                  // For JSON objects
                  originalRequest.data.accessToken = res.data.accessToken;
                }
              }
            }
            
            // Retry the original request
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // If refresh failed, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
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