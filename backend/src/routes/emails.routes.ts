import { Router } from 'express';
import { listEmails, getEmail, triggerScan, getScanLogs, getScanProgress } from '../controllers/emails.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listEmails);
router.get('/scan-logs', getScanLogs);
router.get('/scan-progress/:scanId', getScanProgress);
router.get('/:id', getEmail);
router.post('/scan', triggerScan);

export { router as emailRoutes };
