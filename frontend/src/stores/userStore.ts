import { create } from 'zustand';
import { User, PersonalInfo, Education } from '../../../shared/types';
import { apiClient } from '../services/apiClient';

interface UserStore {
  user: User | null;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updatePersonalInfo: (personalInfo: PersonalInfo) => Promise<void>;
  updateEducation: (education: Education[]) => Promise<void>;
}

export const userStore = create<UserStore>((set, get) => ({
  user: null,
  loadUser: async () => {
    try {
      const user = await apiClient.get<User>('/api/user');
      set({ user });
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  },
  updateUser: async (data) => {
    try {
      const currentUser = get().user;
      const updated = await apiClient.put<User>('/api/user', {
        ...currentUser,
        ...data,
      });
      set({ user: updated });
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },
  updatePersonalInfo: async (personalInfo) => {
    try {
      const currentUser = get().user;
      const updated = await apiClient.put<User>('/api/user', {
        ...currentUser,
        personalInfo,
      });
      set({ user: updated });
    } catch (error) {
      console.error('Failed to update personal info:', error);
      throw error;
    }
  },
  updateEducation: async (education) => {
    try {
      const currentUser = get().user;
      const updated = await apiClient.put<User>('/api/user', {
        ...currentUser,
        education,
      });
      set({ user: updated });
    } catch (error) {
      console.error('Failed to update education:', error);
      throw error;
    }
  },
}));


