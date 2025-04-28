import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  error: null,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true, error: null });

    if (password !== confirmPassword) {
      set({ loading: false, error: "Passwords do not match" });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      
      // Store tokens in localStorage for use with API calls
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        
        // Also store in sessionStorage for cross-browser compatibility
        sessionStorage.setItem('accessToken', res.data.accessToken);
      }
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
        
        // Also store in sessionStorage for cross-browser compatibility
        sessionStorage.setItem('refreshToken', res.data.refreshToken);
      }
      
      // Store only user data in state, not tokens
      const userData = {
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      };
      
      set({ user: userData, loading: false, error: null });
      toast.success("Signup successful!");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred during signup";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const res = await axios.post("/auth/login", { email, password });
      
      // Store tokens in both localStorage and sessionStorage
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        sessionStorage.setItem('accessToken', res.data.accessToken);
      }
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
        sessionStorage.setItem('refreshToken', res.data.refreshToken);
      }
      
      // Store only user data in state, not tokens
      const userData = {
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      };
      
      set({ user: userData, loading: false, error: null });
      toast.success("Login successful!");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid email or password";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      // Try to logout from server, but continue even if it fails
      try {
        await axios.post("/auth/logout");
      } catch (serverError) {
        console.log("Server logout failed, continuing with client logout");
      }
      
      // Clear tokens from both localStorage and sessionStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      
      set({ user: null, loading: false, error: null });
      toast.success("Logged out successfully");
      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      
      // Still clear tokens and user state on client side
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      set({ user: null, loading: false, error: null });
      
      return true; // Return true anyway as the user is effectively logged out
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    
    // Check if we have a token in either localStorage or sessionStorage
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    if (!accessToken) {
      set({ user: null, checkingAuth: false, error: null });
      return false;
    }
    
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false, error: null });
      return true;
    } catch (error) {
      console.log("Auth check: User not authenticated");
      
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
      
      // Try to refresh token before giving up
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          await get().refreshToken();
          // If refresh succeeded, try again to get profile
          try {
            const retryResponse = await axios.get("/auth/profile");
            set({ user: retryResponse.data, checkingAuth: false, error: null });
            return true;
          } catch (retryError) {
            // Still failed after token refresh
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('refreshToken');
            set({ user: null, checkingAuth: false, error: null });
            return false;
          }
        } catch (refreshError) {
          // Refresh token failed too, clear it
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
        }
      }
      
      set({ user: null, checkingAuth: false, error: null });
      return false;
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return false;

    set({ checkingAuth: true });
    
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      set({ user: null, checkingAuth: false, error: "No refresh token" });
      return false;
    }
    
    try {
      // Use native fetch instead of axios to avoid interceptors
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://ecommerce-h3q3.vercel.app'}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Refresh-Token': refreshToken
        }
      });
      
      if (!response.ok) {
        throw new Error('Refresh token failed');
      }
      
      const data = await response.json();
      
      if (data.accessToken) {
        // Store in both localStorage and sessionStorage
        localStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('accessToken', data.accessToken);
        set({ checkingAuth: false, error: null });
        return true;
      } else {
        throw new Error('No access token in response');
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      set({ user: null, checkingAuth: false, error: "Session expired" });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));