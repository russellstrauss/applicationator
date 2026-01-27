import { useState } from 'react';
import { apiClient } from '../services/apiClient';

export default function ExportImport() {
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'apply-matrix-export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export data');
      console.error(error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await apiClient.post('/api/import', data);
      alert('Data imported successfully! Please refresh the page.');
      window.location.reload();
    } catch (error) {
      alert('Failed to import data');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleExport}
        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors"
        title="Export all data"
      >
        Export
      </button>
      <label className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Import data">
        {importing ? 'Importing...' : 'Import'}
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={importing}
          className="hidden"
        />
      </label>
    </div>
  );
}

