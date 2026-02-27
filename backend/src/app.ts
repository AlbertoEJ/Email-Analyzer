import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './routes/auth.routes';
import { emailRoutes } from './routes/emails.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { reportRoutes } from './routes/reports.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export { app };
