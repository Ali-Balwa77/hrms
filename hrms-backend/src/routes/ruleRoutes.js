import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import { createRule, getRules, updateRule, deleteRule, deleteMultipleRules } from '../controllers/ruleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permission.js';
 
const router = express.Router();
 
router.use(protect);
 

router.route('/bulk-delete').post(checkPermission("rule", "delete"), asyncRoute(deleteMultipleRules));
 
router
  .route('/')
  .get(checkPermission("rule", "read"), asyncRoute(getRules))
  .post(checkPermission("rule", "create"), asyncRoute(createRule));
 
router.route('/:id')
  .patch(checkPermission("rule", "update"), asyncRoute(updateRule))
  .delete(checkPermission("rule", "delete"), asyncRoute(deleteRule));
 
export default router;

