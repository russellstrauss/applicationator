import { create } from 'zustand';
import { ResumeTemplate } from '../../../shared/types';
import { apiClient } from '../services/apiClient';

interface TemplateStore {
  templates: ResumeTemplate[];
  loadTemplates: () => Promise<void>;
  connectGoogleDrive: () => Promise<void>;
  createTemplate: (template: Partial<ResumeTemplate>) => Promise<void>;
}

export const templateStore = create<TemplateStore>((set) => ({
  templates: [],
  loadTemplates: async () => {
    try {
      const templates = await apiClient.get<ResumeTemplate[]>('/api/templates');
      set({ templates });
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  },
  connectGoogleDrive: async () => {
    try {
      const authUrl = await apiClient.get<string>('/api/google-auth/url');
      if (authUrl && authUrl.startsWith('http')) {
        window.location.href = authUrl;
      } else {
        throw new Error('Invalid authentication URL received');
      }
    } catch (error: any) {
      console.error('Failed to connect Google Drive:', error);
      // Re-throw with more context
      if (error.response?.status === 500) {
        throw new Error('Google Drive OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend environment variables.');
      }
      throw error;
    }
  },
  createTemplate: async (template) => {
    try {
      const newTemplate = await apiClient.post<ResumeTemplate>('/api/templates', template);
      set((state) => ({ templates: [...state.templates, newTemplate] }));
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  },
}));

