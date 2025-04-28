import express from "express";
import { 
  login, 
  logout, 
  signup, 
  getProfile, 
  testAuth 
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protectRoute, logout); // Require authentication for logout
router.get("/profile", protectRoute, getProfile);

export default router;