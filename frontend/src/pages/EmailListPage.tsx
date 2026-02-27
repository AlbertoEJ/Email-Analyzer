import { useState } from 'react';
import { EmailList } from '../components/emails/EmailList';
import { EmailFilters } from '../components/emails/EmailFilters';
import { ScanProgressPanel } from '../components/emails/ScanProgressPanel';
import { useEmails, useScanWithProgress } from '../hooks/useEmails';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export function EmailListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [threatLevel, setThreatLevel] = useState('all');

  const { data, isLoading } = useEmails({
    page,
    limit: 20,
    threatLevel: threatLevel !== 'all' ? threatLevel : undefined,
    search: search || undefined,
  });

  const { progress, isScanning, startScan, dismiss } = useScanWithProgress();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Emails</h1>
        <button
          onClick={() => startScan({ maxResults: 20 })}
          disabled={isScanning}
          className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <RefreshCw
            size={16}
            className={isScanning ? 'animate-spin' : ''}
          />
          {isScanning ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {progress && <ScanProgressPanel progress={progress} onDismiss={dismiss} />}

      <EmailFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        threatLevel={threatLevel}
        onThreatLevelChange={(v) => { setThreatLevel(v); setPage(1); }}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <EmailList emails={data?.emails || []} />

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-gray-500">
                Page {data.pagination.page}/{data.pagination.totalPages} ({data.pagination.total})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
