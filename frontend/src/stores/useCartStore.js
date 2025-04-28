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
      set({ coupon: response.data, loading: false, error: null });
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
    
    set({ loading: true, error: null });
    try {
      const response = await axios.post("/coupons/validate", { code });
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
    set({ coupon: null, isCouponApplied: false, error: null });
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
      set({ cart: res.data || [], loading: false, error: null });
      get().calculateTotals();
      return res.data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Don't show error toast for authentication issues
      set({ cart: [], loading: false, error: null });
      return [];
    }
  },
  
  clearCart: async () => {
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
    
    set({ loading: true, error: null });
    try {
      await axios.post("/cart", { productId: product._id });
      
      set((prevState) => {
        const existingItem = prevState.cart.find((item) => item._id === product._id);
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart, loading: false, error: null };
      });
      
      get().calculateTotals();
      toast.success("Product added to cart");
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = "Failed to add product to cart. Please login and try again.";
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
    
    set({ loading: true, error: null });
    try {
      await axios.delete(`/cart`, { data: { productId } });
      set((prevState) => ({ 
        cart: prevState.cart.filter((item) => item._id !== productId),
        loading: false,
        error: null
      }));
      get().calculateTotals();
      toast.success("Product removed from cart");
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      // Optimistically update UI even if API fails
      set((prevState) => ({ 
        cart: prevState.cart.filter((item) => item._id !== productId),
        loading: false,
        error: null
      }));
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
    
    if (quantity === 0) {
      return get().removeFromCart(productId);
    }

    set({ loading: true, error: null });
    try {
      await axios.put(`/cart/${productId}`, { quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) => 
          item._id === productId ? { ...item, quantity } : item
        ),
        loading: false,
        error: null
      }));
      get().calculateTotals();
      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      // Optimistically update UI even if API fails
      set((prevState) => ({
        cart: prevState.cart.map((item) => 
          item._id === productId ? { ...item, quantity } : item
        ),
        loading: false,
        error: null
      }));
      get().calculateTotals();
      return false;
    }
  },
  
  calculateTotals: () => {
    const { cart, coupon, isCouponApplied } = get();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let total = subtotal;

    if (coupon && isCouponApplied) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
  
  clearError: () => set({ error: null }),
}));