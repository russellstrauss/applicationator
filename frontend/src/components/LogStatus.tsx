import { useState, useEffect } from 'react';
import { logger } from '../services/logger';

export default function LogStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      // Check pending logs
      setPendingCount(logger.getPendingLogsCount());

      // Check backend status
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearPending = () => {
    if (confirm(`Clear ${pendingCount} pending logs from localStorage?`)) {
      logger.clearAllPendingLogs();
      setPendingCount(0);
    }
  };

  const handleSync = async () => {
    try {
      await logger.syncPendingLogs();
      setPendingCount(logger.getPendingLogsCount());
    } catch (error) {
      console.error('Failed to sync logs:', error);
    }
  };

  if (pendingCount === 0 && backendStatus === 'online') {
    return null; // Don't show if everything is working
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg z-50 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-yellow-800 mb-1">
            Logging Status
          </div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>
              Backend: <span className={backendStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
                {backendStatus === 'online' ? '✓ Online' : '✗ Offline'}
              </span>
            </div>
            {pendingCount > 0 && (
              <div>
                Pending logs: <span className="font-semibold">{pendingCount}</span> in localStorage
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 ml-2">
          {pendingCount > 0 && (
            <>
              <button
                onClick={handleSync}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                title="Try to sync pending logs"
              >
                Sync
              </button>
              <button
                onClick={handleClearPending}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                title="Clear pending logs"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


