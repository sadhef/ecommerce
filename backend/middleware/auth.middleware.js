import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Not authenticated - No valid token" });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token, 
        process.env.ACCESS_TOKEN_SECRET || 'fallback-secret-key-for-development'
      );
    } catch (tokenError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    // Find user
    let user;
    try {
      user = await User.findById(decoded.userId).select("-password");
    } catch (userError) {
      return res.status(500).json({ message: "Database error finding user" });
    }
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Set user on request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Server authentication error" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Admin access only" });
  }
};