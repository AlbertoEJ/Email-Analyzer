import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface ContentAnalysisResult {
  score: number; // 0-100
  isPhishing: boolean;
  isSocialEngineering: boolean;
  urgencyLevel: 'none' | 'low' | 'medium' | 'high';
  suspiciousPatterns: string[];
  summary: string;
}

const RETRY_MAX_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 8000;

export class ContentAnalyzerService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      if (!env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }
      this.client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: env.OPENROUTER_API_KEY,
      });
    }
    return this.client;
  }

  private async callWithRetry<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, maxAttempts: number) => void
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < RETRY_MAX_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const status = error?.status ?? error?.response?.status;
        const isRetryable = status === 429 || status === 502 || status === 503;
        if (!isRetryable || attempt === RETRY_MAX_ATTEMPTS - 1) {
          throw error;
        }

        // Use rate limit reset header if available (epoch ms)
        let delay: number;
        const resetMs = error?.headers?.['x-ratelimit-reset'] ?? error?.error?.metadata?.headers?.['X-RateLimit-Reset'];
        if (resetMs && status === 429) {
          const waitUntil = Number(resetMs) - Date.now();
          delay = Math.max(waitUntil + 500, RETRY_BASE_DELAY_MS); // +500ms buffer
        } else {
          delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
        }

        logger.warn({ attempt: attempt + 1, status, delay: Math.round(delay) }, 'Retrying LLM call');
        onRetry?.(attempt + 1, RETRY_MAX_ATTEMPTS);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  async analyze(
    subject: string,
    bodyText: string,
    sender: string,
    onRetry?: (attempt: number, maxAttempts: number) => void
  ): Promise<ContentAnalysisResult> {
    if (!env.OPENROUTER_API_KEY) {
      logger.warn('OpenRouter API key not set, skipping content analysis');
      return {
        score: 0,
        isPhishing: false,
        isSocialEngineering: false,
        urgencyLevel: 'none',
        suspiciousPatterns: [],
        summary: 'Content analysis skipped (API key not configured)',
      };
    }

    try {
      const truncatedBody = bodyText.slice(0, 3000);

      const result = await this.callWithRetry(async () => {
        const client = this.getClient();
        const response = await client.chat.completions.create({
          model: env.OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an email security analyst. Analyze emails for phishing, social engineering, and other threats. Respond ONLY with valid JSON matching this schema:
{
  "score": <number 0-100, where 0 is safe and 100 is clearly malicious>,
  "isPhishing": <boolean>,
  "isSocialEngineering": <boolean>,
  "urgencyLevel": <"none"|"low"|"medium"|"high">,
  "suspiciousPatterns": [<string array of specific patterns found>],
  "summary": <string, 1-2 sentence analysis>
}

Consider these red flags:
- Urgency/pressure tactics ("act now", "account suspended")
- Requests for credentials, personal info, or money
- Impersonation of trusted entities (banks, tech companies, government)
- Mismatched sender identity
- Grammar/spelling errors inconsistent with supposed sender
- Too-good-to-be-true offers
- Threatening consequences for inaction`,
            },
            {
              role: 'user',
              content: `Analyze this email:
FROM: ${sender}
SUBJECT: ${subject}
BODY:
${truncatedBody}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from LLM');
        }

        // Parse JSON response, handling possible markdown code blocks
        const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr) as ContentAnalysisResult;

        // Validate and clamp score
        parsed.score = Math.max(0, Math.min(100, parsed.score));
        return parsed;
      }, onRetry);

      logger.debug({ score: result.score, isPhishing: result.isPhishing }, 'Content analysis complete');
      return result;
    } catch (error) {
      logger.error({ error }, 'Content analysis failed');
      return {
        score: 0,
        isPhishing: false,
        isSocialEngineering: false,
        urgencyLevel: 'none',
        suspiciousPatterns: [],
        summary: 'Content analysis failed',
      };
    }
  }
}

export const contentAnalyzerService = new ContentAnalyzerService();
