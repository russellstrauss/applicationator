import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

interface LogFile {
  name: string;
  path: string;
}

export default function LogViewer() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogFiles();
  }, []);

  const loadLogFiles = async () => {
    try {
      const response = await apiClient.get<{ files: LogFile[] }>('/api/logs/files');
      setLogFiles(response.files);
      if (response.files.length > 0 && !selectedFile) {
        setSelectedFile(response.files[response.files.length - 1].name);
      }
    } catch (error) {
      console.error('Failed to load log files:', error);
    }
  };

  const loadLogs = async (fileName: string, limit: number = 200) => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ logs: string[] }>(
        `/api/logs?limit=${limit}&file=${encodeURIComponent(fileName)}`
      );
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      loadLogs(selectedFile);
    }
  }, [selectedFile]);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Console Logs</h2>
        <p className="text-sm text-gray-500 mt-1">View browser console logs for debugging</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Log File
          </label>
          <select
            value={selectedFile || ''}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select a log file</option>
            {logFiles.map((file) => (
              <option key={file.name} value={file.name}>
                {file.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : logs.length > 0 ? (
          <div className="p-4">
            <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded overflow-auto max-h-96">
              {logs.map((log, idx) => (
                <div key={idx} className="mb-1 whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Showing {logs.length} log entries
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {selectedFile ? 'No logs found in this file' : 'Select a log file to view logs'}
          </div>
        )}
      </div>
    </div>
  );
}


