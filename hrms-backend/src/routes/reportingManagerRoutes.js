import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';

import {
  getEmployeesByReportingManager,
  transferEmployeesToNewTL
} from '../controllers/reportingManagerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

router.use(protect);

router.get(
  '/employees/:tlId',
  checkPermission("employee", "read"),
  asyncRoute(getEmployeesByReportingManager)
);

router.post(
  '/transfer',
  checkPermission("employee", "update"),
  asyncRoute(transferEmployeesToNewTL)
);

export default router;
