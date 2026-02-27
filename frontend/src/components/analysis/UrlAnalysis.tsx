import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { UrlDetails } from '../../types';

interface UrlAnalysisProps {
  details: UrlDetails;
}

export function UrlAnalysis({ details }: UrlAnalysisProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">URL Analysis</h3>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-gray-600">Total URLs: {details.totalUrls}</span>
        <span className="text-red-600">Malicious: {details.maliciousCount}</span>
        <span className="text-orange-600">Suspicious: {details.suspiciousCount}</span>
      </div>

      {details.urls.length === 0 ? (
        <p className="text-gray-400 text-sm">No URLs found in this email.</p>
      ) : (
        <div className="space-y-2">
          {details.urls.map((urlResult, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                urlResult.safeBrowsing.isMalicious ||
                (urlResult.virusTotal && urlResult.virusTotal.malicious > 0)
                  ? 'border-red-200 bg-red-50'
                  : urlResult.virusTotal && urlResult.virusTotal.suspicious > 0
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {urlResult.safeBrowsing.isMalicious ? (
                  <ShieldAlert className="text-red-500 shrink-0" size={16} />
                ) : (
                  <ShieldCheck className="text-green-500 shrink-0" size={16} />
                )}
                <span className="text-sm font-mono truncate block min-w-0">{urlResult.url}</span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                <span>
                  Safe Browsing: {urlResult.safeBrowsing.isMalicious ? 'FLAGGED' : 'Clean'}
                </span>
                {urlResult.virusTotal && (
                  <span>
                    VT: {urlResult.virusTotal.malicious} malicious,{' '}
                    {urlResult.virusTotal.suspicious} suspicious
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
