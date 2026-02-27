import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { analyzerService } from '../services/analyzer.service';
import { scanProgressService } from '../services/scan-progress.service';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

export async function listEmails(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const threatLevel = req.query.threatLevel as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'date';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: any = { userId };

    if (threatLevel && threatLevel !== 'all') {
      where.threatLevel = threatLevel;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { sender: { contains: search } },
        { senderEmail: { contains: search } },
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.emailAnalysis.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          gmailId: true,
          subject: true,
          sender: true,
          senderEmail: true,
          date: true,
          snippet: true,
          threatScore: true,
          threatLevel: true,
          threatSummary: true,
          headerScore: true,
          urlScore: true,
          contentScore: true,
          attachmentScore: true,
          analyzedAt: true,
        },
      }),
      prisma.emailAnalysis.count({ where }),
    ]);

    res.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const emailId = Array.isArray(id) ? id[0] : id;
    const email = await prisma.emailAnalysis.findFirst({
      where: { id: emailId, userId },
    });

    if (!email) {
      throw new AppError(404, 'Email not found');
    }

    // Parse JSON fields
    const result = {
      ...email,
      recipients: JSON.parse(email.recipients),
      headerDetails: email.headerDetails ? JSON.parse(email.headerDetails) : null,
      urlDetails: email.urlDetails ? JSON.parse(email.urlDetails) : null,
      contentDetails: email.contentDetails ? JSON.parse(email.contentDetails) : null,
      attachmentDetails: email.attachmentDetails ? JSON.parse(email.attachmentDetails) : null,
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function triggerScan(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const maxResults = parseInt(req.body.maxResults as string) || 20;
    const query = (req.body.query as string) || 'in:inbox';

    // Create ScanLog upfront so we can return the ID immediately
    const scanLog = await prisma.scanLog.create({
      data: {
        userId,
        type: 'manual',
        status: 'running',
      },
    });

    // Launch scan in background (non-blocking)
    analyzerService
      .scanEmails(userId, {
        maxResults,
        query,
        existingScanLogId: scanLog.id,
      })
      .catch((error) => {
        logger.error({ error, scanId: scanLog.id }, 'Background scan failed');
      });

    // Return immediately with scanId
    res.json({ scanId: scanLog.id });
  } catch (error) {
    next(error);
  }
}

export async function getScanProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const scanId = req.params.scanId as string;

    // Try in-memory store first
    const progress = scanProgressService.get(scanId);
    if (progress) {
      return res.json(progress);
    }

    // Fallback to DB if already cleaned up
    const scanLog = await prisma.scanLog.findUnique({
      where: { id: scanId },
    });

    if (!scanLog) {
      throw new AppError(404, 'Scan not found');
    }

    res.json({
      scanId: scanLog.id,
      status: scanLog.status as 'running' | 'completed' | 'failed',
      totalEmails: scanLog.emailsScanned,
      processedEmails: scanLog.emailsScanned,
      currentEmailSubject: null,
      currentPhase: scanLog.status === 'completed' ? 'complete' : 'analyzing',
      contentRetrying: null,
      threatsFound: scanLog.threatsFound,
      error: scanLog.error,
    });
  } catch (error) {
    next(error);
  }
}

export async function getScanLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const logs = await prisma.scanLog.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
}
