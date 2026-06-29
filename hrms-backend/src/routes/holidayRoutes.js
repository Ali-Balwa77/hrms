import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import {
  createHoliday,
  deleteHoliday,
  getHolidayById,
  getHolidays,
  updateHoliday
} from '../controllers/holidayController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(checkPermission("holiday","read"),asyncRoute(getHolidays))
  .post(checkPermission("holiday","create"), asyncRoute(createHoliday));

router
  .route('/:id')
  .get(checkPermission("holiday","read"),asyncRoute(getHolidayById))
  .patch(checkPermission("holiday","update"), asyncRoute(updateHoliday))
  .delete(checkPermission("holiday","delete"), asyncRoute(deleteHoliday));

export default router;

