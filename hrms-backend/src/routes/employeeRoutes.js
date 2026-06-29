import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByTL,
  getTeamLeads
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';
import { canReadEmployeeDetail } from '../middleware/checkPermission.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(checkPermission("employee","read"),asyncRoute(getEmployees))
  .post(checkPermission("employee","create"), asyncRoute(createEmployee));

router.route('/teamEmployee/:_id').get(checkPermission("employee","read"),asyncRoute(getEmployeesByTL));  

router.route('/teamLeads').get(checkPermission("employee","read"),asyncRoute(getTeamLeads));

router
  .route('/:id')
  .get(canReadEmployeeDetail,asyncRoute(getEmployeeById))
  .patch(checkPermission("employee","update"),asyncRoute(updateEmployee))
  .delete(checkPermission("employee","delete"),asyncRoute(deleteEmployee));

export default router;

