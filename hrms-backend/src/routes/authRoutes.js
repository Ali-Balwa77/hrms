import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import { changePassword, login, profile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', asyncRoute(login));
router.get('/profile', protect, asyncRoute(profile));
router.patch('/updateProfile', protect, asyncRoute(updateProfile));
router.patch('/change-password', protect, asyncRoute(changePassword));

export default router;