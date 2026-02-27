import { Mail, ShieldAlert, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { DashboardSummary } from '../../types';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Emails',
      value: summary.totalEmails,
      icon: Mail,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Threats Detected',
      value: summary.threatsDetected,
      icon: ShieldAlert,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Average Score',
      value: summary.averageScore,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Last Scan',
      value: summary.lastScanAt
        ? format(new Date(summary.lastScanAt), 'MMM d, HH:mm')
        : 'Never',
      icon: Clock,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} p-3 rounded-lg`}>
              <card.icon className={card.color} size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
