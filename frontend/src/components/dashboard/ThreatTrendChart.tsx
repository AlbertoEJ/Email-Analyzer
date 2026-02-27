import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TrendData } from '../../types';

interface ThreatTrendChartProps {
  data: TrendData[];
}

export function ThreatTrendChart({ data }: ThreatTrendChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Threat Trends</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          No data available yet. Run a scan to see trends.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              name="Emails Scanned"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="threats"
              stroke="#ef4444"
              name="Threats Found"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#f97316"
              name="Avg Score"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
