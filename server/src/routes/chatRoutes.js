import express from "express";
import { getMessages, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.use(protect);
router.get("/:bookingId", asyncHandler(getMessages));
router.post("/", asyncHandler(sendMessage));

export default router;
