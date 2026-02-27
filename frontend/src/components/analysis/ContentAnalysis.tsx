import { AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import type { ContentDetails } from '../../types';

interface ContentAnalysisProps {
  details: ContentDetails;
}

export function ContentAnalysis({ details }: ContentAnalysisProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={20} className="text-purple-500" />
        <h3 className="text-lg font-semibold">Content Analysis (AI)</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <InfoCard
          label="Phishing"
          value={details.isPhishing ? 'Detected' : 'None'}
          isAlert={details.isPhishing}
        />
        <InfoCard
          label="Social Engineering"
          value={details.isSocialEngineering ? 'Detected' : 'None'}
          isAlert={details.isSocialEngineering}
        />
        <InfoCard
          label="Urgency Level"
          value={details.urgencyLevel}
          isAlert={details.urgencyLevel === 'high'}
        />
        <InfoCard label="Score" value={`${details.score}/100`} isAlert={details.score > 50} />
      </div>

      {details.summary && (
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4">
          <span className="font-medium">Summary: </span>
          {details.summary}
        </div>
      )}

      {details.suspiciousPatterns.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Suspicious Patterns Detected
          </h4>
          <ul className="space-y-1">
            {details.suspiciousPatterns.map((pattern, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded"
              >
                <AlertTriangle size={14} />
                {pattern}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  isAlert,
}: {
  label: string;
  value: string;
  isAlert: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg text-center ${
        isAlert ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
      }`}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-semibold text-sm flex items-center justify-center gap-1">
        {isAlert ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
        {value}
      </div>
    </div>
  );
}
