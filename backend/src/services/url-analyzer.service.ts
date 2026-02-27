import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface UrlAnalysisResult {
  score: number; // 0-100
  urls: UrlCheckResult[];
  totalUrls: number;
  maliciousCount: number;
  suspiciousCount: number;
}

export interface UrlCheckResult {
  url: string;
  safeBrowsing: { isMalicious: boolean; threats: string[] };
  virusTotal: { malicious: number; suspicious: number; harmless: number; undetected: number } | null;
}

export class UrlAnalyzerService {
  private vtRateLimit = { lastCall: 0, minInterval: 15000 }; // VT free tier: 4 req/min

  async analyze(urls: string[]): Promise<UrlAnalysisResult> {
    if (urls.length === 0) {
      return { score: 0, urls: [], totalUrls: 0, maliciousCount: 0, suspiciousCount: 0 };
    }

    // Limit to first 10 URLs to avoid rate limits
    const urlsToCheck = urls.slice(0, 10);
    const results: UrlCheckResult[] = [];

    for (const url of urlsToCheck) {
      const [safeBrowsing, virusTotal] = await Promise.all([
        this.checkSafeBrowsing(url),
        this.checkVirusTotal(url),
      ]);

      results.push({ url, safeBrowsing, virusTotal });
    }

    const maliciousCount = results.filter(
      (r) => r.safeBrowsing.isMalicious || (r.virusTotal && r.virusTotal.malicious > 0)
    ).length;

    const suspiciousCount = results.filter(
      (r) => !r.safeBrowsing.isMalicious && r.virusTotal && r.virusTotal.suspicious > 0
    ).length;

    const score = this.calculateScore(results);

    return { score, urls: results, totalUrls: urls.length, maliciousCount, suspiciousCount };
  }

  private async checkSafeBrowsing(
    url: string
  ): Promise<{ isMalicious: boolean; threats: string[] }> {
    if (!env.SAFE_BROWSING_API_KEY) {
      return { isMalicious: false, threats: [] };
    }

    try {
      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${env.SAFE_BROWSING_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: { clientId: 'email-analyzer', clientVersion: '1.0.0' },
            threatInfo: {
              threatTypes: [
                'MALWARE',
                'SOCIAL_ENGINEERING',
                'UNWANTED_SOFTWARE',
                'POTENTIALLY_HARMFUL_APPLICATION',
              ],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url }],
            },
          }),
        }
      );

      const data: any = await response.json();
      const matches = data.matches || [];

      return {
        isMalicious: matches.length > 0,
        threats: matches.map((m: any) => m.threatType),
      };
    } catch (error) {
      logger.error({ error, url }, 'Safe Browsing check failed');
      return { isMalicious: false, threats: [] };
    }
  }

  private async checkVirusTotal(
    url: string
  ): Promise<UrlCheckResult['virusTotal']> {
    if (!env.VIRUSTOTAL_API_KEY) return null;

    try {
      // Rate limiting for VT free tier
      const now = Date.now();
      const timeSinceLast = now - this.vtRateLimit.lastCall;
      if (timeSinceLast < this.vtRateLimit.minInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.vtRateLimit.minInterval - timeSinceLast)
        );
      }
      this.vtRateLimit.lastCall = Date.now();

      // URL must be base64-encoded for VT API v3
      const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');

      const response = await fetch(
        `https://www.virustotal.com/api/v3/urls/${urlId}`,
        {
          headers: { 'x-apikey': env.VIRUSTOTAL_API_KEY },
        }
      );

      if (response.status === 404) {
        // URL not in VT database - submit it
        const submitResponse = await fetch(
          'https://www.virustotal.com/api/v3/urls',
          {
            method: 'POST',
            headers: {
              'x-apikey': env.VIRUSTOTAL_API_KEY,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `url=${encodeURIComponent(url)}`,
          }
        );

        if (!submitResponse.ok) return null;
        return { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
      }

      if (!response.ok) return null;

      const data: any = await response.json();
      const stats = data.data?.attributes?.last_analysis_stats;

      if (!stats) return null;

      return {
        malicious: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
        undetected: stats.undetected || 0,
      };
    } catch (error) {
      logger.error({ error, url }, 'VirusTotal check failed');
      return null;
    }
  }

  private calculateScore(results: UrlCheckResult[]): number {
    if (results.length === 0) return 0;

    let maxSeverity = 0;

    for (const result of results) {
      let urlSeverity = 0;

      if (result.safeBrowsing.isMalicious) {
        urlSeverity = Math.max(urlSeverity, 80);
        if (result.safeBrowsing.threats.includes('SOCIAL_ENGINEERING')) {
          urlSeverity = Math.max(urlSeverity, 90);
        }
      }

      if (result.virusTotal) {
        const { malicious, suspicious } = result.virusTotal;
        if (malicious > 5) urlSeverity = Math.max(urlSeverity, 95);
        else if (malicious > 2) urlSeverity = Math.max(urlSeverity, 75);
        else if (malicious > 0) urlSeverity = Math.max(urlSeverity, 60);
        else if (suspicious > 2) urlSeverity = Math.max(urlSeverity, 40);
        else if (suspicious > 0) urlSeverity = Math.max(urlSeverity, 25);
      }

      maxSeverity = Math.max(maxSeverity, urlSeverity);
    }

    return maxSeverity;
  }
}

export const urlAnalyzerService = new UrlAnalyzerService();
