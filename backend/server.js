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

app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());

// CORS configuration for development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });
}

// Simple route to verify API is working
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// Serve static files if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  const frontendBuildPath = path.resolve(__dirname, '../frontend/dist');
  
  // Serve static files
  app.use(express.static(frontendBuildPath));
  
  // Handle SPA routing - redirect all non-API routes to React app
  app.get('*', (req, res) => {
    // Only handle non-API routes with the frontend
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!', error: err.message });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Run the server if this file is executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// For Vercel serverless functions
export default app;