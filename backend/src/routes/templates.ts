import { Router } from 'express';
import { googleDriveService } from '../services/googleDriveService.js';
import type { ResumeTemplate } from '../../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storageService.js';
import { TemplateDataService } from '../services/templateDataService.js';

const router = Router();

// Get all templates (stored locally, linked to Google Drive)
router.get('/', async (req, res) => {
  try {
    const templates = await StorageService.getAllTemplates();
    res.json(templates);
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
    
    if (!name || !googleDriveId) {
      return res.status(400).json({ error: 'Name and googleDriveId are required' });
    }
    
    const template: ResumeTemplate = {
      id: uuidv4(),
      name,
      googleDriveId,
      profileId,
      placeholders: [], // Would be extracted from document
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const savedTemplate = await StorageService.saveTemplate(template);
    res.status(201).json(savedTemplate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export template to PDF with profile data
router.get('/:id/export', async (req, res) => {
  try {
    const templateId = req.params.id;
    const profileId = req.query.profileId as string;
    
    if (!profileId) {
      return res.status(400).json({ error: 'profileId query parameter is required' });
    }
    
    // Get template
    const template = await StorageService.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Get profile
    const profile = await StorageService.getProfile(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Get user data
    const user = await StorageService.getUser();
    
    // Build template data from profile and user
    const templateData = TemplateDataService.buildTemplateData(profile, user);
    const placeholderMap = TemplateDataService.getPlaceholderMap(templateData);
    
    // Build condition map for conditional blocks
    const conditionMap = new Map<string, boolean>();
    conditionMap.set('hideLocation', profile.hideLocation || false);
    conditionMap.set('showLocation', !(profile.hideLocation || false));
    
    // Fill placeholders and export to PDF
    const pdf = await googleDriveService.fillAndExportToPDF(template.googleDriveId, placeholderMap, conditionMap);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${template.name}-${profile.name}.pdf"`);
    res.send(pdf);
  } catch (error: any) {
    console.error('Failed to export template:', error);
    res.status(500).json({ error: error.message || 'Failed to export template' });
  }
});

export default router;


