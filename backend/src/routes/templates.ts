import { Router } from 'express';
import { googleDriveService } from '../services/googleDriveService.js';
import type { ResumeTemplate } from '../../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storageService.js';

const router = Router();

// Get all templates (stored locally, linked to Google Drive)
router.get('/', async (req, res) => {
  try {
    // In a real implementation, templates would be stored in JSON
    // For now, return empty array
    res.json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List Google Drive documents
router.get('/drive/list', async (req, res) => {
  try {
    const documents = await googleDriveService.listDocuments();
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create template from Google Drive document
router.post('/', async (req, res) => {
  try {
    const { name, googleDriveId, profileId } = req.body;
    const template: ResumeTemplate = {
      id: uuidv4(),
      name,
      googleDriveId,
      profileId,
      placeholders: [], // Would be extracted from document
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Save template (implementation would use StorageService)
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export template to PDF
router.get('/:id/export', async (req, res) => {
  try {
    // Get template, then export from Google Drive
    const templateId = req.params.id;
    // In real implementation, fetch template and get googleDriveId
    // const pdf = await googleDriveService.exportToPDF(googleDriveId);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(pdf);
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


