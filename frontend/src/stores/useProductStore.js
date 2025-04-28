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
      const errorMessage = error.response?.data?.message || "Failed to fetch products";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
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
      const errorMessage = error.response?.data?.message || "Failed to fetch products";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
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
      
      if (!response.data || response.data.length === 0) {
        // If no featured products, fetch all instead
        const allProducts = await axios.get("/products");
        set({ 
          products: allProducts.data.products || [], 
          loading: false,
          error: null
        });
        return allProducts.data.products;
      }
      
      set({ 
        products: response.data, 
        loading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      console.log("Error fetching featured products:", error);
      
      // On error, try fetching all products as fallback
      try {
        const fallbackResponse = await axios.get("/products");
        set({ 
          products: fallbackResponse.data.products || [],
          loading: false,
          error: null
        });
        return fallbackResponse.data.products;
      } catch (fallbackError) {
        const errorMessage = "Failed to fetch products";
        set({ error: errorMessage, loading: false });
        return [];
      }
    }
  },
  
  clearError: () => set({ error: null }),
}));