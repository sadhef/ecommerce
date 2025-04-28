import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  error: null,
  lastCheck: null,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true, error: null });

    // Client-side validation
    if (password !== confirmPassword) {
      set({ loading: false, error: "Passwords do not match" });
      toast.error("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      set({ loading: false, error: "Password must be at least 6 characters" });
      toast.error("Password must be at least 6 characters");
      return false;
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      
      // Store token in localStorage as backup auth method
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }
      
      set({ 
        user: res.data, 
        loading: false, 
        error: null,
        lastCheck: new Date()
      });
      
      toast.success("Signup successful!");
      return true;
    } catch (error) {
      // Extract error message from response if available
      const errorMessage = error.response?.data?.message || 
                           "An error occurred during signup";
      
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const res = await axios.post("/auth/login", { email, password });
      
      // Store token in localStorage as backup auth method
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }
      
      set({ 
        user: res.data, 
        loading: false, 
        error: null,
        lastCheck: new Date()
      });
      
      toast.success("Login successful!");
      return true;
    } catch (error) {
      // Handle different error scenarios
      if (error.response?.status === 503) {
        const errorMessage = "Database connection issue. Please try again later.";
        set({ loading: false, error: errorMessage });
        toast.error(errorMessage);
        return false;
      }
      
      const errorMessage = error.response?.data?.message || 
                           "Invalid email or password";
      
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await axios.post("/auth/logout");
      
      // Clear token from localStorage
      localStorage.removeItem('accessToken');
      
      set({ 
        user: null, 
        loading: false, 
        error: null,
        lastCheck: new Date()
      });
      
      toast.success("Logged out successfully");
      return true;
    } catch (error) {
      // Even if server-side logout fails, clear local state
      localStorage.removeItem('accessToken');
      
      set({ 
        user: null, 
        loading: false, 
        error: null,
        lastCheck: new Date()
      });
      
      toast.success("Logged out successfully");
      return true;
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    
    // Skip frequent rechecks (within 5 minutes)
    const lastCheck = get().lastCheck;
    const now = new Date();
    if (lastCheck && ((now - lastCheck) < 5 * 60 * 1000) && get().user) {
      set({ checkingAuth: false });
      return true;
    }
    
    try {
      const response = await axios.get("/auth/profile");
      set({ 
        user: response.data, 
        checkingAuth: false, 
        error: null,
        lastCheck: new Date()
      });
      return true;
    } catch (error) {
      // Don't show error toast for auth check - this is expected for non-logged in users
      console.log("Auth check: User not authenticated");
      
      // Clear any stored tokens if auth check fails
      localStorage.removeItem('accessToken');
      
      set({ 
        user: null, 
        checkingAuth: false, 
        error: null,
        lastCheck: new Date()
      });
      
      return false;
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return false;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      
      if (response.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      
      set({ 
        checkingAuth: false, 
        error: null,
        lastCheck: new Date()
      });
      
      return response.data;
    } catch (error) {
      localStorage.removeItem('accessToken');
      
      set({ 
        user: null, 
        checkingAuth: false, 
        error: "Session expired",
        lastCheck: new Date()
      });
      
      return false;
    }
  },

  clearError: () => set({ error: null }),
});