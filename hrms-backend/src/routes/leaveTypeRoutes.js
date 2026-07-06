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
import { checkAnyPermission, checkPermission } from '../middleware/permission.js';

const router = express.Router();
router.use(protect);

router.post('/', checkPermission("leave-type", "create"), asyncRoute(createLeaveType));
router.get(
  '/',
  checkAnyPermission([
    { module: "leave-type", action: "read" },
    { module: "leave", action: "create" },
    { module: "leave", action: "read" },
  ]),
  asyncRoute(getLeaveTypes)
);
router.get('/all', checkPermission("leave-type", "read"), asyncRoute(getAllLeaveTypes));
// router.get(
//   "/leave-balance/:employeeId/:leaveTypeId",
//   asyncRoute(getLeaveBalance)
// );
router.get('/:id', checkPermission("leave-type", "read"), asyncRoute(getLeaveTypeById));
router.patch('/:id', checkPermission("leave-type", "update"), asyncRoute(updateLeaveType));
router.delete('/:id', checkPermission("leave-type", "delete"), asyncRoute(deleteLeaveType));

export default router;
