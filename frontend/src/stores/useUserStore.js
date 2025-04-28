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
      }
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
      }
      
      set({ user: res.data, loading: false, error: null });
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
      
      // Store tokens in localStorage for use with API calls
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
      }
      
      set({ user: res.data, loading: false, error: null });
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
      await axios.post("/auth/logout");
      
      // Clear tokens from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      set({ user: null, loading: false, error: null });
      toast.success("Logged out successfully");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred during logout";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      
      // Still clear tokens and user state on client side even if server logout fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null });
      
      return false;
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    
    // Check if we have a token stored locally
    const accessToken = localStorage.getItem('accessToken');
    
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
      set({ user: null, checkingAuth: false, error: null });
      return false;
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return false;

    set({ checkingAuth: true });
    
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      set({ user: null, checkingAuth: false, error: "No refresh token" });
      return false;
    }
    
    try {
      const response = await axios.post("/auth/refresh-token", {}, {
        headers: {
          'X-Refresh-Token': refreshToken
        }
      });
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      
      set({ checkingAuth: false, error: null });
      return true;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, checkingAuth: false, error: "Session expired" });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));