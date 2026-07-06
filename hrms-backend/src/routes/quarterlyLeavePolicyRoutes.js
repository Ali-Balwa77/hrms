import express from "express";
import asyncRoute from "../middleware/asyncRoute.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permission.js";

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

router.post("/", checkPermission("leave-type", "create"), asyncRoute(createQuarterlyLeavePolicy));
router.get("/", checkPermission("leave-type", "read"), asyncRoute(getQuarterlyLeavePolicies));
router.get("/:id", checkPermission("leave-type", "read"), asyncRoute(getQuarterlyLeavePolicyById));
router.patch("/:id", checkPermission("leave-type", "update"), asyncRoute(updateQuarterlyLeavePolicy));
router.delete("/:id", checkPermission("leave-type", "delete"), asyncRoute(deleteQuarterlyLeavePolicy));

router.post("/:id/apply-allocation", checkPermission("leave-type", "update"), asyncRoute(applyQuarterlyLeaveAllocation));
router.get("/:id/allocation-logs", checkPermission("leave-type", "read"), asyncRoute(getQuarterlyLeaveAllocationLogs));

export default router;
