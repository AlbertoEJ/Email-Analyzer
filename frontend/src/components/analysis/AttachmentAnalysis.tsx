import { Paperclip, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AttachmentDetails } from '../../types';

interface AttachmentAnalysisProps {
  details: AttachmentDetails;
}

export function AttachmentAnalysis({ details }: AttachmentAnalysisProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip size={20} className="text-gray-500" />
        <h3 className="text-lg font-semibold">Attachment Analysis</h3>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-gray-600">
          Total: {details.attachments.length}
        </span>
        <span className="text-red-600">Malicious: {details.maliciousCount}</span>
        <span className="text-orange-600">Suspicious: {details.suspiciousCount}</span>
      </div>

      {details.attachments.length === 0 ? (
        <p className="text-gray-400 text-sm">No attachments in this email.</p>
      ) : (
        <div className="space-y-2">
          {details.attachments.map((att, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                att.virusTotal && att.virusTotal.malicious > 0
                  ? 'border-red-200 bg-red-50'
                  : att.isSuspiciousType
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {att.virusTotal && att.virusTotal.malicious > 0 ? (
                  <ShieldAlert className="text-red-500 shrink-0" size={16} />
                ) : att.isSuspiciousType ? (
                  <ShieldAlert className="text-orange-500 shrink-0" size={16} />
                ) : (
                  <ShieldCheck className="text-green-500 shrink-0" size={16} />
                )}
                <span className="text-sm font-medium">{att.filename}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {formatFileSize(att.size)}
                </span>
              </div>

              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span>Type: {att.mimeType}</span>
                {att.sha256 && <span className="font-mono">SHA256: {att.sha256.slice(0, 16)}...</span>}
                {att.virusTotal && (
                  <span>
                    VT: {att.virusTotal.malicious} malicious,{' '}
                    {att.virusTotal.suspicious} suspicious
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
