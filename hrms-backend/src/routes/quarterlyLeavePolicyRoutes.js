import express from "express";
import asyncRoute from "../middleware/asyncRoute.js";
import { protect } from "../middleware/authMiddleware.js";

import {
  createQuarterlyLeavePolicy,
  getQuarterlyLeavePolicies,
  getQuarterlyLeavePolicyById,
  updateQuarterlyLeavePolicy,
  deleteQuarterlyLeavePolicy,
  applyQuarterlyLeaveAllocation,
  getQuarterlyLeaveAllocationLogs,
} from "../controllers/quarterlyLeavePolicyController.js";

const router = express.Router();

router.use(protect);

router.post("/", asyncRoute(createQuarterlyLeavePolicy));
router.get("/", asyncRoute(getQuarterlyLeavePolicies));
router.get("/:id", asyncRoute(getQuarterlyLeavePolicyById));
router.patch("/:id", asyncRoute(updateQuarterlyLeavePolicy));
router.delete("/:id", asyncRoute(deleteQuarterlyLeavePolicy));

router.post("/:id/apply-allocation", asyncRoute(applyQuarterlyLeaveAllocation));
router.get("/:id/allocation-logs", asyncRoute(getQuarterlyLeaveAllocationLogs));

export default router;