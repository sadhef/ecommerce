import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Handle __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// CORS configuration for Vercel deployment
app.use((req, res, next) => {
  // Get the origin of the request
  const origin = req.headers.origin;
  
  // Allow requests from frontend URL in production, or localhost in development
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:5173';
  
  if (origin === frontendUrl) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Simple route to verify API is working
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// API routes - no /api prefix since the entire backend is the API
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/coupons", couponRoutes);
app.use("/payments", paymentRoutes);
app.use("/analytics", analyticsRoutes);

// Connect to MongoDB (with connection reuse for serverless)
let isConnected = false;

const connectToDatabase = async (req, res, next) => {
  if (isConnected) {
    return next();
  }
  
  try {
    await connectDB();
    isConnected = true;
    return next();
  } catch (error) {
    console.error("Error connecting to database:", error);
    return res.status(500).json({ error: "Database connection failed" });
  }
};

// Apply database connection middleware to all routes
app.use(connectToDatabase);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!', error: err.message });
});

// Start server for development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel serverless deployment
export default app;