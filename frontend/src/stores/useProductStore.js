import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,

  setProducts: (products) => set({ products }),
  
  createProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post("/products", productData);
      set((prevState) => ({
        products: [...prevState.products, res.data],
        loading: false,
        error: null
      }));
      toast.success("Product created successfully");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create product";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },
  
  fetchAllProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get("/products");
      set({ 
        products: response.data.products || [], 
        loading: false,
        error: null 
      });
      return response.data.products;
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // Don't show toast for admin-only route failures
      set({ error: "Failed to fetch products", loading: false });
      return [];
    }
  },
  
  fetchProductsByCategory: async (category) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`/products/category/${category}`);
      set({ 
        products: response.data.products || [], 
        loading: false,
        error: null
      });
      return response.data.products;
    } catch (error) {
      console.error("Failed to fetch products by category:", error);
      set({ error: "Failed to fetch products", loading: false });
      // Instead of showing error, set empty products
      set({ products: [], loading: false });
      return [];
    }
  },
  
  deleteProduct: async (productId) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`/products/${productId}`);
      set((prevState) => ({
        products: prevState.products.filter((product) => product._id !== productId),
        loading: false,
        error: null
      }));
      toast.success("Product deleted successfully");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete product";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },
  
  toggleFeaturedProduct: async (productId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.patch(`/products/${productId}`);
      // Update the isFeatured prop of the product
      set((prevState) => ({
        products: prevState.products.map((product) =>
          product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
        ),
        loading: false,
        error: null
      }));
      toast.success("Product updated successfully");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update product";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },
  
  fetchFeaturedProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get("/products/featured");
      
      // Handle potential empty response gracefully
      if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        set({ products: [], loading: false, error: null });
        return [];
      }
      
      set({ 
        products: Array.isArray(response.data) ? response.data : [], 
        loading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching featured products:", error);
      
      // Don't show error toast for this public route
      // Just set empty products
      set({ products: [], loading: false, error: null });
      return [];
    }
  },
  
  clearError: () => set({ error: null }),
}));