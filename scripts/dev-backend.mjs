#!/usr/bin/env node
/**
 * Run the backend dev server with an explicit cwd so it starts correctly
 * when launched from the root via concurrently.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..', 'backend');
const isWindows = platform() === 'win32';

// Ensure PATH includes backend's node_modules/.bin so tsx can be found
const nodeBinPath = path.join(backendDir, 'node_modules', '.bin');
const pathSeparator = isWindows ? ';' : ':';
const env = {
  ...process.env,
  PATH: `${nodeBinPath}${pathSeparator}${process.env.PATH}`,
};

// Use npm.cmd on Windows, npm on Unix
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Spawn npm run dev with proper cwd and env
const child = spawn(npmCmd, ['run', 'dev'], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('[dev-backend] Backend failed to start:', err.message);
  console.error('[dev-backend] Error details:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[dev-backend] Backend process killed by signal: ${signal}`);
    process.exit(1);
  }
  if (code != null && code !== 0) {
    console.error(`[dev-backend] Backend process exited with code: ${code}`);
    process.exit(code);
  }
});
