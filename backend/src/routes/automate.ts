import { Router } from 'express';
import { automationService } from '../services/automationService.js';

const router = Router();

// Start automation
router.post('/start', async (req, res) => {
  try {
    const session = await automationService.startSession(req.body);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation status
router.get('/status/:id', async (req, res) => {
  try {
    const session = await automationService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stop automation
router.post('/stop/:id', async (req, res) => {
  try {
    await automationService.stopSession(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


