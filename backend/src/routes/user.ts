import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storageService.js';
import type { User, PersonalInfo, Education } from '../../../shared/types.js';

const router = Router();

// Get user
router.get('/', async (req, res) => {
  try {
    const user = await StorageService.getUser();
    if (!user) {
      // Return default user structure if none exists
      return res.json({
        id: 'default',
        personalInfo: {
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
        education: [],
        updatedAt: new Date().toISOString(),
      });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/', async (req, res) => {
  try {
    const existing = await StorageService.getUser();
    const userData = req.body as Partial<User>;
    
    const user: User = {
      id: existing?.id || 'default',
      personalInfo: userData.personalInfo || existing?.personalInfo || {
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
      education: userData.education || existing?.education || [],
      updatedAt: new Date().toISOString(),
    };
    
    const saved = await StorageService.saveUser(user);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


