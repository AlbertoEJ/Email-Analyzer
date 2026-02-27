import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { ThreatLevel } from '../../types';

const COLORS: Record<ThreatLevel, string> = {
  safe: '#22c55e',
  low: '#eab308',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#991b1b',
};

interface ThreatTypeChartProps {
  distribution: Record<ThreatLevel, number>;
}

export function ThreatTypeChart({ distribution }: ThreatTypeChartProps) {
  const data = Object.entries(distribution)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: COLORS[key as ThreatLevel],
    }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Threat Distribution</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          No data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
