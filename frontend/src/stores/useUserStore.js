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
      set({ user: null, loading: false, error: null });
      toast.success("Logged out successfully");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred during logout";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false, error: null });
      return true;
    } catch (error) {
      // Don't show error toast for auth check - this is expected for non-logged in users
      console.log("Auth check: User not authenticated");
      set({ user: null, checkingAuth: false, error: null });
      return false;
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return false;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false, error: null });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false, error: "Session expired" });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is not 401 or we've already tried to refresh, just reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;

    try {
      // If a refresh is already in progress, wait for it to complete
      if (refreshPromise) {
        await refreshPromise;
        return axios(originalRequest);
      }

      // Start a new refresh process
      refreshPromise = useUserStore.getState().refreshToken();
      const refreshResult = await refreshPromise;
      refreshPromise = null;

      if (refreshResult) {
        return axios(originalRequest);
      } else {
        // If refresh fails, clear user state
        useUserStore.getState().logout();
        return Promise.reject(error);
      }
    } catch (refreshError) {
      refreshPromise = null;
      useUserStore.getState().logout();
      return Promise.reject(refreshError);
    }
  }
);