import express from "express";
import {
  createService,
  deleteService,
  getServiceById,
  getProviderServices,
  getServices,
  getTopProviders,
  updateService,
} from "../controllers/serviceController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getServices));
router.get("/top-providers", asyncHandler(getTopProviders));
router.get("/provider/mine", protect, authorize("provider"), asyncHandler(getProviderServices));
router.get("/:id", asyncHandler(getServiceById));
router.post("/", protect, authorize("provider"), asyncHandler(createService));
router.put("/:id", protect, authorize("provider"), asyncHandler(updateService));
router.delete("/:id", protect, authorize("provider"), asyncHandler(deleteService));

export default router;
