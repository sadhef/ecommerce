import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.log("Token verification error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized - Access token expired" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const adminRoute = (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Access denied - Admin only" });
    }
  } catch (error) {
    console.log("Error in adminRoute middleware", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};