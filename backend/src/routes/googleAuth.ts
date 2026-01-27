import { Router } from 'express';
import { googleDriveService } from '../services/googleDriveService.js';

const router = Router();

// Get OAuth URL
router.get('/url', async (req, res) => {
  try {
    const url = googleDriveService.getAuthUrl();
    res.json(url);
  } catch (error: any) {
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
    res.redirect('http://localhost:3000/templates?connected=true');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

