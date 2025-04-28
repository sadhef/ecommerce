import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ensureDbConnected } from "../lib/db.js";

/**
 * Generate access and refresh tokens for a user
 * @param {string} userId - User ID to include in the token
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

/**
 * Store refresh token in user document
 * @param {string} userId - User ID
 * @param {string} refreshToken - Token to store
 */
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await User.findByIdAndUpdate(
      userId, 
      { refreshToken },
      { new: true }
    ).maxTimeMS(5000);
  } catch (error) {
    console.error("Error storing refresh token:", error.message);
    throw error;
  }
};

/**
 * Set cookies with appropriate security options
 * @param {Object} res - Express response object
 * @param {string} accessToken - Access token to set in cookie
 * @param {string} refreshToken - Refresh token to set in cookie
 */
const setCookies = (res, accessToken, refreshToken) => {
  // For Vercel deployment with separate frontend/backend
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure in production
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Set cookies
  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

/**
 * User signup controller
 */
export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  
  // Basic validation
  if (!email || !password || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }
  
  try {
    // Ensure DB is connected
    await ensureDbConnected();
    
    // Use a timeout to prevent hanging operations
    const userExists = await User.findOne({ email }).maxTimeMS(5000);

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create new user
    const user = await User.create({ name, email, password });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    // Set cookies
    setCookies(res, accessToken, refreshToken);

    // Return user info and tokens
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("Error in signup controller:", error);
    
    // Specific error handling for known issues
    if (error.name === 'MongoServerSelectionError' || 
        error.message.includes('buffering timed out') ||
        error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        message: "Database service unavailable. Please try again later.",
      });
    }
    
    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: "Server error during signup" });
  }
};

/**
 * User login controller
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  
  try {
    // Ensure DB is connected
    await ensureDbConnected();
    
    // Find user with timeout
    const user = await User.findOne({ email }).maxTimeMS(5000);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    
    // Set cookies
    setCookies(res, accessToken, refreshToken);

    // Return user info and tokens
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    
    // Check if it's a database connection issue
    if (error.name === 'MongoServerSelectionError' || 
        error.message.includes('buffering timed out') ||
        error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        message: "Database service unavailable. Please try again later."
      });
    }
    
    res.status(500).json({ message: "Server error during login" });
  }
};

/**
 * User logout controller
 */
export const logout = async (req, res) => {
  try {
    // Get refresh token from various sources
    const refreshToken = 
      req.cookies.refreshToken || 
      req.headers['x-refresh-token'] || 
      (req.body && req.body.refreshToken);
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Ensure DB is connected
        await ensureDbConnected();
        
        // Clear refresh token from user document
        await User.findByIdAndUpdate(
          decoded.userId, 
          { refreshToken: null },
          { new: true }
        ).maxTimeMS(5000);
      } catch (err) {
        // Continue with logout even if token verification fails
        console.log("Error during logout token verification:", err.message);
      }
    }

    // Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      path: "/"
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

/**
 * Refresh token controller
 */
export const refreshToken = async (req, res) => {
  try {
    // Get refresh token from various sources
    const tokenFromRequest = 
      req.cookies.refreshToken || 
      req.headers['x-refresh-token'] || 
      (req.body && req.body.refreshToken);

    if (!tokenFromRequest) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(tokenFromRequest, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Refresh token expired" });
      }
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Ensure DB is connected
    await ensureDbConnected();
    
    // Find user and verify token
    const user = await User.findById(decoded.userId).maxTimeMS(5000);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (user.refreshToken !== tokenFromRequest) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId }, 
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: "15m" }
    );

    // Set cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      path: "/"
    };

    res.cookie("accessToken", accessToken, cookieOptions);

    // Return token in response body
    res.json({ 
      message: "Token refreshed successfully",
      accessToken
    });
  } catch (error) {
    console.error("Error in refreshToken controller:", error);
    
    // Database connection issues
    if (error.name === 'MongoServerSelectionError' || 
        error.message.includes('buffering timed out') ||
        error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        message: "Database service unavailable. Please try again later."
      });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user profile controller
 */
export const getProfile = async (req, res) => {
  try {
    // User is already loaded by protectRoute middleware
    res.json(req.user);
  } catch (error) {
    console.error("Error in getProfile controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};