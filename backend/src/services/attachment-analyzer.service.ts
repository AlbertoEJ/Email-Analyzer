import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AttachmentInfo } from '../utils/email-parser';

export interface AttachmentAnalysisResult {
  score: number; // 0-100
  attachments: AttachmentCheckResult[];
  suspiciousCount: number;
  maliciousCount: number;
}

export interface AttachmentCheckResult {
  filename: string;
  mimeType: string;
  size: number;
  sha256: string;
  isSuspiciousType: boolean;
  virusTotal: { malicious: number; suspicious: number; harmless: number } | null;
}

const SUSPICIOUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.scr', '.pif', '.msi', '.jar',
  '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.ps1',
  '.dll', '.com', '.hta', '.cpl', '.reg', '.inf',
  '.docm', '.xlsm', '.pptm', // Office macros
]);

export class AttachmentAnalyzerService {
  async analyze(
    attachments: AttachmentInfo[],
    getAttachmentData: (attachmentId: string) => Promise<Buffer>
  ): Promise<AttachmentAnalysisResult> {
    if (attachments.length === 0) {
      return { score: 0, attachments: [], suspiciousCount: 0, maliciousCount: 0 };
    }

    const results: AttachmentCheckResult[] = [];

    for (const attachment of attachments) {
      try {
        const data = await getAttachmentData(attachment.attachmentId);
        const sha256 = crypto.createHash('sha256').update(data).digest('hex');
        const isSuspiciousType = this.isSuspiciousExtension(attachment.filename);

        const vtResult = await this.checkVirusTotal(sha256);

        results.push({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          sha256,
          isSuspiciousType,
          virusTotal: vtResult,
        });
      } catch (error) {
        logger.error({ error, filename: attachment.filename }, 'Attachment analysis failed');
        results.push({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          sha256: '',
          isSuspiciousType: this.isSuspiciousExtension(attachment.filename),
          virusTotal: null,
        });
      }
    }

    const maliciousCount = results.filter(
      (r) => r.virusTotal && r.virusTotal.malicious > 0
    ).length;

    const suspiciousCount = results.filter(
      (r) => r.isSuspiciousType || (r.virusTotal && r.virusTotal.suspicious > 0)
    ).length;

    const score = this.calculateScore(results);

    return { score, attachments: results, suspiciousCount, maliciousCount };
  }

  private isSuspiciousExtension(filename: string): boolean {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return SUSPICIOUS_EXTENSIONS.has(ext);
  }

  private async checkVirusTotal(
    sha256: string
  ): Promise<AttachmentCheckResult['virusTotal']> {
    if (!env.VIRUSTOTAL_API_KEY || !sha256) return null;

    try {
      const response = await fetch(
        `https://www.virustotal.com/api/v3/files/${sha256}`,
        {
          headers: { 'x-apikey': env.VIRUSTOTAL_API_KEY },
        }
      );

      if (!response.ok) return null;

      const data: any = await response.json();
      const stats = data.data?.attributes?.last_analysis_stats;

      if (!stats) return null;

      return {
        malicious: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
      };
    } catch (error) {
      logger.error({ error, sha256 }, 'VirusTotal file check failed');
      return null;
    }
  }

  private calculateScore(results: AttachmentCheckResult[]): number {
    if (results.length === 0) return 0;

    let maxSeverity = 0;

    for (const result of results) {
      let severity = 0;

      if (result.isSuspiciousType) {
        severity = Math.max(severity, 40);
      }

      if (result.virusTotal) {
        const { malicious, suspicious } = result.virusTotal;
        if (malicious > 5) severity = Math.max(severity, 95);
        else if (malicious > 2) severity = Math.max(severity, 80);
        else if (malicious > 0) severity = Math.max(severity, 65);
        else if (suspicious > 2) severity = Math.max(severity, 45);
        else if (suspicious > 0) severity = Math.max(severity, 30);
      }

      maxSeverity = Math.max(maxSeverity, severity);
    }

    return maxSeverity;
  }
}

export const attachmentAnalyzerService = new AttachmentAnalyzerService();
