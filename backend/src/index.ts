// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Debug: Log if environment variables are loaded (without showing values)
console.log('Environment variables loaded:');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set');
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Not set');
console.log('  GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-auth/callback (default)');

// Suppress deprecation warnings from dependencies (harmless, coming from fs-extra/googleapis)
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('util._extend')) {
    return; // Suppress this specific harmless warning
  }
  console.warn(warning.name, warning.message);
});

import express from 'express';
import cors from 'cors';
import profilesRouter from './routes/profiles.js';
import userRouter from './routes/user.js';
import automateRouter from './routes/automate.js';
import fieldsRouter from './routes/fields.js';
import templatesRouter from './routes/templates.js';
import googleAuthRouter from './routes/googleAuth.js';
import exportRouter from './routes/export.js';
import importRouter from './routes/import.js';
import logsRouter from './routes/logs.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/profiles', profilesRouter);
app.use('/api/user', userRouter);
app.use('/api/automate', automateRouter);
app.use('/api/fields', fieldsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/google-auth', googleAuthRouter);
app.use('/api/export', exportRouter);
app.use('/api/import', importRouter);
app.use('/api/logs', logsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Applicationator API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
