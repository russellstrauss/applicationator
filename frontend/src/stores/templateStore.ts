import { create } from 'zustand';
import { ResumeTemplate } from '../../../shared/types';
import { apiClient } from '../services/apiClient';

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface TemplateStore {
  templates: ResumeTemplate[];
  isConnected: boolean;
  googleDocs: GoogleDoc[];
  loadingDocs: boolean;
  docsError: string | null;
  loadTemplates: () => Promise<void>;
  connectGoogleDrive: () => Promise<void>;
  checkConnectionStatus: () => Promise<void>;
  disconnectGoogleDrive: () => Promise<void>;
  listGoogleDocs: () => Promise<void>;
  createTemplate: (template: Partial<ResumeTemplate>) => Promise<void>;
  exportTemplate: (templateId: string, profileId: string) => Promise<void>;
}

export const templateStore = create<TemplateStore>((set) => ({
  templates: [],
  isConnected: false,
  googleDocs: [],
  loadingDocs: false,
  docsError: null,
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
      const response = await apiClient.get<{ url: string }>('/api/google-auth/url');
      if (response.url && response.url.startsWith('http')) {
        window.location.href = response.url;
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
  checkConnectionStatus: async () => {
    try {
      const response = await apiClient.get<{ connected: boolean }>('/api/google-auth/status');
      set({ isConnected: response.connected });
    } catch (error) {
      console.error('Failed to check connection status:', error);
      set({ isConnected: false });
    }
  },
  disconnectGoogleDrive: async () => {
    try {
      await apiClient.post('/api/google-auth/disconnect');
      set({ isConnected: false });
    } catch (error) {
      console.error('Failed to disconnect Google Drive:', error);
      throw error;
    }
  },
  listGoogleDocs: async () => {
    set({ loadingDocs: true, docsError: null });
    try {
      const docs = await apiClient.get<GoogleDoc[]>('/api/templates/drive/list');
      set({ googleDocs: docs, loadingDocs: false, docsError: null });
    } catch (error: any) {
      console.error('Failed to list Google Docs:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load Google Docs';
      set({ googleDocs: [], loadingDocs: false, docsError: errorMessage });
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
  exportTemplate: async (templateId, profileId) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}/export?profileId=${profileId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export template');
      }
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'resume.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export template:', error);
      throw error;
    }
  },
}));

