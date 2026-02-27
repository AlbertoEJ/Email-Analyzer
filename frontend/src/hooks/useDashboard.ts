import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.summary().then((r) => r.data),
  });
}

export function useDashboardTrends(days?: number) {
  return useQuery({
    queryKey: ['dashboard', 'trends', days],
    queryFn: () => dashboardApi.trends(days).then((r) => r.data),
  });
}
