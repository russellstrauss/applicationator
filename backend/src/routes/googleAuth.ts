import { Router } from 'express';
import { googleDriveService } from '../services/googleDriveService.js';

const router = Router();

// Get OAuth URL
router.get('/url', async (req, res) => {
  try {
    // Debug: Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials:');
      console.error('  GOOGLE_CLIENT_ID:', clientId ? 'Set' : 'NOT SET');
      console.error('  GOOGLE_CLIENT_SECRET:', clientSecret ? 'Set' : 'NOT SET');
      return res.status(500).json({ 
        error: 'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env file and restart the server.' 
      });
    }
    
    const url = await googleDriveService.getAuthUrl();
    res.json({ url });
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    const token = await googleDriveService.handleCallback(code);
    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/templates?connected=true`);
  } catch (error: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/templates?connected=false&error=${encodeURIComponent(error.message)}`);
  }
});

// Check connection status
router.get('/status', async (req, res) => {
  try {
    const isConnected = await googleDriveService.isConnected();
    res.json({ connected: isConnected });
  } catch (error: any) {
    res.status(500).json({ error: error.message, connected: false });
  }
});

// Disconnect Google Drive
router.post('/disconnect', async (req, res) => {
  try {
    await googleDriveService.disconnect();
    res.json({ success: true, message: 'Disconnected from Google Drive' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


