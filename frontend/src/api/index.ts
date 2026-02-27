import { apiClient } from './client';
import type {
  DashboardSummary,
  EmailAnalysis,
  EmailDetail,
  PaginatedResponse,
  ScanProgress,
  ScanLog,
  TrendData,
} from '../types';

// Auth
export const authApi = {
  login: () => apiClient.get<{ authUrl: string }>('/auth/login'),
  status: () => apiClient.get<{ authenticated: boolean; user?: any }>('/auth/status'),
  logout: () => apiClient.post('/auth/logout'),
};

// Emails
export const emailsApi = {
  list: (params: {
    page?: number;
    limit?: number;
    threatLevel?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) =>
    apiClient.get<PaginatedResponse<EmailAnalysis>>('/emails', { params }),

  get: (id: string) => apiClient.get<EmailDetail>(`/emails/${id}`),

  scan: (params?: { maxResults?: number; query?: string }) =>
    apiClient.post<{ scanId: string }>('/emails/scan', params),

  scanProgress: (scanId: string) =>
    apiClient.get<ScanProgress>(`/emails/scan-progress/${scanId}`),

  scanLogs: (limit?: number) =>
    apiClient.get<ScanLog[]>('/emails/scan-logs', { params: { limit } }),
};

// Dashboard
export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  trends: (days?: number) =>
    apiClient.get<TrendData[]>('/dashboard/trends', { params: { days } }),
};

// Reports
export const reportsApi = {
  export: (params?: {
    threatLevel?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.get('/reports/export', {
      params,
      responseType: 'blob',
    }),
};
