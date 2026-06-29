import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';

import { authorize, protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';
import { approveCancellation, createLeaveCancellation, getCancellationById, getCancellationLeave, getMyLeaveCancellations, getTeamCancelLeaves } from '../controllers/leaveCancellationController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(checkPermission("leave","read"), asyncRoute(getCancellationLeave)).post(checkPermission("leave","create"), asyncRoute(createLeaveCancellation));  
router.route('/team_cancellations').get(checkPermission("leave","read"),asyncRoute(getTeamCancelLeaves));  
router.route('/employee/:employeeId').get(checkPermission("leave","read"), asyncRoute(getMyLeaveCancellations));
router.route('/:id').get(checkPermission("leave","read"), asyncRoute(getCancellationById));
router.route('/:id/approve').patch(checkPermission("leave","approve"), asyncRoute(approveCancellation));

export default router;  