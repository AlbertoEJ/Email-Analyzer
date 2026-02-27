import { logger } from '../utils/logger';

export interface HeaderAnalysisResult {
  score: number; // 0-100 (0 = safe, 100 = critical)
  spf: AuthResult;
  dkim: AuthResult;
  dmarc: AuthResult;
  suspiciousIndicators: string[];
}

interface AuthResult {
  status: 'pass' | 'fail' | 'none' | 'softfail' | 'neutral' | 'unknown';
  details: string;
}

export class HeaderAnalyzerService {
  analyze(authenticationResults: string, headers: Record<string, string>): HeaderAnalysisResult {
    const spf = this.parseSPF(authenticationResults);
    const dkim = this.parseDKIM(authenticationResults);
    const dmarc = this.parseDMARC(authenticationResults);
    const suspiciousIndicators = this.checkSuspiciousHeaders(headers);

    const score = this.calculateScore(spf, dkim, dmarc, suspiciousIndicators);

    logger.debug({ spf, dkim, dmarc, score }, 'Header analysis complete');

    return { score, spf, dkim, dmarc, suspiciousIndicators };
  }

  private parseSPF(authResults: string): AuthResult {
    if (!authResults) return { status: 'none', details: 'No authentication results found' };

    const spfMatch = authResults.match(/spf=(pass|fail|softfail|neutral|none)(?:\s+\(([^)]*)\))?/i);
    if (!spfMatch) return { status: 'none', details: 'SPF not found in headers' };

    return {
      status: spfMatch[1].toLowerCase() as AuthResult['status'],
      details: spfMatch[2] || `SPF ${spfMatch[1]}`,
    };
  }

  private parseDKIM(authResults: string): AuthResult {
    if (!authResults) return { status: 'none', details: 'No authentication results found' };

    const dkimMatch = authResults.match(/dkim=(pass|fail|none|neutral)(?:\s+\(([^)]*)\))?/i);
    if (!dkimMatch) return { status: 'none', details: 'DKIM not found in headers' };

    return {
      status: dkimMatch[1].toLowerCase() as AuthResult['status'],
      details: dkimMatch[2] || `DKIM ${dkimMatch[1]}`,
    };
  }

  private parseDMARC(authResults: string): AuthResult {
    if (!authResults) return { status: 'none', details: 'No authentication results found' };

    const dmarcMatch = authResults.match(/dmarc=(pass|fail|none|bestguesspass)(?:\s+\(([^)]*)\))?/i);
    if (!dmarcMatch) return { status: 'none', details: 'DMARC not found in headers' };

    return {
      status: dmarcMatch[1].toLowerCase() === 'bestguesspass' ? 'pass' : dmarcMatch[1].toLowerCase() as AuthResult['status'],
      details: dmarcMatch[2] || `DMARC ${dmarcMatch[1]}`,
    };
  }

  private checkSuspiciousHeaders(headers: Record<string, string>): string[] {
    const indicators: string[] = [];

    // Check for reply-to mismatch
    const from = headers['from'] || '';
    const replyTo = headers['reply-to'] || '';
    if (replyTo && from) {
      const fromDomain = this.extractDomain(from);
      const replyToDomain = this.extractDomain(replyTo);
      if (fromDomain && replyToDomain && fromDomain !== replyToDomain) {
        indicators.push(`Reply-To domain (${replyToDomain}) differs from From domain (${fromDomain})`);
      }
    }

    // Check for display name spoofing
    const fromMatch = from.match(/^"?([^"<]*)"?\s*</);
    if (fromMatch) {
      const displayName = fromMatch[1].trim().toLowerCase();
      // Check if display name looks like an email address (spoofing attempt)
      if (displayName.includes('@') && displayName !== this.extractEmail(from)) {
        indicators.push('Display name contains a different email address (possible spoofing)');
      }
    }

    // Check X-Mailer for suspicious tools
    const xMailer = headers['x-mailer'] || '';
    const suspiciousMailers = ['PHPMailer', 'SwiftMailer', 'Mass Mailer'];
    for (const mailer of suspiciousMailers) {
      if (xMailer.toLowerCase().includes(mailer.toLowerCase())) {
        indicators.push(`Suspicious X-Mailer: ${xMailer}`);
      }
    }

    return indicators;
  }

  private extractDomain(email: string): string {
    const addr = this.extractEmail(email);
    const parts = addr.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  }

  private extractEmail(from: string): string {
    const match = from.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase() : from.trim().toLowerCase();
  }

  private calculateScore(
    spf: AuthResult,
    dkim: AuthResult,
    dmarc: AuthResult,
    indicators: string[]
  ): number {
    let score = 0;

    // SPF scoring (max 30)
    switch (spf.status) {
      case 'fail': score += 30; break;
      case 'softfail': score += 20; break;
      case 'none': score += 15; break;
      case 'neutral': score += 10; break;
      case 'pass': score += 0; break;
      default: score += 15;
    }

    // DKIM scoring (max 30)
    switch (dkim.status) {
      case 'fail': score += 30; break;
      case 'none': score += 20; break;
      case 'pass': score += 0; break;
      default: score += 15;
    }

    // DMARC scoring (max 25)
    switch (dmarc.status) {
      case 'fail': score += 25; break;
      case 'none': score += 15; break;
      case 'pass': score += 0; break;
      default: score += 10;
    }

    // Suspicious indicators (max 15)
    score += Math.min(indicators.length * 5, 15);

    return Math.min(score, 100);
  }
}

export const headerAnalyzerService = new HeaderAnalyzerService();
