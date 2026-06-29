import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizations,
  updateOrganization
} from '../controllers/organizationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(checkPermission("organization","read"),asyncRoute(getOrganizations))
  .post(checkPermission("organization","create"),asyncRoute(createOrganization));

router
  .route('/:id')
  .get(checkPermission("organization","read"),asyncRoute(getOrganizationById))
  .patch(checkPermission("organization","update"),asyncRoute(updateOrganization))
  .delete(checkPermission("organization","delete"),asyncRoute(deleteOrganization));

export default router;

