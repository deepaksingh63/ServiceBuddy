import express from "express";
import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadProviderRegistration } from "../middleware/uploadMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/register",
  uploadProviderRegistration.fields([
    { name: "idProofDocument", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]),
  asyncHandler(register)
);
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password/:token", asyncHandler(resetPassword));
router.get("/me", protect, asyncHandler(getMe));

export default router;
