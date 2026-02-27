import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    const [totalEmails, threatCounts, recentScan, avgScore] = await Promise.all([
      prisma.emailAnalysis.count({ where: { userId } }),

      prisma.emailAnalysis.groupBy({
        by: ['threatLevel'],
        where: { userId },
        _count: { id: true },
      }),

      prisma.scanLog.findFirst({
        where: { userId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
      }),

      prisma.emailAnalysis.aggregate({
        where: { userId },
        _avg: { threatScore: true },
      }),
    ]);

    const threatDistribution: Record<string, number> = {
      safe: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const group of threatCounts) {
      threatDistribution[group.threatLevel] = group._count.id;
    }

    const threatsDetected =
      (threatDistribution.medium || 0) +
      (threatDistribution.high || 0) +
      (threatDistribution.critical || 0);

    res.json({
      totalEmails,
      threatsDetected,
      averageScore: Math.round(avgScore._avg.threatScore || 0),
      lastScanAt: recentScan?.completedAt || null,
      threatDistribution,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const emails = await prisma.emailAnalysis.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      select: {
        date: true,
        threatScore: true,
        threatLevel: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by day
    const trendMap = new Map<string, { total: number; threats: number; avgScore: number; scores: number[] }>();

    for (const email of emails) {
      const day = email.date.toISOString().split('T')[0];
      if (!trendMap.has(day)) {
        trendMap.set(day, { total: 0, threats: 0, avgScore: 0, scores: [] });
      }
      const entry = trendMap.get(day)!;
      entry.total++;
      entry.scores.push(email.threatScore);
      if (['medium', 'high', 'critical'].includes(email.threatLevel)) {
        entry.threats++;
      }
    }

    const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      total: data.total,
      threats: data.threats,
      avgScore: Math.round(
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ),
    }));

    res.json(trends);
  } catch (error) {
    next(error);
  }
}
