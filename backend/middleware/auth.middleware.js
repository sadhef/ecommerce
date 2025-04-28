import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ensureDbConnected } from "../lib/db.js";

/**
 * Middleware to protect routes - verifies JWT and loads user
 */
export const protectRoute = async (req, res, next) => {
  try {
    // Get token from various sources
    let accessToken = null;
    
    // 1. Check cookies
    if (req.cookies && req.cookies.accessToken) {
      accessToken = req.cookies.accessToken;
    }
    
    // 2. Check Authorization header
    if (!accessToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.substring(7);
      } else {
        accessToken = authHeader;
      }
    }
    
    // 3. Check query parameter
    if (!accessToken && req.query && req.query.token) {
      accessToken = req.query.token;
    }
    
    // 4. Check body
    if (!accessToken && req.body && req.body.accessToken) {
      accessToken = req.body.accessToken;
    }

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    try {
      // Verify token
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      
      // Ensure database connection before user lookup
      await ensureDbConnected();
      
      // Find user with timeout
      const user = await User.findById(decoded.userId)
        .select("-password -refreshToken")
        .maxTimeMS(5000);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.log("Token verification error:", error.name, error.message);
      
      // Handle database connection errors
      if (error.name === 'MongoServerSelectionError' || 
          error.message.includes('buffering timed out') ||
          error.name === 'MongooseServerSelectionError') {
        return res.status(503).json({ 
          message: "Database service unavailable. Please try again later."
        });
      }
      
      // Handle token errors
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized - Access token expired" });
      }
      
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    return res.status(401).json({ message: "Unauthorized - Authentication failed" });
  }
};

/**
 * Middleware to restrict routes to admin users only
 */
export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};