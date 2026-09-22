import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

// Rutas públicas (con rate limiting)
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

// Rutas protegidas
router.get('/profile', authenticate, getProfile);

export default router;