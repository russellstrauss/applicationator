import { create } from 'zustand';
import { FieldMapping } from '../../../shared/types';
import { apiClient } from '../services/apiClient';

interface FieldMappingStore {
  mappings: FieldMapping[];
  loadMappings: () => Promise<void>;
  updateMapping: (fieldName: string, data: Partial<FieldMapping>) => Promise<void>;
  deleteMapping: (fieldName: string) => Promise<void>;
}

export const fieldMappingStore = create<FieldMappingStore>((set) => ({
  mappings: [],
  loadMappings: async () => {
    try {
      const mappings = await apiClient.get<FieldMapping[]>('/api/fields/mappings');
      set({ mappings });
    } catch (error) {
      console.error('Failed to load field mappings:', error);
    }
  },
  updateMapping: async (fieldName, data) => {
    try {
      const updated = await apiClient.put<FieldMapping>(`/api/fields/mappings/${fieldName}`, data);
      set((state) => ({
        mappings: state.mappings.map((m) =>
          m.fieldName === fieldName ? updated : m
        ),
      }));
    } catch (error) {
      console.error('Failed to update mapping:', error);
      throw error;
    }
  },
  deleteMapping: async (fieldName) => {
    try {
      await apiClient.delete(`/api/fields/mappings/${fieldName}`);
      set((state) => ({
        mappings: state.mappings.filter((m) => m.fieldName !== fieldName),
      }));
    } catch (error) {
      console.error('Failed to delete mapping:', error);
      throw error;
    }
  },
}));


