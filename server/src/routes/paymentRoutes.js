import express from "express";
import { confirmOnlineQrPayment, createOrder, payByCash, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.use(protect);
router.post("/create-order", asyncHandler(createOrder));
router.post("/cash", asyncHandler(payByCash));
router.post("/confirm-online", asyncHandler(confirmOnlineQrPayment));
router.post("/verify", asyncHandler(verifyPayment));

export default router;
