import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import {
  createLeaveType,
  deleteLeaveType,
  getAllLeaveTypes,
  // getLeaveBalance,
  getLeaveTypeById,
  getLeaveTypes,
  updateLeaveType,
} from '../controllers/leaveTypeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/', asyncRoute(createLeaveType));
router.get('/', asyncRoute(getLeaveTypes));
router.get('/all', asyncRoute(getAllLeaveTypes));
// router.get(
//   "/leave-balance/:employeeId/:leaveTypeId",
//   asyncRoute(getLeaveBalance)
// );
router.get('/:id', asyncRoute(getLeaveTypeById));
router.patch('/:id', asyncRoute(updateLeaveType));
router.delete('/:id', asyncRoute(deleteLeaveType));

export default router;