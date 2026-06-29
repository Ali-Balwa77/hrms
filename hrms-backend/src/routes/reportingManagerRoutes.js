import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';

import {
  getEmployeesByReportingManager,
  transferEmployeesToNewTL
} from '../controllers/reportingManagerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get(
  '/employees/:tlId',
  asyncRoute(getEmployeesByReportingManager)
);

router.post(
  '/transfer',
  asyncRoute(transferEmployeesToNewTL)
);

export default router;