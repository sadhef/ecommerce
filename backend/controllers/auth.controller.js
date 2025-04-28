import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

// Store active tokens in memory
const activeTokens = new Map();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "7d", // Longer expiration since we're not using refresh tokens
  });
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const user = await User.create({ name, email, password });
    
    // Generate a token
    const token = generateToken(user._id);
    
    // Store token in memory
    activeTokens.set(user._id.toString(), token);
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Generate a token
      const token = generateToken(user._id);
      
      // Store token in memory
      activeTokens.set(user._id.toString(), token);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // Get user ID from request (added by auth middleware)
    const userId = req.user?._id.toString();
    
    if (userId) {
      // Remove token from memory store
      activeTokens.delete(userId);
    }
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    res.json(req.user);
  } catch (error) {
    console.log("Error in getProfile controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Simple test endpoint to verify auth routes are working
export const testAuth = async (req, res) => {
  res.json({ message: "Auth endpoint working correctly" });
};