import type { ThreatLevel } from '../../types';

const THREAT_COLORS: Record<ThreatLevel, string> = {
  safe: 'bg-green-100 text-green-800',
  low: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
};

const THREAT_LABELS: Record<ThreatLevel, string> = {
  safe: 'Safe',
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical',
};

export function ThreatBadge({
  level,
  score,
}: {
  level: ThreatLevel;
  score?: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${THREAT_COLORS[level]}`}
    >
      {THREAT_LABELS[level]}
      {score !== undefined && (
        <span className="font-bold">({score})</span>
      )}
    </span>
  );
}
