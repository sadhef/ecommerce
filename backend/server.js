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

// CORS configuration - Allow specific origins
const corsOptions = {
  origin: function(origin, callback) {
    // List all possible frontend URLs
    const allowedOrigins = [
      'https://ri-cart.vercel.app',
      'https://ri-carts.vercel.app',
      'https://ecommerce-h3q3.vercel.app',
      'http://localhost:5173', // Development frontend
      undefined, // For same-origin requests or Postman
    ];
    
    if (allowedOrigins.includes(origin) || !origin || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not in allowed list`);
      callback(null, true); // Allow all origins for now, but log them
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Add preflight response for OPTIONS requests
app.options('*', cors(corsOptions));

// Add explicit CORS headers for all routes as a backup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin(origin, (err, allowed) => allowed)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Refresh-Token');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  next();
});

// Database connection middleware - verify connection before processing any request
app.use(async (req, res, next) => {
  try {
    // Skip connection check for health endpoint to avoid circular dependency
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }
    
    const isConnected = await ensureDbConnected();
    if (!isConnected) {
      return res.status(503).json({ 
        message: 'Database service temporarily unavailable. Please try again later.', 
        status: 'disconnected',
        serverTime: new Date().toISOString()
      });
    }
    next();
  } catch (error) {
    console.error("Database connection error in middleware:", error.message);
    return res.status(503).json({ 
      message: 'Database service unavailable', 
      error: error.message,
      serverTime: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  const dbStatus = getConnectionStatus();
  
  if (dbStatus.readyState === 1) {
    res.status(200).json({ 
      message: 'API is running',
      database: dbStatus,
      serverTime: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  } else {
    // Return 200 but indicate DB is not connected
    res.status(200).json({ 
      message: 'API is running but database is not fully connected',
      database: dbStatus,
      serverTime: new Date().toISOString(),
      env: process.env.NODE_ENV
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
  const origin = req.headers.origin;
  if (corsOptions.origin(origin, (err, allowed) => allowed)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(statusCode).json({ 
    message, 
    error: err.message,
    serverTime: new Date().toISOString(),
    // Include more details in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  // Set CORS headers even in 404 responses
  const origin = req.headers.origin;
  if (corsOptions.origin(origin, (err, allowed) => allowed)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    serverTime: new Date().toISOString()
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