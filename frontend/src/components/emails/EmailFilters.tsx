import { Search } from 'lucide-react';

interface EmailFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  threatLevel: string;
  onThreatLevelChange: (value: string) => void;
}

const THREAT_LEVELS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Levels' },
  { value: 'safe', label: 'Safe' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function EmailFilters({
  search,
  onSearchChange,
  threatLevel,
  onThreatLevelChange,
}: EmailFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by subject or sender..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
      <select
        value={threatLevel}
        onChange={(e) => onThreatLevelChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
      >
        {THREAT_LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
    </div>
  );
}
