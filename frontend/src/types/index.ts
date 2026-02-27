export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: string;
}

export interface EmailAnalysis {
  id: string;
  gmailId: string;
  subject: string;
  sender: string;
  senderEmail: string;
  date: string;
  snippet: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  threatSummary: string | null;
  headerScore: number;
  urlScore: number;
  contentScore: number;
  attachmentScore: number;
  analyzedAt: string;
}

export interface EmailDetail extends EmailAnalysis {
  recipients: string[];
  bodyText: string | null;
  bodyHtml: string | null;
  headerDetails: HeaderDetails | null;
  urlDetails: UrlDetails | null;
  contentDetails: ContentDetails | null;
  attachmentDetails: AttachmentDetails | null;
}

export type ThreatLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface HeaderDetails {
  score: number;
  spf: { status: string; details: string };
  dkim: { status: string; details: string };
  dmarc: { status: string; details: string };
  suspiciousIndicators: string[];
}

export interface UrlDetails {
  score: number;
  totalUrls: number;
  maliciousCount: number;
  suspiciousCount: number;
  urls: Array<{
    url: string;
    safeBrowsing: { isMalicious: boolean; threats: string[] };
    virusTotal: { malicious: number; suspicious: number; harmless: number; undetected: number } | null;
  }>;
}

export interface ContentDetails {
  score: number;
  isPhishing: boolean;
  isSocialEngineering: boolean;
  urgencyLevel: string;
  suspiciousPatterns: string[];
  summary: string;
}

export interface AttachmentDetails {
  score: number;
  suspiciousCount: number;
  maliciousCount: number;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    sha256: string;
    isSuspiciousType: boolean;
    virusTotal: { malicious: number; suspicious: number; harmless: number } | null;
  }>;
}

export interface DashboardSummary {
  totalEmails: number;
  threatsDetected: number;
  averageScore: number;
  lastScanAt: string | null;
  threatDistribution: Record<ThreatLevel, number>;
}

export interface TrendData {
  date: string;
  total: number;
  threats: number;
  avgScore: number;
}

export interface PaginatedResponse<T> {
  emails: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScanResult {
  scanId: string;
  emailsScanned: number;
  threatsFound: number;
}

export interface ScanLog {
  id: string;
  type: string;
  emailsScanned: number;
  threatsFound: number;
  status: string;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

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
