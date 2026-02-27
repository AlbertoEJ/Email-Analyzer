import { Router } from 'express';
import { exportReport } from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/export', exportReport);

export { router as reportRoutes };
