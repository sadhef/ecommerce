import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,
  error: null,
  loading: false,

  getMyCoupon: async () => {
    try {
      const response = await axios.get("/coupons");
      if (response && response.data) {
        set({ coupon: response.data });
      }
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },
  
  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/coupons/validate", { code });
      if (response && response.data) {
        set({ coupon: response.data, isCouponApplied: true });
        get().calculateTotals();
        toast.success("Coupon applied successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },
  
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  getCartItems: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/cart");
      
      // Check if response is valid
      if (res && res.data) {
        set({ 
          cart: Array.isArray(res.data) ? res.data : [], 
          loading: false,
          error: null
        });
        get().calculateTotals();
      } else {
        // Handle empty response
        set({ 
          cart: [], 
          loading: false,
          error: null
        });
        get().calculateTotals();
      }
    } catch (error) {
      console.error("Cart loading error:", error);
      
      // Provide more specific error messages based on error type
      const errorMessage = error.response?.status === 401 
        ? "Please log in to view your cart" 
        : error.response?.data?.message || "An error occurred loading cart";
      
      set({ 
        cart: [], 
        loading: false, 
        error: errorMessage 
      });
      
      // Only show toast for network errors, not for auth issues
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
    }
  },
  
  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
  },
  
  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart");

      set((prevState) => {
        const existingItem = prevState.cart.find((item) => item._id === product._id);
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred adding to cart");
    }
  },
  
  removeFromCart: async (productId) => {
    try {
      await axios.delete(`/cart`, { data: { productId } });
      set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove item from cart");
    }
  },
  
  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromCart(productId);
      return;
    }

    try {
      await axios.put(`/cart/${productId}`, { quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    }
  },
  
  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let total = subtotal;

    if (coupon && coupon.discountPercentage) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
}));