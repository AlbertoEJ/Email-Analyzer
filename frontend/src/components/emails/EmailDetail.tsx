import { format } from 'date-fns';
import { ThreatBadge } from './ThreatBadge';
import { HeaderAnalysis } from '../analysis/HeaderAnalysis';
import { UrlAnalysis } from '../analysis/UrlAnalysis';
import { ContentAnalysis } from '../analysis/ContentAnalysis';
import { AttachmentAnalysis } from '../analysis/AttachmentAnalysis';
import type { EmailDetail as EmailDetailType } from '../../types';

interface EmailDetailProps {
  email: EmailDetailType;
}

export function EmailDetailView({ email }: EmailDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 break-words">{email.subject}</h2>
            <p className="text-sm text-gray-600 mt-1">
              From: <span className="font-medium">{email.sender}</span>
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(email.date), 'MMMM d, yyyy HH:mm')}
            </p>
          </div>
          <div className="text-right">
            <ThreatBadge level={email.threatLevel} score={email.threatScore} />
          </div>
        </div>

        {email.threatSummary && (
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {email.threatSummary}
          </p>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Headers', score: email.headerScore, weight: '20%' },
            { label: 'URLs', score: email.urlScore, weight: '30%' },
            { label: 'Content', score: email.contentScore, weight: '30%' },
            { label: 'Attachments', score: email.attachmentScore, weight: '20%' },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{item.score}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
              <div className="text-xs text-gray-400">Weight: {item.weight}</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreColor(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Details */}
      {email.headerDetails && <HeaderAnalysis details={email.headerDetails} />}
      {email.urlDetails && <UrlAnalysis details={email.urlDetails} />}
      {email.contentDetails && <ContentAnalysis details={email.contentDetails} />}
      {email.attachmentDetails && <AttachmentAnalysis details={email.attachmentDetails} />}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score <= 20) return 'bg-green-500';
  if (score <= 40) return 'bg-yellow-500';
  if (score <= 60) return 'bg-orange-500';
  if (score <= 80) return 'bg-red-500';
  return 'bg-red-800';
}
