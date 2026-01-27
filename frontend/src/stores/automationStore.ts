import { create } from 'zustand';
import { AutomationSession } from '../../../shared/types';
import { apiClient } from '../services/apiClient';

interface AutomationStore {
  currentSession: AutomationSession | null;
  startAutomation: (config: { profileId: string; url?: string; mode: 'url' | 'manual' }) => Promise<void>;
  stopAutomation: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

export const automationStore = create<AutomationStore>((set) => ({
  currentSession: null,
  startAutomation: async (config) => {
    try {
      const session = await apiClient.post<AutomationSession>('/api/automate/start', config);
      set({ currentSession: session });
    } catch (error) {
      console.error('Failed to start automation:', error);
      throw error;
    }
  },
  stopAutomation: async () => {
    try {
      if (get().currentSession) {
        await apiClient.post(`/api/automate/stop/${get().currentSession!.id}`);
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, status: 'idle' as const }
            : null,
        }));
      }
    } catch (error) {
      console.error('Failed to stop automation:', error);
      throw error;
    }
  },
  checkStatus: async () => {
    try {
      const state = get();
      if (state.currentSession) {
        const session = await apiClient.get<AutomationSession>(
          `/api/automate/status/${state.currentSession.id}`
        );
        set({ currentSession: session });
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  },
}));

function get() {
  return automationStore.getState();
}

