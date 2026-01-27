import { create } from 'zustand';
import { Profile } from '../../../shared/types';
import { apiClient } from '../services/apiClient';

interface ProfileStore {
  profiles: Profile[];
  loadProfiles: () => Promise<void>;
  createProfile: (profile: Profile) => Promise<void>;
  updateProfile: (id: string, data: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
}

export const profileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  loadProfiles: async () => {
    try {
      const profiles = await apiClient.get<Profile[]>('/api/profiles');
      set({ profiles });
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  },
  createProfile: async (profile) => {
    try {
      const newProfile = await apiClient.post<Profile>('/api/profiles', profile);
      set((state) => ({ profiles: [...state.profiles, newProfile] }));
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  },
  updateProfile: async (id, data) => {
    try {
      const updated = await apiClient.put<Profile>(`/api/profiles/${id}`, data);
      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },
  deleteProfile: async (id) => {
    try {
      await apiClient.delete(`/api/profiles/${id}`);
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw error;
    }
  },
}));


