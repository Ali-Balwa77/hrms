import express from "express";
import asyncRoute from "../middleware/asyncRoute.js";
import {
  getAccessUserById,
  getAccessUsers,
  resetAccessUserPassword,
  updateAccessUser,
} from "../controllers/userAccessController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permission.js";

const router = express.Router();

router.use(protect);

router.get("/", checkPermission("user", "read"), asyncRoute(getAccessUsers));
router.get("/:id", checkPermission("user", "read"), asyncRoute(getAccessUserById));
router.patch("/:id", checkPermission("user", "update"), asyncRoute(updateAccessUser));
router.post("/:id/reset-password", checkPermission("user", "update"), asyncRoute(resetAccessUserPassword));

export default router;
