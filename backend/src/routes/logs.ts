import { Router } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGS_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOGS_DIR, `console-${new Date().toISOString().split('T')[0]}.log`);

// Ensure logs directory exists
fs.ensureDirSync(LOGS_DIR);

const router = Router();

// Receive logs from frontend
router.post('/', async (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({ error: 'Logs must be an array' });
    }

    // Format logs for file output
    const logEntries = logs.map((log: any) => {
      const timestamp = log.timestamp || new Date().toISOString();
      const level = log.level?.toUpperCase().padEnd(5) || 'LOG  ';
      const url = log.url ? ` [${log.url}]` : '';
      const stack = log.stack ? `\n${log.stack}` : '';
      const data = log.data ? `\nData: ${JSON.stringify(log.data, null, 2)}` : '';
      
      return `[${timestamp}] ${level}${url} ${log.message}${stack}${data}`;
    }).join('\n') + '\n\n';

    // Append to log file
    await fs.appendFile(LOG_FILE, logEntries, 'utf8');

    res.json({ success: true, message: `Logged ${logs.length} entries` });
  } catch (error: any) {
    console.error('Error saving logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent logs (for debugging)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const level = req.query.level as string;
    const fileName = req.query.file as string;

    // Use specified file or default to today's log file
    const logFile = fileName 
      ? path.join(LOGS_DIR, fileName)
      : LOG_FILE;

    if (await fs.pathExists(logFile)) {
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      
      let filtered = lines;
      if (level) {
        filtered = lines.filter(line => line.includes(` ${level.toUpperCase()}`));
      }

      const recent = filtered.slice(-limit);
      res.json({ logs: recent, count: recent.length });
    } else {
      res.json({ logs: [], count: 0 });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all log files
router.get('/files', async (req, res) => {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const logFiles = files
      .filter(file => file.startsWith('console-') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(LOGS_DIR, file),
      }));

    res.json({ files: logFiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

