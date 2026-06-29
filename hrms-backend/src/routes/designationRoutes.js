import express from "express";
import asyncRoute from "../middleware/asyncRoute.js";
import {
  createDesignation,
  getDesignations,
  getActiveDesignations,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/permission.js";

const router = express.Router();
router.use(protect);

router.get("/", checkPermission("designation","read"), asyncRoute(getDesignations));
router.get("/active", checkPermission("designation","read"), asyncRoute(getActiveDesignations));
router.post("/", checkPermission("designation","create"), asyncRoute(createDesignation));
router.patch("/:id", checkPermission("designation","update"), asyncRoute(updateDesignation));
router.delete("/:id", checkPermission("designation","delete"), asyncRoute(deleteDesignation));

export default router;