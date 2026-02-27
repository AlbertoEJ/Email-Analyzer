import { CheckCircle, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import type { HeaderDetails } from '../../types';

interface HeaderAnalysisProps {
  details: HeaderDetails;
}

export function HeaderAnalysis({ details }: HeaderAnalysisProps) {
  const authChecks = [
    { label: 'SPF', ...details.spf },
    { label: 'DKIM', ...details.dkim },
    { label: 'DMARC', ...details.dmarc },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Header Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {authChecks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <StatusIcon status={check.status} />
            <div>
              <div className="font-medium">{check.label}</div>
              <div className="text-sm text-gray-500">{check.details}</div>
            </div>
          </div>
        ))}
      </div>

      {details.suspiciousIndicators.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Suspicious Indicators
          </h4>
          <ul className="space-y-1">
            {details.suspiciousIndicators.map((indicator, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded"
              >
                <AlertTriangle size={14} />
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="text-green-500" size={24} />;
    case 'fail':
      return <XCircle className="text-red-500" size={24} />;
    case 'softfail':
      return <AlertTriangle className="text-orange-500" size={24} />;
    default:
      return <MinusCircle className="text-gray-400" size={24} />;
  }
}
