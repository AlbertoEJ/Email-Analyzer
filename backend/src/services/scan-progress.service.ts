import { logger } from '../utils/logger';

export interface ScanProgress {
  scanId: string;
  status: 'running' | 'completed' | 'failed';
  totalEmails: number;
  processedEmails: number;
  currentEmailSubject: string | null;
  currentPhase: 'fetching' | 'analyzing' | 'complete';
  contentRetrying: { attempt: number; maxAttempts: number } | null;
  threatsFound: number;
  error: string | null;
}

const CLEANUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes

class ScanProgressService {
  private store = new Map<string, ScanProgress>();
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

  create(scanId: string): ScanProgress {
    const progress: ScanProgress = {
      scanId,
      status: 'running',
      totalEmails: 0,
      processedEmails: 0,
      currentEmailSubject: null,
      currentPhase: 'fetching',
      contentRetrying: null,
      threatsFound: 0,
      error: null,
    };
    this.store.set(scanId, progress);
    return progress;
  }

  update(scanId: string, data: Partial<Omit<ScanProgress, 'scanId'>>) {
    const progress = this.store.get(scanId);
    if (!progress) return;
    Object.assign(progress, data);

    if (data.status === 'completed' || data.status === 'failed') {
      this.scheduleCleanup(scanId);
    }
  }

  get(scanId: string): ScanProgress | undefined {
    return this.store.get(scanId);
  }

  private scheduleCleanup(scanId: string) {
    const existing = this.cleanupTimers.get(scanId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.store.delete(scanId);
      this.cleanupTimers.delete(scanId);
      logger.debug({ scanId }, 'Scan progress cleaned up');
    }, CLEANUP_DELAY_MS);

    this.cleanupTimers.set(scanId, timer);
  }
}

export const scanProgressService = new ScanProgressService();
