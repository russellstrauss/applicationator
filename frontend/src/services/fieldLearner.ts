import { FieldType } from '../../../shared/types';
import { fieldMatcher } from './fieldMatcher';
import { apiClient } from './apiClient';

export class FieldLearner {
  async promptForField(fieldName: string): Promise<FieldType> {
    // First try to match using existing patterns
    const match = await fieldMatcher.matchField(fieldName);
    
    if (match.confidence > 0.7) {
      return match.type;
    }

    // If low confidence, return UNKNOWN to trigger user prompt
    return FieldType.UNKNOWN;
  }

  async learnFromUser(fieldName: string, fieldType: FieldType, value?: string) {
    // Learn the pattern
    await fieldMatcher.learnPattern(fieldName, fieldType);
    
    // Store the mapping
    await apiClient.put(`/api/fields/mappings/${encodeURIComponent(fieldName)}`, {
      fieldType,
      confidence: 1.0,
    });

    return { fieldType, value };
  }
}

export const fieldLearner = new FieldLearner();

