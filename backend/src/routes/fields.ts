import { Router } from 'express';
import { StorageService } from '../services/storageService.js';
import type { FieldMapping, LearnedPattern } from '../../../shared/types.js';

const router = Router();

// Get all field mappings
router.get('/mappings', async (req, res) => {
  try {
    const mappings = await StorageService.getFieldMappings();
    res.json(mappings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update field mapping
router.put('/mappings/:fieldName', async (req, res) => {
  try {
    const mappings = await StorageService.getFieldMappings();
    const fieldName = decodeURIComponent(req.params.fieldName);
    const existingIndex = mappings.findIndex((m: FieldMapping) => m.fieldName === fieldName);
    const updated: FieldMapping = {
      fieldName,
      fieldType: req.body.fieldType,
      confidence: req.body.confidence,
      learnedAt: existingIndex >= 0 ? mappings[existingIndex].learnedAt : new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      mappings[existingIndex] = updated;
    } else {
      mappings.push(updated);
    }
    await StorageService.saveFieldMappings(mappings);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete field mapping
router.delete('/mappings/:fieldName', async (req, res) => {
  try {
    const mappings = await StorageService.getFieldMappings();
    const fieldName = decodeURIComponent(req.params.fieldName);
    const filtered = mappings.filter((m: FieldMapping) => m.fieldName !== fieldName);
    await StorageService.saveFieldMappings(filtered);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get learned patterns
router.get('/patterns', async (req, res) => {
  try {
    const patterns = await StorageService.getLearnedPatterns();
    res.json(patterns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save learned pattern
router.post('/patterns', async (req, res) => {
  try {
    const patterns = await StorageService.getLearnedPatterns();
    const pattern = req.body as LearnedPattern;
    const existingIndex = patterns.findIndex((p: LearnedPattern) => p.fieldName === pattern.fieldName);
    if (existingIndex >= 0) {
      patterns[existingIndex] = pattern;
    } else {
      patterns.push(pattern);
    }
    await StorageService.saveLearnedPatterns(patterns);
    res.json(pattern);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
