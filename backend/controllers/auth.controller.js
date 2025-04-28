import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    // Basic validation
    if (!req.body || !req.body.email || !req.body.password || !req.body.name) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    
    const { email, password, name } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create user
    const user = await User.create({ name, email, password });
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET || 'fallback-secret-key-for-development',
      { expiresIn: '7d' }
    );
    
    // Return user data with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    // Basic request validation
    if (!req.body || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const { email, password } = req.body;
    
    // Find user with error handling
    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    
    // Compare password
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
    } catch (pwError) {
      console.error("Password comparison error:", pwError);
      return res.status(500).json({ message: "Password verification error" });
    }
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    
    // Create token
    let token;
    try {
      token = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET || 'fallback-secret-key-for-development',
        { expiresIn: '7d' }
      );
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      return res.status(500).json({ message: "Authentication token generation failed" });
    }
    
    // Send response
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

export const logout = async (req, res) => {
  // No server-side logout needed for token auth
  // Token invalidation is handled client-side by removing the token
  res.json({ message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const testAuth = (req, res) => {
  res.json({ message: "Auth endpoint working" });
};

export const debugLogin = async (req, res) => {
  try {
    // Just echo back the request data for debugging
    res.json({ 
      received: req.body,
      message: "Debug login endpoint working" 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};