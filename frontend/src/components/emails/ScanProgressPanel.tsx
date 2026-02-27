import { X, AlertTriangle, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import type { ScanProgress } from '../../types';

interface ScanProgressPanelProps {
  progress: ScanProgress;
  onDismiss: () => void;
}

export function ScanProgressPanel({ progress, onDismiss }: ScanProgressPanelProps) {
  const { status, totalEmails, processedEmails, currentEmailSubject, currentPhase, contentRetrying, threatsFound, error } = progress;

  const percentage = totalEmails > 0 ? Math.round((processedEmails / totalEmails) * 100) : 0;

  if (status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            <span className="font-medium">
              Scan complete: {processedEmails} emails analyzed, {threatsFound} threat{threatsFound !== 1 ? 's' : ''} found.
            </span>
          </div>
          <button onClick={onDismiss} className="text-green-500 hover:text-green-700">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle size={18} />
            <span className="font-medium">Scan failed{error ? `: ${error}` : ''}</span>
          </div>
          <button onClick={onDismiss} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Running state
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 size={18} className="animate-spin" />
          <span className="font-medium">
            {currentPhase === 'fetching'
              ? 'Fetching emails from Gmail...'
              : `Analyzing ${processedEmails} of ${totalEmails} emails...`}
          </span>
        </div>
      </div>

      {currentPhase === 'analyzing' && totalEmails > 0 && (
        <>
          {/* Progress bar */}
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Current email */}
          {currentEmailSubject && (
            <p className="text-sm text-blue-600 truncate">
              Current: {currentEmailSubject}
            </p>
          )}

          {/* Retry indicator */}
          {contentRetrying && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle size={14} />
              <span>
                Retrying content analysis ({contentRetrying.attempt}/{contentRetrying.maxAttempts})...
              </span>
            </div>
          )}

          {/* Threats counter */}
          {threatsFound > 0 && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <Shield size={14} />
              <span>{threatsFound} threat{threatsFound !== 1 ? 's' : ''} found so far</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
