import { prisma } from '../config/database';
import { gmailService } from './gmail.service';
import { headerAnalyzerService } from './header-analyzer.service';
import { urlAnalyzerService } from './url-analyzer.service';
import { contentAnalyzerService } from './content-analyzer.service';
import { attachmentAnalyzerService } from './attachment-analyzer.service';
import { threatScorerService } from './threat-scorer.service';
import { scanProgressService } from './scan-progress.service';
import { parseGmailMessage } from '../utils/email-parser';
import { logger } from '../utils/logger';

export class AnalyzerService {
  async scanEmails(
    userId: string,
    options: { maxResults?: number; query?: string; existingScanLogId?: string } = {}
  ) {
    let scanLogId: string;

    if (options.existingScanLogId) {
      scanLogId = options.existingScanLogId;
    } else {
      const scanLog = await prisma.scanLog.create({
        data: {
          userId,
          type: 'manual',
          status: 'running',
        },
      });
      scanLogId = scanLog.id;
    }

    // Initialize progress tracking
    scanProgressService.create(scanLogId);

    try {
      scanProgressService.update(scanLogId, { currentPhase: 'fetching' });

      const { messages } = await gmailService.listMessages(userId, {
        maxResults: options.maxResults || 20,
        query: options.query,
      });

      scanProgressService.update(scanLogId, {
        totalEmails: messages.length,
        currentPhase: 'analyzing',
      });

      let threatsFound = 0;

      for (const message of messages) {
        try {
          const parsed = parseGmailMessage(message);

          scanProgressService.update(scanLogId, {
            currentEmailSubject: parsed.subject || '(no subject)',
          });

          const result = await this.analyzeEmail(userId, parsed, scanLogId);
          if (result.threatLevel !== 'safe') {
            threatsFound++;
          }
        } catch (error) {
          logger.error({ error, messageId: message.id }, 'Failed to analyze email');
        }

        scanProgressService.update(scanLogId, {
          processedEmails: (scanProgressService.get(scanLogId)?.processedEmails ?? 0) + 1,
          threatsFound,
          contentRetrying: null,
        });
      }

      await prisma.scanLog.update({
        where: { id: scanLogId },
        data: {
          status: 'completed',
          emailsScanned: messages.length,
          threatsFound,
          completedAt: new Date(),
        },
      });

      scanProgressService.update(scanLogId, {
        status: 'completed',
        currentPhase: 'complete',
        currentEmailSubject: null,
      });

      return {
        scanId: scanLogId,
        emailsScanned: messages.length,
        threatsFound,
      };
    } catch (error) {
      await prisma.scanLog.update({
        where: { id: scanLogId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      scanProgressService.update(scanLogId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  async analyzeEmail(userId: string, parsed: ReturnType<typeof parseGmailMessage> extends Promise<infer T> ? T : ReturnType<typeof parseGmailMessage>, scanLogId?: string) {
    // Build onRetry callback for content analyzer progress
    const onRetry = scanLogId
      ? (attempt: number, maxAttempts: number) => {
          scanProgressService.update(scanLogId, {
            contentRetrying: { attempt, maxAttempts },
          });
        }
      : undefined;

    // Run all analyzers in parallel
    const [headerResult, urlResult, contentResult, attachmentResult] =
      await Promise.allSettled([
        Promise.resolve(
          headerAnalyzerService.analyze(parsed.authenticationResults, parsed.headers)
        ),
        urlAnalyzerService.analyze(parsed.urls),
        contentAnalyzerService.analyze(parsed.subject, parsed.bodyText, parsed.sender, onRetry),
        attachmentAnalyzerService.analyze(parsed.attachments, (attachmentId) =>
          gmailService.getAttachmentData(userId, parsed.id, attachmentId)
        ),
      ]);

    const headerScore =
      headerResult.status === 'fulfilled' ? headerResult.value.score : 0;
    const urlScore =
      urlResult.status === 'fulfilled' ? urlResult.value.score : 0;
    const contentScore =
      contentResult.status === 'fulfilled' ? contentResult.value.score : 0;
    const attachmentScore =
      attachmentResult.status === 'fulfilled' ? attachmentResult.value.score : 0;

    // Calculate composite score
    const threatResult = threatScorerService.calculate({
      header: headerScore,
      url: urlScore,
      content: contentScore,
      attachment: attachmentScore,
    });

    // Build summary
    const contentSummary =
      contentResult.status === 'fulfilled' ? contentResult.value.summary : '';

    // Upsert the analysis
    const analysis = await prisma.emailAnalysis.upsert({
      where: {
        gmailId_userId: {
          gmailId: parsed.id,
          userId,
        },
      },
      create: {
        gmailId: parsed.id,
        userId,
        subject: parsed.subject,
        sender: parsed.sender,
        senderEmail: parsed.senderEmail,
        recipients: JSON.stringify(parsed.recipients),
        date: parsed.date,
        snippet: parsed.snippet,
        bodyText: parsed.bodyText,
        bodyHtml: parsed.bodyHtml,
        headerScore,
        headerDetails:
          headerResult.status === 'fulfilled'
            ? JSON.stringify(headerResult.value)
            : null,
        urlScore,
        urlDetails:
          urlResult.status === 'fulfilled'
            ? JSON.stringify(urlResult.value)
            : null,
        contentScore,
        contentDetails:
          contentResult.status === 'fulfilled'
            ? JSON.stringify(contentResult.value)
            : null,
        attachmentScore,
        attachmentDetails:
          attachmentResult.status === 'fulfilled'
            ? JSON.stringify(attachmentResult.value)
            : null,
        threatScore: threatResult.totalScore,
        threatLevel: threatResult.threatLevel,
        threatSummary: contentSummary,
      },
      update: {
        subject: parsed.subject,
        sender: parsed.sender,
        senderEmail: parsed.senderEmail,
        recipients: JSON.stringify(parsed.recipients),
        date: parsed.date,
        snippet: parsed.snippet,
        headerScore,
        headerDetails:
          headerResult.status === 'fulfilled'
            ? JSON.stringify(headerResult.value)
            : null,
        urlScore,
        urlDetails:
          urlResult.status === 'fulfilled'
            ? JSON.stringify(urlResult.value)
            : null,
        contentScore,
        contentDetails:
          contentResult.status === 'fulfilled'
            ? JSON.stringify(contentResult.value)
            : null,
        attachmentScore,
        attachmentDetails:
          attachmentResult.status === 'fulfilled'
            ? JSON.stringify(attachmentResult.value)
            : null,
        threatScore: threatResult.totalScore,
        threatLevel: threatResult.threatLevel,
        threatSummary: contentSummary,
        analyzedAt: new Date(),
      },
    });

    logger.info(
      {
        emailId: parsed.id,
        threatScore: threatResult.totalScore,
        threatLevel: threatResult.threatLevel,
      },
      'Email analyzed'
    );

    return analysis;
  }
}

export const analyzerService = new AnalyzerService();
