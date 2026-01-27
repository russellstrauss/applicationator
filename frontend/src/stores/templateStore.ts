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
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect Google Drive:', error);
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

