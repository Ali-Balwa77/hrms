import express from "express";
import asyncRoute from "../middleware/asyncRoute.js";
import {
  createRole,
  deleteRole,
  getActiveRoles,
  getPermissionMaster,
  getRole,
  getRoleById,
  updateRole,
} from "../controllers/roleController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permission.js";

const router = express.Router();

router.use(protect);

router.get("/permission-master", checkPermission("role", "read"), asyncRoute(getPermissionMaster));
router.get("/active", checkPermission("employee", "read"), asyncRoute(getActiveRoles));
router.route("/").get(checkPermission("role", "read"), asyncRoute(getRole)).post(checkPermission("role", "create"), asyncRoute(createRole));
router
  .route("/:id")
  .get(checkPermission("role", "read"), asyncRoute(getRoleById))
  .patch(checkPermission("role", "update"), asyncRoute(updateRole))
  .delete(checkPermission("role", "delete"), asyncRoute(deleteRole));

export default router;
