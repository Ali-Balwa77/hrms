import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import { protect } from '../middleware/authMiddleware.js';
import { getUnreadNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
 
const router = express.Router();
 
router.use(protect);
 
router
  .route('/unread')
  .get(asyncRoute(getUnreadNotifications));
 
router
  .route('/read-all')
  .patch(asyncRoute(markAllAsRead));
 
router
  .route('/:id/read')
  .patch(asyncRoute(markAsRead));
 
export default router;