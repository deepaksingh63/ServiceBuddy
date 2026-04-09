import express from "express";
import { addReview, getProviderReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/provider/:providerId", asyncHandler(getProviderReviews));
router.post("/", protect, asyncHandler(addReview));

export default router;
