import express from "express";
import {
  createBooking,
  deleteBookingHistory,
  getMyBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadCompletionProof, uploadProblemImage } from "../middleware/uploadMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.use(protect);
router.get("/", asyncHandler(getMyBookings));
router.post("/", uploadProblemImage.single("problemImage"), asyncHandler(createBooking));
router.patch("/:id/status", uploadCompletionProof.single("completionProof"), asyncHandler(updateBookingStatus));
router.delete("/:id", asyncHandler(deleteBookingHistory));

export default router;
