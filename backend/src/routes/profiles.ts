import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storageService.js';
import type { Profile } from '../../../shared/types.js';

const router = Router();

// Export all profiles
router.get('/export', async (req, res) => {
  try {
    const profiles = await StorageService.getAllProfiles();
    res.json({
      profiles,
      exportedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Import profiles (upsert)
router.post('/import', async (req, res) => {
  try {
    const body = req.body as { profiles?: Profile[] };
    const profiles = body?.profiles || [];

    for (const profile of profiles) {
      // Ensure required fields exist; fall back to existing profile shape
      const existing = profile.id
        ? await StorageService.getProfile(profile.id)
        : null;

      const base: Profile =
        existing || {
          id: profile.id || uuidv4(),
          name: profile.name || 'Unnamed Profile',
          summary: profile.summary,
          workExperience: profile.workExperience || [],
          skills: profile.skills || [],
          certifications: profile.certifications || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

      const merged: Profile = {
        ...base,
        ...profile,
        id: base.id,
        updatedAt: new Date().toISOString(),
      };

      await StorageService.saveProfile(merged);
    }

    res.json({ success: true, importedCount: profiles.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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
      summary: profileData.summary,
      workExperience: profileData.workExperience || [],
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

