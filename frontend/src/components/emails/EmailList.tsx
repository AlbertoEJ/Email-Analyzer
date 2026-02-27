import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ThreatBadge } from './ThreatBadge';
import type { EmailAnalysis } from '../../types';

interface EmailListProps {
  emails: EmailAnalysis[];
}

export function EmailList({ emails }: EmailListProps) {
  const navigate = useNavigate();

  if (emails.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No emails found. Run a scan to analyze your inbox.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card layout */}
      <div className="space-y-3 md:hidden">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => navigate(`/emails/${email.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{email.subject}</p>
                <p className="text-sm text-gray-500 truncate mt-0.5">{email.senderEmail}</p>
              </div>
              <ThreatBadge level={email.threatLevel} />
            </div>
            {email.threatSummary && (
              <p className="text-xs text-gray-500 truncate mt-2">{email.threatSummary}</p>
            )}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
              <span>{format(new Date(email.date), 'MMM d, yyyy')}</span>
              <span className="font-mono font-bold text-gray-600">Score: {email.threatScore}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Subject</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Sender</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Score</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Threat Level</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr
                key={email.id}
                onClick={() => navigate(`/emails/${email.id}`)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 truncate max-w-xs">
                    {email.subject}
                  </div>
                  {email.threatSummary && (
                    <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                      {email.threatSummary}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[200px]">
                  {email.senderEmail}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {format(new Date(email.date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-mono font-bold">{email.threatScore}</span>
                </td>
                <td className="px-4 py-3">
                  <ThreatBadge level={email.threatLevel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
