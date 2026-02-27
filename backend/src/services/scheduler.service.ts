import cron from 'node-cron';
import { prisma } from '../config/database';
import { analyzerService } from './analyzer.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let scheduledTask: cron.ScheduledTask | null = null;

export function startScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  scheduledTask = cron.schedule(env.SCAN_CRON, async () => {
    logger.info('Starting scheduled scan...');

    try {
      const users = await prisma.user.findMany({
        where: {
          encryptedAccessToken: { not: null },
          encryptedRefreshToken: { not: null },
        },
      });

      for (const user of users) {
        try {
          const scanLog = await prisma.scanLog.create({
            data: {
              userId: user.id,
              type: 'scheduled',
              status: 'running',
            },
          });

          const result = await analyzerService.scanEmails(user.id, {
            maxResults: 10,
            query: 'in:inbox is:unread newer_than:1d',
            existingScanLogId: scanLog.id,
          });

          logger.info(
            { userId: user.id, ...result },
            'Scheduled scan completed for user'
          );
        } catch (error) {
          logger.error({ error, userId: user.id }, 'Scheduled scan failed for user');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Scheduled scan failed');
    }
  });

  logger.info({ cron: env.SCAN_CRON }, 'Scheduler started');
}

export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Scheduler stopped');
  }
}
