import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { FieldType, LearnedPattern } from '../../../shared/types';
import { apiClient } from './apiClient';

class FieldMatcher {
  private model: use.UniversalSentenceEncoder | null = null;
  private patterns: LearnedPattern[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      this.model = await use.load();
      await this.loadPatterns();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize field matcher:', error);
    }
  }

  private async loadPatterns() {
    try {
      const patterns = await apiClient.get<LearnedPattern[]>('/api/fields/patterns');
      this.patterns = patterns;
    } catch (error) {
      console.error('Failed to load patterns:', error);
      this.patterns = [];
    }
  }

  async matchField(fieldName: string): Promise<{ type: FieldType; confidence: number }> {
    if (!this.model) {
      await this.initialize();
    }
    if (!this.model) {
      return { type: FieldType.UNKNOWN, confidence: 0 };
    }

    // Get embedding for field name
    const embedding = await this.model.embed([fieldName]);
    const fieldEmbedding = await embedding.array();
    const fieldVector = fieldEmbedding[0];

    // Find best match from learned patterns
    let bestMatch: { type: FieldType; confidence: number } = {
      type: FieldType.UNKNOWN,
      confidence: 0,
    };

    for (const pattern of this.patterns) {
      if (pattern.embedding) {
        const similarity = this.cosineSimilarity(fieldVector, pattern.embedding);
        if (similarity > bestMatch.confidence) {
          bestMatch = {
            type: pattern.fieldType,
            confidence: similarity,
          };
        }
      }
    }

    // If no good match found, try rule-based matching
    if (bestMatch.confidence < 0.7) {
      const ruleBased = this.ruleBasedMatch(fieldName);
      if (ruleBased.confidence > bestMatch.confidence) {
        return ruleBased;
      }
    }

    return bestMatch;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private ruleBasedMatch(fieldName: string): { type: FieldType; confidence: number } {
    const lower = fieldName.toLowerCase();
    
    if (lower.includes('first') && lower.includes('name')) {
      return { type: FieldType.FIRST_NAME, confidence: 0.8 };
    }
    if ((lower.includes('last') || lower.includes('surname')) && lower.includes('name')) {
      return { type: FieldType.LAST_NAME, confidence: 0.8 };
    }
    if (lower.includes('email')) {
      return { type: FieldType.EMAIL, confidence: 0.9 };
    }
    if (lower.includes('phone') || lower.includes('tel')) {
      return { type: FieldType.PHONE, confidence: 0.9 };
    }
    if (lower.includes('address') && lower.includes('street')) {
      return { type: FieldType.ADDRESS_STREET, confidence: 0.8 };
    }
    if (lower.includes('city')) {
      return { type: FieldType.ADDRESS_CITY, confidence: 0.8 };
    }
    if (lower.includes('state') && !lower.includes('address')) {
      return { type: FieldType.ADDRESS_STATE, confidence: 0.8 };
    }
    if (lower.includes('zip') || lower.includes('postal')) {
      return { type: FieldType.ADDRESS_ZIP, confidence: 0.8 };
    }

    return { type: FieldType.UNKNOWN, confidence: 0 };
  }

  async learnPattern(fieldName: string, fieldType: FieldType) {
    if (!this.model) {
      await this.initialize();
    }
    if (!this.model) return;

    // Get embedding
    const embedding = await this.model.embed([fieldName]);
    const fieldEmbedding = await embedding.array();
    const fieldVector = fieldEmbedding[0];

    // Create or update pattern
    const existingIndex = this.patterns.findIndex((p) => p.fieldName === fieldName);
    const pattern: LearnedPattern = {
      fieldName,
      fieldType,
      embedding: fieldVector,
      confidence: 1.0,
      usageCount: existingIndex >= 0 ? this.patterns[existingIndex].usageCount + 1 : 1,
      lastUsed: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.patterns[existingIndex] = pattern;
    } else {
      this.patterns.push(pattern);
    }

    // Save to backend
    try {
      await apiClient.post('/api/fields/patterns', pattern);
      // Also save as field mapping
      await apiClient.put(`/api/fields/mappings/${encodeURIComponent(fieldName)}`, {
        fieldType,
        confidence: 1.0,
      });
    } catch (error) {
      console.error('Failed to save pattern:', error);
    }
  }
}

export const fieldMatcher = new FieldMatcher();

