import { Router } from 'express';
import { StorageService } from '../services/storageService.js';

const router = Router();

// Export all data
router.get('/', async (req, res) => {
  try {
    const data = await StorageService.exportAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="applicationator-export.json"');
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


