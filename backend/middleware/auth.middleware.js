import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Try to get token from multiple sources
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
        // If the header doesn't start with Bearer, use it directly
        accessToken = authHeader;
      }
    }
    
    // 3. Check if token is passed as a query parameter (for testing/debugging)
    if (!accessToken && req.query && req.query.token) {
      accessToken = req.query.token;
    }
    
    // 4. Check if token is in the body (some mobile browsers might send it this way)
    if (!accessToken && req.body && req.body.accessToken) {
      accessToken = req.body.accessToken;
    }

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select("-password -refreshToken");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.log("Token verification error:", error.name, error.message);
      
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized - Access token expired" });
      }
      
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }
      
      throw error;
    }
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res.status(401).json({ message: "Unauthorized - Authentication failed" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};