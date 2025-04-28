import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import { useState } from "react";
import toast from "react-hot-toast";

// Initialize Stripe outside of component to avoid re-initialization
let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    // Replace with your actual Stripe public key
    stripePromise = loadStripe(
      "pk_test_51KZYccCoOZF2UhtOwdXQl3vcizup20zqKqT9hVUIsVzsdBrhqbUI2fE0ZdEVLdZfeHjeyFXtqaNsyCJCmZWnjNZa00PzMAjlcL"
    );
  }
  return stripePromise;
};

const OrderSummary = () => {
  const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);
  const formattedSavings = savings.toFixed(2);

  const handlePayment = async () => {
    // Prevent multiple clicks
    if (isProcessing) return;
    
    // Reset error state
    setPaymentError(null);
    
    // Validate cart is not empty
    if (!cart || cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get Stripe instance
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Could not initialize Stripe");
      }
      
      // Create checkout session
      const response = await axios.post("/payments/create-checkout-session", {
        products: cart,
        couponCode: coupon ? coupon.code : null,
      });
      
      if (!response.data || !response.data.id) {
        throw new Error("Invalid response from server");
      }
      
      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: response.data.id,
      });
      
      // Handle any errors from redirect
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(error.message || "Failed to process payment. Please try again later.");
      toast.error("Payment process failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-[#FF6B9C]/30 bg-[#3D2A33] p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-[#FF6B9C]">Order summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-pink-100">Original price</dt>
            <dd className="text-base font-medium text-white">${formattedSubtotal}</dd>
          </dl>

          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-pink-100">Savings</dt>
              <dd className="text-base font-medium text-[#FF6B9C]">-${formattedSavings}</dd>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-pink-100">Coupon ({coupon.code})</dt>
              <dd className="text-base font-medium text-[#FF6B9C]">-{coupon.discountPercentage}%</dd>
            </dl>
          )}
          <dl className="flex items-center justify-between gap-4 border-t border-[#FF6B9C]/30 pt-2">
            <dt className="text-base font-bold text-white">Total</dt>
            <dd className="text-base font-bold text-[#FF6B9C]">${formattedTotal}</dd>
          </dl>
        </div>

        {paymentError && (
          <div className="bg-red-900/30 border border-red-400/30 text-red-300 p-3 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{paymentError}</p>
          </div>
        )}

        <motion.button
          className="flex w-full items-center justify-center rounded-lg bg-[#E84D8A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#FF6B9C] focus:outline-none focus:ring-4 focus:ring-[#FF6B9C]/50 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isProcessing ? 1 : 1.05 }}
          whileTap={{ scale: isProcessing ? 1 : 0.95 }}
          onClick={handlePayment}
          disabled={isProcessing || cart.length === 0}
        >
          {isProcessing ? "Processing..." : "Proceed to Checkout"}
        </motion.button>

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-normal text-pink-200">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#FF6B9C] underline hover:text-[#FFA5C3] hover:no-underline"
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
export default OrderSummary;