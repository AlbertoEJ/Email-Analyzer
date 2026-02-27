import { useState } from 'react';
import { ExportButton } from '../components/common/ExportButton';
import { useScanLogs } from '../hooks/useEmails';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ReportsPage() {
  const [threatLevel, setThreatLevel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: scanLogs } = useScanLogs(20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Export Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Threat Level
            </label>
            <select
              value={threatLevel}
              onChange={(e) => setThreatLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Levels</option>
              <option value="safe">Safe</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <ExportButton
          threatLevel={threatLevel !== 'all' ? threatLevel : undefined}
          startDate={startDate || undefined}
          endDate={endDate || undefined}
        />
      </div>

      {/* Scan History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Scan History</h2>

        {!scanLogs || scanLogs.length === 0 ? (
          <p className="text-gray-400 text-sm">No scans yet.</p>
        ) : (
          <div className="space-y-2">
            {scanLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={log.status} />
                  <div>
                    <div className="text-sm font-medium">
                      {log.type === 'manual' ? 'Manual Scan' : 'Scheduled Scan'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(log.startedAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>{log.emailsScanned} emails scanned</div>
                  <div className={log.threatsFound > 0 ? 'text-red-600' : 'text-green-600'}>
                    {log.threatsFound} threats found
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'failed':
      return <XCircle className="text-red-500" size={20} />;
    default:
      return <Loader2 className="text-blue-500 animate-spin" size={20} />;
  }
}
