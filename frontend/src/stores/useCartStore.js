import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "./useUserStore";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,
  loading: false,
  error: null,

  getMyCoupon: async () => {
    // Skip if not logged in
    if (!useUserStore.getState().user) return null;
    
    set({ loading: true, error: null });
    try {
      const response = await axios.get("/coupons");
      // Only update state if we have a coupon
      if (response.data) {
        set({ coupon: response.data, loading: false, error: null });
      } else {
        set({ loading: false, error: null });
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon:", error);
      set({ loading: false, error: null }); // Don't set error state to prevent UI issues
      return null;
    }
  },
  
  applyCoupon: async (code) => {
    // Verify user is logged in
    if (!useUserStore.getState().user) {
      toast.error("Please login to apply coupons");
      return false;
    }
    
    // Validate code
    if (!code || typeof code !== 'string' || code.trim() === '') {
      toast.error("Please enter a valid coupon code");
      return false;
    }
    
    set({ loading: true, error: null });
    try {
      const response = await axios.post("/coupons/validate", { code });
      
      if (!response.data) {
        throw new Error("Invalid coupon response");
      }
      
      set({ 
        coupon: response.data, 
        isCouponApplied: true,
        loading: false,
        error: null
      });
      
      get().calculateTotals();
      toast.success("Coupon applied successfully");
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to apply coupon";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },
  
  removeCoupon: () => {
    set({ isCouponApplied: false, error: null });
    get().calculateTotals();
    toast.success("Coupon removed");
    return true;
  },

  getCartItems: async () => {
    // Skip if not logged in
    if (!useUserStore.getState().user) return [];
    
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/cart");
      
      // Validate response data
      if (!res.data || !Array.isArray(res.data)) {
        console.error("Invalid cart data received:", res.data);
        set({ cart: [], loading: false, error: null });
        return [];
      }
      
      // Ensure each item has the required properties
      const validatedCart = res.data.filter(item => 
        item && item._id && typeof item.price === 'number'
      );
      
      set({ cart: validatedCart, loading: false, error: null });
      get().calculateTotals();
      return validatedCart;
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Don't show error toast for authentication issues
      set({ cart: [], loading: false, error: null });
      return [];
    }
  },
  
  clearCart: async () => {
    try {
      if (useUserStore.getState().user) {
        // Only attempt API call if user is logged in
        await axios.delete("/cart");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      // Continue even if API call fails
    }
    
    set({ 
      cart: [], 
      coupon: null, 
      total: 0, 
      subtotal: 0,
      isCouponApplied: false,
      error: null
    });
    
    return true;
  },
  
  addToCart: async (product) => {
    // Check if user is logged in
    if (!useUserStore.getState().user) {
      toast.error("Please login to add products to cart");
      return false;
    }
    
    // Validate product
    if (!product || !product._id) {
      console.error("Invalid product:", product);
      toast.error("Invalid product");
      return false;
    }
    
    set({ loading: true, error: null });
    try {
      await axios.post("/cart", { productId: product._id });
      
      set((prevState) => {
        const existingItem = prevState.cart.find((item) => item._id === product._id);
        
        if (existingItem) {
          // Update quantity for existing item
          const newCart = prevState.cart.map((item) =>
            item._id === product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
          );
          return { cart: newCart, loading: false, error: null };
        } else {
          // Add new item
          return { 
            cart: [...prevState.cart, { ...product, quantity: 1 }], 
            loading: false, 
            error: null 
          };
        }
      });
      
      get().calculateTotals();
      toast.success("Product added to cart");
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = "Failed to add product to cart. Please try again.";
      set({ loading: false, error: null }); // Don't set error state
      toast.error(errorMessage);
      return false;
    }
  },
  
  removeFromCart: async (productId) => {
    // Check if user is logged in
    if (!useUserStore.getState().user) {
      toast.error("Please login to manage your cart");
      return false;
    }
    
    // Validate productId
    if (!productId) {
      console.error("Invalid productId:", productId);
      return false;
    }
    
    set({ loading: true, error: null });
    
    // Optimistically update the UI first
    set((prevState) => ({ 
      cart: prevState.cart.filter((item) => item._id !== productId),
      loading: true,
      error: null
    }));
    
    try {
      await axios.delete(`/cart`, { data: { productId } });
      set({ loading: false });
      get().calculateTotals();
      toast.success("Product removed from cart");
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      
      // Don't revert the UI - keep the optimistic update
      set({ loading: false, error: null });
      get().calculateTotals();
      return false;
    }
  },
  
  updateQuantity: async (productId, quantity) => {
    // Check if user is logged in
    if (!useUserStore.getState().user) {
      toast.error("Please login to manage your cart");
      return false;
    }
    
    // Validate inputs
    if (!productId || typeof quantity !== 'number') {
      console.error("Invalid productId or quantity:", { productId, quantity });
      return false;
    }
    
    // If quantity is 0, remove the item
    if (quantity === 0) {
      return get().removeFromCart(productId);
    }
    
    // Update optimistically
    set((prevState) => ({
      loading: true,
      cart: prevState.cart.map((item) => 
        item._id === productId ? { ...item, quantity } : item
      )
    }));
    
    try {
      await axios.put(`/cart/${productId}`, { quantity });
      set({ loading: false, error: null });
      get().calculateTotals();
      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      
      // Don't revert the UI - keep the optimistic update
      set({ loading: false, error: null });
      get().calculateTotals();
      return false;
    }
  },
  
  calculateTotals: () => {
    const { cart, coupon, isCouponApplied } = get();
    
    // Calculate subtotal, handling potential invalid data
    const subtotal = cart.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return sum + (price * quantity);
    }, 0);
    
    // Initialize total with subtotal
    let total = subtotal;

    // Apply coupon discount if available and applied
    if (coupon && isCouponApplied && typeof coupon.discountPercentage === 'number') {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = Math.max(0, subtotal - discount); // Ensure total is never negative
    }

    // Update state with calculated values
    set({ subtotal, total });
  },
  
  clearError: () => set({ error: null }),
}));