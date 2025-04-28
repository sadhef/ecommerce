import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ensureDbConnected } from "../lib/db.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Instead of storing in Redis, store the token in the User model
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await ensureDbConnected();
    await User.findByIdAndUpdate(userId, { refreshToken });
  } catch (error) {
    console.error("Error storing refresh token:", error.message);
    throw error;
  }
};

// Set cookies with appropriate options
const setCookies = (res, accessToken, refreshToken) => {
  // For Vercel deployment with separate frontend/backend
  const cookieOptions = {
    httpOnly: true,
    secure: true, // Always use secure for cross-domain
    sameSite: "none", // Required for cross-site cookie setting
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/", // Ensure path is set
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Set cookies (these may not work on all mobile browsers)
  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    await ensureDbConnected();
    
    const userExists = await User.findOne({ email }).maxTimeMS(5000);

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    // authenticate
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    // Set cookies for browsers that support them
    setCookies(res, accessToken, refreshToken);

    // Return tokens in response body for mobile
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken, // Include tokens in response body for mobile clients
      refreshToken
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
      return res.status(500).json({ 
        message: "Database connection error. Please try again later.",
        error: error.message
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Ensure database is connected before operations
    await ensureDbConnected();
    
    // Add maxTimeMS to prevent hanging operations
    const user = await User.findOne({ email }).maxTimeMS(5000);

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      
      // Set cookies for browsers that support them
      setCookies(res, accessToken, refreshToken);

      // Return tokens in body for mobile apps
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", error.message);
    
    // Special handling for database connection errors
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
      return res.status(500).json({ 
        message: "Database connection error. Please try again later.",
        error: error.message
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // Get refresh token from various possible sources
    const refreshToken = 
      req.cookies.refreshToken || 
      req.headers['x-refresh-token'] || 
      (req.body && req.body.refreshToken);
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        // Ensure database connection before user update
        await ensureDbConnected();
        // Remove token from user document
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null }).maxTimeMS(5000);
      } catch (err) {
        console.log("Error verifying token during logout:", err.message);
        // Continue with logout even if token verification fails
      }
    }

    // Clear cookies with appropriate settings for cross-domain
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
  try {
    // Get refresh token from various possible sources
    const refreshToken = 
      req.cookies.refreshToken || 
      req.headers['x-refresh-token'] || 
      (req.body && req.body.refreshToken);

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Ensure database connection before user lookup
    await ensureDbConnected();
    
    // Find user and check if refresh token matches
    const user = await User.findById(decoded.userId).maxTimeMS(5000);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

    // Set cookie with appropriate settings for cross-domain
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/"
    };

    res.cookie("accessToken", accessToken, cookieOptions);

    // Return token in response body for mobile clients
    res.json({ 
      message: "Token refreshed successfully",
      accessToken
    });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    
    // Special handling for database connection errors
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
      return res.status(500).json({ 
        message: "Database connection error. Please try again later.",
        error: error.message
      });
    }
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    // User is already loaded in req.user by the protectRoute middleware
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};