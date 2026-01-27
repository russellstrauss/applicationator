import { apiClient } from './apiClient';

interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  url?: string;
  stack?: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // Flush every 5 seconds
  private flushTimer: number | null = null;
  private isInitialized = false;
  private localStorageDisabled = false; // Circuit breaker for localStorage
  private consecutiveFailures = 0;

  constructor() {
    // Store original console methods before interception
    const originalLog = console.log;
    const originalError = console.error;
    
    this.setupConsoleInterception();
    this.startAutoFlush();
    
    // Try to sync any pending logs from localStorage
    this.syncPendingLogs();
    
    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Log that logger is initialized (use original to avoid recursion)
    setTimeout(() => {
      originalLog('[Logger] Console logging initialized and capturing logs');
      this.isInitialized = true;
      
      // Try syncing pending logs again after a short delay
      setTimeout(() => this.syncPendingLogs(), 2000);
    }, 100);
  }

  private setupConsoleInterception() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = (...args: any[]) => {
      this.addLog('log', args);
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.addLog('error', args);
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.addLog('warn', args);
      originalWarn.apply(console, args);
    };

    console.info = (...args: any[]) => {
      this.addLog('info', args);
      originalInfo.apply(console, args);
    };

    console.debug = (...args: any[]) => {
      this.addLog('debug', args);
      originalDebug.apply(console, args);
    };

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.addLog('error', [
        `Unhandled Error: ${event.message}`,
        `File: ${event.filename}:${event.lineno}:${event.colno}`,
        event.error?.stack,
      ]);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', [
        `Unhandled Promise Rejection: ${event.reason}`,
        event.reason?.stack,
      ]);
    });
  }

  private addLog(level: LogEntry['level'], args: any[]) {
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      data: args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined,
    };

    // Extract stack trace from error objects
    if (args[0] instanceof Error) {
      logEntry.stack = args[0].stack;
    } else if (args[0]?.stack) {
      logEntry.stack = args[0].stack;
    }

    this.logs.push(logEntry);

    // Auto-flush if batch size reached
    if (this.logs.length >= this.batchSize) {
      this.flush();
    }
  }

  private startAutoFlush() {
    this.flushTimer = window.setInterval(() => {
      if (this.logs.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  async flush() {
    if (this.logs.length === 0) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      const response = await apiClient.post('/api/logs', { logs: logsToSend });
      // Successfully sent logs - try to sync any pending logs from localStorage
      await this.syncPendingLogs();
    } catch (error: any) {
      // Check if it's a CORS or network error (backend might not be running)
      const isNetworkError = error.message?.includes('Network Error') || 
                            error.message?.includes('Failed to fetch') ||
                            error.message?.includes('Request aborted') ||
                            error.code === 'ERR_NETWORK' ||
                            error.code === 'ECONNREFUSED';
      
      if (isNetworkError) {
        // Backend is likely not available - save to localStorage
        this.saveToLocalStorage(logsToSend);
        // Don't re-add to retry queue for network errors to prevent memory buildup
      } else {
        // Other errors - might be temporary, re-add to retry
        if (this.logs.length < 50) {
          this.logs.unshift(...logsToSend);
        } else {
          // Too many logs queued, save to localStorage instead
          this.saveToLocalStorage(logsToSend);
        }
      }
    }
  }

  private saveToLocalStorage(logs: LogEntry[]) {
    // Circuit breaker: if localStorage keeps failing, stop trying
    if (this.localStorageDisabled) {
      return;
    }

    try {
      const pendingKey = 'apply-matrix-pending-logs';
      const existing = localStorage.getItem(pendingKey);
      const pendingLogs = existing ? JSON.parse(existing) : [];
      
      // Add new logs but limit total to prevent quota issues
      const combined = [...pendingLogs, ...logs];
      
      // Keep only the most recent 100 entries to prevent quota issues
      const limited = combined.slice(-100);
      
      // Try to save, but if it fails due to quota, be more aggressive
      try {
        const serialized = JSON.stringify(limited);
        // Check size estimate (rough calculation: ~2 bytes per character)
        if (serialized.length > 100000) {
          // Too large, keep only last 25 entries
          const minimal = combined.slice(-25);
          localStorage.setItem(pendingKey, JSON.stringify(minimal));
        } else {
          localStorage.setItem(pendingKey, serialized);
        }
        // Success - reset failure counter
        this.consecutiveFailures = 0;
      } catch (quotaError: any) {
        this.consecutiveFailures++;
        if (quotaError.name === 'QuotaExceededError' || quotaError.message?.includes('quota')) {
          // Clear all pending logs - they're not critical
          try {
            localStorage.removeItem(pendingKey);
          } catch {
            // Ignore errors when clearing
          }
        }
        // If we've failed 3 times in a row, disable localStorage saving
        if (this.consecutiveFailures >= 3) {
          this.localStorageDisabled = true;
        }
      }
    } catch (error) {
      this.consecutiveFailures++;
      // localStorage might be full or unavailable - silently fail
      // Don't log this as it would create infinite recursion
      if (this.consecutiveFailures >= 3) {
        this.localStorageDisabled = true;
      }
    }
  }

  private clearPendingLogs() {
    try {
      localStorage.removeItem('apply-matrix-pending-logs');
    } catch (error) {
      // Ignore errors
    }
  }

  async syncPendingLogs() {
    try {
      const pendingKey = 'apply-matrix-pending-logs';
      const existing = localStorage.getItem(pendingKey);
      if (!existing) return;

      const pendingLogs = JSON.parse(existing);
      if (pendingLogs.length === 0) {
        this.clearPendingLogs();
        return;
      }

      try {
        // Send in smaller batches to avoid issues
        const batchSize = 50;
        for (let i = 0; i < pendingLogs.length; i += batchSize) {
          const batch = pendingLogs.slice(i, i + batchSize);
          await apiClient.post('/api/logs', { logs: batch });
        }
        this.clearPendingLogs();
        // Use original console to avoid recursion
        const originalLog = console.log;
        originalLog(`Synced ${pendingLogs.length} pending logs to server`);
      } catch (error: any) {
        // Check if it's a network error
        const isNetworkError = error.message?.includes('Network Error') || 
                              error.message?.includes('Failed to fetch') ||
                              error.code === 'ERR_NETWORK';
        if (!isNetworkError) {
          // Other error - log it but don't clear localStorage
          const originalWarn = console.warn;
          originalWarn('Could not sync pending logs:', error);
        }
        // Keep logs in localStorage for retry later
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  // Manual log method for important events
  log(level: LogEntry['level'], message: string, data?: any) {
    this.addLog(level, [message, data].filter(Boolean));
  }

  // Convenience methods
  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  // Get current log count (for debugging)
  getLogCount(): number {
    return this.logs.length;
  }

  // Force immediate flush (for testing)
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Clear all pending logs from localStorage (utility method)
  clearAllPendingLogs(): void {
    this.clearPendingLogs();
    this.logs = [];
  }

  // Get pending logs count
  getPendingLogsCount(): number {
    try {
      const pendingKey = 'apply-matrix-pending-logs';
      const existing = localStorage.getItem(pendingKey);
      if (!existing) return 0;
      const pendingLogs = JSON.parse(existing);
      return pendingLogs.length;
    } catch {
      return 0;
    }
  }
}

export const logger = new Logger();

// Also export a test function
export function testLogger() {
  logger.info('Test log message from logger');
  logger.warn('Test warning message');
  logger.error('Test error message');
  console.log('Regular console.log test');
  console.warn('Regular console.warn test');
  console.error('Regular console.error test');
}
