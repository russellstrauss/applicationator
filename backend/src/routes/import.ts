import { Router } from 'express';
import { StorageService } from '../services/storageService.js';

const router = Router();

// Import data
router.post('/', async (req, res) => {
  try {
    await StorageService.importAll(req.body);
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

