import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailsApi } from '../api';
import type { ScanProgress } from '../types';

export function useEmails(params: {
  page?: number;
  limit?: number;
  threatLevel?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  return useQuery({
    queryKey: ['emails', params],
    queryFn: () => emailsApi.list(params).then((r) => r.data),
  });
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: ['email', id],
    queryFn: () => emailsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useScanEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { maxResults?: number; query?: string }) =>
      emailsApi.scan(params).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['scanLogs'] });
    },
  });
}

export function useScanWithProgress() {
  const queryClient = useQueryClient();
  const [scanId, setScanId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!scanId) return;

    let errorCount = 0;
    const MAX_POLL_ERRORS = 5;

    const poll = async () => {
      try {
        const { data } = await emailsApi.scanProgress(scanId);
        errorCount = 0;
        setProgress(data);

        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling();
          queryClient.invalidateQueries({ queryKey: ['emails'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['scanLogs'] });
        }
      } catch {
        errorCount++;
        if (errorCount >= MAX_POLL_ERRORS) {
          stopPolling();
          setProgress((prev) =>
            prev
              ? { ...prev, status: 'failed', error: 'Connection lost' }
              : null
          );
        }
      }
    };

    // Poll immediately, then every 1s
    poll();
    intervalRef.current = setInterval(poll, 1000);

    return stopPolling;
  }, [scanId, stopPolling, queryClient]);

  const startScan = useCallback(
    async (params?: { maxResults?: number; query?: string }) => {
      setDismissed(false);
      setProgress(null);
      const { data } = await emailsApi.scan(params);
      setScanId(data.scanId);
    },
    []
  );

  const dismiss = useCallback(() => {
    setDismissed(true);
    setProgress(null);
    setScanId(null);
    stopPolling();
  }, [stopPolling]);

  const isScanning = !!scanId && progress?.status === 'running';

  return { progress: dismissed ? null : progress, isScanning, startScan, dismiss };
}

export function useScanLogs(limit?: number) {
  return useQuery({
    queryKey: ['scanLogs', limit],
    queryFn: () => emailsApi.scanLogs(limit).then((r) => r.data),
  });
}
