import { SummaryCards } from '../components/dashboard/SummaryCards';
import { ThreatTrendChart } from '../components/dashboard/ThreatTrendChart';
import { ThreatTypeChart } from '../components/dashboard/ThreatTypeChart';
import { ScanProgressPanel } from '../components/emails/ScanProgressPanel';
import { useDashboardSummary, useDashboardTrends } from '../hooks/useDashboard';
import { useScanWithProgress } from '../hooks/useEmails';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RefreshCw } from 'lucide-react';

export function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends(30);
  const { progress, isScanning, startScan, dismiss } = useScanWithProgress();

  if (summaryLoading || trendsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => startScan({ maxResults: 20 })}
          disabled={isScanning}
          className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <RefreshCw
            size={16}
            className={isScanning ? 'animate-spin' : ''}
          />
          {isScanning ? 'Scanning...' : 'Scan Inbox'}
        </button>
      </div>

      {progress && <ScanProgressPanel progress={progress} onDismiss={dismiss} />}

      {summary && <SummaryCards summary={summary} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatTrendChart data={trends || []} />
        {summary && <ThreatTypeChart distribution={summary.threatDistribution} />}
      </div>
    </div>
  );
}
