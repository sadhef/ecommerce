import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,
  loading: false,
  error: null,

  getMyCoupon: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get("/coupons");
      set({ coupon: response.data, loading: false, error: null });
      return response.data;
    } catch (error) {
      console.error("Error fetching coupon:", error);
      set({ loading: false, error: "Failed to fetch coupon" });
      return null;
    }
  },
  
  applyCoupon: async (code) => {
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
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data || [], loading: false, error: null });
      get().calculateTotals();
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch cart items";
      set({ cart: [], loading: false, error: errorMessage });
      
      // Only show error if it's not a 401 (authentication error)
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
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
      const errorMessage = error.response?.data?.message || "Failed to add product to cart";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },
  
  removeFromCart: async (productId) => {
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
      const errorMessage = error.response?.data?.message || "Failed to remove product from cart";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },
  
  updateQuantity: async (productId, quantity) => {
    set({ loading: true, error: null });
    if (quantity === 0) {
      return get().removeFromCart(productId);
    }

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
      const errorMessage = error.response?.data?.message || "Failed to update quantity";
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
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