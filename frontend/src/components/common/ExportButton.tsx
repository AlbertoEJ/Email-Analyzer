import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { reportsApi } from '../../api';

interface ExportButtonProps {
  threatLevel?: string;
  startDate?: string;
  endDate?: string;
}

export function ExportButton({ threatLevel, startDate, endDate }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await reportsApi.export({ threatLevel, startDate, endDate });
      const blob = new Blob([response.data], { type: 'application/json' });
      const filename = `email-security-report-${new Date().toISOString().split('T')[0]}.json`;
      saveAs(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {isExporting ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <Download size={16} />
      )}
      Export JSON
    </button>
  );
}
