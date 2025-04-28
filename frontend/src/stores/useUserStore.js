import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      
      // Store token in localStorage
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },
  
  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });
      
      // Store token in localStorage
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  logout: async () => {
    try {
      // First try to log out on the server (if we're authenticated)
      try {
        await axios.post("/auth/logout");
      } catch (error) {
        // Continue with local logout even if server logout fails
        console.log("Server logout failed, continuing with local logout");
      }
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      set({ user: null });
    } catch (error) {
      toast.error("Failed to log out properly");
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    
    // First check if we have a token in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      set({ checkingAuth: false, user: null });
      return;
    }
    
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      console.log("Auth check failed:", error.message);
      
      // Clear invalid token
      localStorage.removeItem('token');
      
      set({ checkingAuth: false, user: null });
    }
  }
}));