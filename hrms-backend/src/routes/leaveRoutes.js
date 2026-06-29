import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import {
  applyLeave,
  deleteLeave,
  getLeaveById,
  getLeaves,
  updateLeave,
  approveLeave,
  getEmployeeLeaves,
  leavesTrends,
  getTeamLeaves,
  getLeaveCalendar,
  getPendingLeaveCountForTL
} from '../controllers/leaveController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

router.use(protect);

router.route('/').get(checkPermission("leave","read"),asyncRoute(getLeaves)).post(checkPermission("leave","create"),asyncRoute(applyLeave));
router.route('/trends').get(asyncRoute(leavesTrends));  
router.route('/calendar').get(checkPermission("leave","read"), asyncRoute(getLeaveCalendar));
router.route('/team_leaves').get(checkPermission("leave","read"),asyncRoute(getTeamLeaves));  
router.route('/pending_count').get(checkPermission("leave","read"),asyncRoute(getPendingLeaveCountForTL));  
router.route('/employee/:employeeId').get(checkPermission("leave","read"),asyncRoute(getEmployeeLeaves));
router.route('/:id').get(checkPermission("leave","read"),asyncRoute(getLeaveById)).patch(checkPermission("leave","update"),asyncRoute(updateLeave)).delete(checkPermission("leave","delete"),asyncRoute(deleteLeave));
router.route('/:id/approve').patch(checkPermission("leave","approve"),asyncRoute(approveLeave));

export default router;

