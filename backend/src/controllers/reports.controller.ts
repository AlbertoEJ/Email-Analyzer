import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function exportReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const threatLevel = req.query.threatLevel as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = { userId };

    if (threatLevel && threatLevel !== 'all') {
      where.threatLevel = threatLevel;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const emails = await prisma.emailAnalysis.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const report = {
      generatedAt: new Date().toISOString(),
      totalEmails: emails.length,
      filters: {
        threatLevel: threatLevel || 'all',
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        safe: emails.filter((e) => e.threatLevel === 'safe').length,
        low: emails.filter((e) => e.threatLevel === 'low').length,
        medium: emails.filter((e) => e.threatLevel === 'medium').length,
        high: emails.filter((e) => e.threatLevel === 'high').length,
        critical: emails.filter((e) => e.threatLevel === 'critical').length,
        averageScore:
          emails.length > 0
            ? Math.round(
                emails.reduce((sum, e) => sum + e.threatScore, 0) / emails.length
              )
            : 0,
      },
      emails: emails.map((email) => ({
        id: email.id,
        gmailId: email.gmailId,
        subject: email.subject,
        sender: email.sender,
        senderEmail: email.senderEmail,
        date: email.date,
        threatScore: email.threatScore,
        threatLevel: email.threatLevel,
        threatSummary: email.threatSummary,
        scores: {
          header: email.headerScore,
          url: email.urlScore,
          content: email.contentScore,
          attachment: email.attachmentScore,
        },
        headerDetails: email.headerDetails ? JSON.parse(email.headerDetails) : null,
        urlDetails: email.urlDetails ? JSON.parse(email.urlDetails) : null,
        contentDetails: email.contentDetails ? JSON.parse(email.contentDetails) : null,
        attachmentDetails: email.attachmentDetails
          ? JSON.parse(email.attachmentDetails)
          : null,
        analyzedAt: email.analyzedAt,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="email-security-report-${new Date().toISOString().split('T')[0]}.json"`
    );

    res.json(report);
  } catch (error) {
    next(error);
  }
}
