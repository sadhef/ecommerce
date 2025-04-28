import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB, ensureDbConnected } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB immediately on startup
// Use an IIFE to allow async/await
(async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully on server startup");
  } catch (error) {
    console.error("Initial MongoDB connection failed:", error.message);
    // Continue execution - we'll retry connection when needed
  }
})();

// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in development or if no origin (like Postman requests)
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Define allowed origins for production
    const allowedOrigins = [
      'https://ri-carts.vercel.app',
      process.env.CLIENT_URL,
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Allow all origins for now to debug
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token', 'X-Requested-With']
}));

// Add preflight response for OPTIONS requests
app.options('*', cors());

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (error) {
    console.error("Database connection error in middleware:", error.message);
    return res.status(500).json({ 
      message: 'Database connection error', 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await ensureDbConnected();
    res.status(200).json({ 
      message: 'API is running',
      database: 'connected' 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'API is running, but database is disconnected',
      error: error.message
    });
  }
});

// API routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/coupons", couponRoutes);
app.use("/payments", paymentRoutes);
app.use("/analytics", analyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ 
    message: 'Something went wrong on the server!', 
    error: err.message,
    // Include more details in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server for development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel serverless deployment
export default app;