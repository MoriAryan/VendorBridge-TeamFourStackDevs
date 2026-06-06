import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public routes (no auth required) ────────────────────────
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);

// ── Protected routes (must be logged in) ────────────────────
router.route("/logout").post(verifyJWT, logout);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;
