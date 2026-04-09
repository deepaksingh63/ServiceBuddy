import express from "express";
import { getProviderDashboard } from "../controllers/providerController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/dashboard", protect, authorize("provider"), asyncHandler(getProviderDashboard));

export default router;
