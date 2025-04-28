import express from "express";
import { 
  login, 
  logout, 
  signup, 
  getProfile, 
  testAuth,
  debugLogin
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.get("/test-auth", testAuth);
router.post("/debug-login", debugLogin);

// Protected routes
router.post("/logout", protectRoute, logout);
router.get("/profile", protectRoute, getProfile);

export default router;