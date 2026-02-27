import { Router } from 'express';
import { getSummary, getTrends } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/trends', getTrends);

export { router as dashboardRoutes };
