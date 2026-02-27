import { Router } from 'express';
import { login, callback, status, logout } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rate-limiter';

const router = Router();

router.get('/login', authLimiter, login);
router.get('/callback', callback);
router.get('/status', status);
router.post('/logout', logout);

export { router as authRoutes };
