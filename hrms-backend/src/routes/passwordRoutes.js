import express from 'express';
import asyncRoute from '../middleware/asyncRoute.js';
import { forgotPassword, resetPassword } from '../controllers/passwordController.js';

const router = express.Router();

router.post('/forgot', asyncRoute(forgotPassword));
router.post('/reset/:token', asyncRoute(resetPassword));

export default router;

