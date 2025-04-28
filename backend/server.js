import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB, ensureDbConnected, getConnectionStatus } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

// Load environment variables early
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
    // Continue execution - serverless functions will try to reconnect when needed
  }
})();

// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// CORS configuration - UPDATED TO ALLOW ALL ORIGINS FOR NOW
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in development
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // List all possible frontend URLs - MAKE SURE YOUR ACTUAL FRONTEND URL IS HERE
    const allowedOrigins = [
      'https://ri-cart.vercel.app',
      'https://ri-carts.vercel.app',
      'https://ecommerce-h3q3.vercel.app',
      process.env.CLIENT_URL,
    ].filter(Boolean);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For debugging purposes - allow all origins temporarily
      console.log(`Origin ${origin} not in allowed list ${allowedOrigins}, but allowing for debugging`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token', 'X-Requested-With']
}));

// Add preflight response for OPTIONS requests
app.options('*', cors());

// Add explicit CORS headers for all routes as a backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Refresh-Token');
  next();
});

// Database connection middleware - verify connection before processing any request
app.use(async (req, res, next) => {
  try {
    // Skip connection check for health endpoint to avoid circular dependency
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }
    
    await ensureDbConnected();
    next();
  } catch (error) {
    console.error("Database connection error in middleware:", error.message);
    return res.status(503).json({ 
      message: 'Database service unavailable', 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  const dbStatus = getConnectionStatus();
  
  if (dbStatus.readyState === 1) {
    res.status(200).json({ 
      message: 'API is running',
      database: dbStatus
    });
  } else {
    // Return 200 but indicate DB is not connected
    res.status(200).json({ 
      message: 'API is running but database is not fully connected',
      database: dbStatus
    });
  }
});

// API routes with proper prefixing
const apiPrefix = '/api';

// Apply routes with proper prefixing
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/cart`, cartRoutes);
app.use(`${apiPrefix}/coupons`, couponRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);

// For backwards compatibility - also expose routes without /api prefix
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/coupons", couponRoutes);
app.use("/payments", paymentRoutes);
app.use("/analytics", analyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  
  // Check if it's a MongoDB-related error
  const isMongoError = err.name === 'MongoError' || 
                      err.name === 'MongoServerError' || 
                      err.name === 'MongooseServerSelectionError' ||
                      (err.message && (
                        err.message.includes('MongoDB') || 
                        err.message.includes('mongo') || 
                        err.message.includes('buffering timed out')
                      ));
  
  const statusCode = isMongoError ? 503 : 500;
  const message = isMongoError ? 
    'Database service unavailable. Please try again later.' : 
    'Something went wrong on the server!';
  
  // Set CORS headers even in error responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(statusCode).json({ 
    message, 
    error: err.message,
    // Include more details in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  // Set CORS headers even in 404 responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({ message: 'API endpoint not found' });
});

// Start server for development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel serverless deployment
export default app;