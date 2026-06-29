import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import {
  checkIn,
  checkOut,
  getAttendanceList,
  getAttendanceReport,
  getEmployeeAttendance,
  getExprtReport,
  lunchIn,
  lunchOut
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

router.use(protect);

router.route('/report/export/:employeeId')
  .get(checkPermission("attendance", "read"), asyncRoute(getExprtReport));

router.route('/report/:employeeId')
  .get(checkPermission("attendance", "read"), asyncRoute(getAttendanceReport));

router
  .route('/')
  .get(checkPermission("attendance", "read"), asyncRoute(getAttendanceList));

router
  .route('/:employeeId')
  .get(checkPermission("attendance", "read"), asyncRoute(getEmployeeAttendance));
router.route('/check-in').post(checkPermission("attendance","create"),asyncRoute(checkIn));
router.route('/check-out').post(checkPermission("attendance","create"),asyncRoute(checkOut));
router.route('/lunch-in').post(checkPermission("attendance","create"),asyncRoute(lunchIn));
router.route('/lunch-out').post(checkPermission("attendance","create"),asyncRoute(lunchOut));


export default router;

