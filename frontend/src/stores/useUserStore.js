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
      toast.success("Account created successfully!");
    } catch (error) {
      set({ loading: false });
      console.error("Signup error:", error);
      toast.error(error.response?.data?.message || "Failed to create account");
    }
  },
  
  login: async (email, password) => {
    set({ loading: true });

    try {
      // First try debug login to see if we get a response
      try {
        await axios.post("/auth/debug-login", { test: true });
      } catch (debugError) {
        console.log("Debug login test failed:", debugError);
      }
      
      // Now try the real login
      const res = await axios.post("/auth/login", { email, password });
      
      // Store token in localStorage
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      set({ user: res.data, loading: false });
      toast.success("Logged in successfully!");
    } catch (error) {
      set({ loading: false });
      console.error("Login error:", error);
      
      // Show a detailed error message for debugging
      if (error.response) {
        toast.error(`Login failed: ${error.response.data?.message || error.response.status}`);
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  },

  logout: async () => {
    try {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      set({ user: null });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
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