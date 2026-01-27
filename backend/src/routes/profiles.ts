import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storageService.js';
import type { Profile } from '../../../shared/types.js';

const router = Router();

// Get all profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await StorageService.getAllProfiles();
    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single profile
router.get('/:id', async (req, res) => {
  try {
    const profile = await StorageService.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create profile
router.post('/', async (req, res) => {
  try {
    const profileData = req.body as Partial<Profile>;
    const profile: Profile = {
      id: uuidv4(),
      name: profileData.name || 'Unnamed Profile',
      personalInfo: profileData.personalInfo || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
        },
      },
      workExperience: profileData.workExperience || [],
      education: profileData.education || [],
      skills: profileData.skills || [],
      certifications: profileData.certifications || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = await StorageService.saveProfile(profile);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/:id', async (req, res) => {
  try {
    const existing = await StorageService.getProfile(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const updated: Profile = {
      ...existing,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
    };
    const saved = await StorageService.saveProfile(updated);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await StorageService.deleteProfile(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

