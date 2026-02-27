import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { startScheduler } from './services/scheduler.service';

async function main() {
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  // Start the periodic scan scheduler
  startScheduler();

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
