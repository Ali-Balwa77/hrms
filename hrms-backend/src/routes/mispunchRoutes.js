import express from "express";
import asyncRoute from "../middleware/asyncRoute.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permission.js";
import {
  approveMispunch,
  createMispunch,
  deleteMispunch,
  getEmployeeMispunches,
  getMispunchById,
  getMispunches,
  getPendingMispunches,
  updateMispunch,
} from "../controllers/mispunchController.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(checkPermission("mispunch", "read"), asyncRoute(getMispunches))
  .post(checkPermission("mispunch", "create"), asyncRoute(createMispunch));

router.route("/pending")
  .get(checkPermission("mispunch", "approve"), asyncRoute(getPendingMispunches));

router.route("/employee/:employeeId")
  .get(checkPermission("mispunch", "read"), asyncRoute(getEmployeeMispunches));

router.route("/:id")
  .get(checkPermission("mispunch", "read"), asyncRoute(getMispunchById))
  .patch(checkPermission("mispunch", "update"), asyncRoute(updateMispunch))
  .delete(checkPermission("mispunch", "delete"), asyncRoute(deleteMispunch));

router.route("/:id/approve")
  .patch(checkPermission("mispunch", "approve"), asyncRoute(approveMispunch));

export default router;
