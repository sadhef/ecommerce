import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables if not already loaded
dotenv.config();

// Get Stripe secret key with fallback
const getStripeSecretKey = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    console.warn("STRIPE_SECRET_KEY not found in environment variables. Using test key.");
    // Return Stripe test key (only for development - should be replaced in production)
    return "sk_test_51KZYccCoOZF2UhtOwdXQl3vcizup20zqKqT9hVUIsVzsdBrhqbUI2fE0ZdEVLdZfeHjeyFXtqaNsyCJCmZWnjNZa00PzMAjlcL";
  }
  
  return key;
};

// Initialize Stripe with appropriate configuration
export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: '2023-10-16', // Use a specific API version
  typescript: false,
  appInfo: {
    name: 'Ri-Carts E-commerce',
    version: '1.0.0'
  },
  maxNetworkRetries: 3, // Automatically retry requests on network failures
  timeout: 30000 // 30 second timeout
});