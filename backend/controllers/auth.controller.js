import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

// Store refresh tokens in memory (this is not persistent across server restarts)
const refreshTokens = new Map();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
  // Common options for cross-origin cookies
  const cookieOptions = {
    httpOnly: true,
    secure: true, // Always use secure in production with Vercel
    sameSite: 'none', // Critical for cross-origin cookies
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const user = await User.create({ name, email, password });
    
    const { accessToken, refreshToken } = generateTokens(user._id);
    refreshTokens.set(user._id.toString(), refreshToken);
    
    setCookies(res, accessToken, refreshToken);
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Include tokens in response for local storage option
      tokens: {
        accessToken,
        refreshToken
      }
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
      const { accessToken, refreshToken } = generateTokens(user._id);
      refreshTokens.set(user._id.toString(), refreshToken);
      
      setCookies(res, accessToken, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Include tokens in response for local storage option
        tokens: {
          accessToken,
          refreshToken
        }
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
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        refreshTokens.delete(decoded.userId.toString());
      } catch (error) {
        // Invalid token, continue with logout
      }
    }

    // Also clear token from localStorage on client side
    
    // Clear cookies with appropriate options for cross-origin
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = refreshTokens.get(decoded.userId.toString());

    // Skip token verification in memory if not found (for development)
    if (!storedToken && process.env.NODE_ENV !== 'production') {
      console.log("Refresh token not found in memory, but proceeding for development");
    } else if (storedToken !== refreshToken && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // Set the new access token as a cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ 
      message: "Token refreshed successfully",
      accessToken // Include in response body for localStorage option
    });
  } catch (error) {
    console.log("Error in refreshToken controller", error);
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