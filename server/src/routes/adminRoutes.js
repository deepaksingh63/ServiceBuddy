import express from "express";
import {
  approveProvider,
  getAdminDashboard,
  updateUserRole,
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/dashboard", asyncHandler(getAdminDashboard));
router.patch("/providers/:id/approval", asyncHandler(approveProvider));
router.patch("/users/:id/role", asyncHandler(updateUserRole));

export default router;
