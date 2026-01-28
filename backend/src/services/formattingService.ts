import type { TextFormatting } from '../../../shared/types.js';

/**
 * Formatting service for applying text formatting rules to resume templates
 * Provides centralized formatting logic and presets
 */
export class FormattingService {
  /**
   * Default formatting for section headers (name, summary title, etc.)
   */
  static getDefaultHeaderFormatting(): TextFormatting {
    return {
      bold: true,
      fontSize: 18,
    };
  }

  /**
   * Default formatting for section labels (Position:, Company:, etc.)
   */
  static getDefaultLabelFormatting(): TextFormatting {
    return {
      bold: true,
    };
  }

  /**
   * Default formatting for skill category names
   */
  static getDefaultSkillCategoryFormatting(): TextFormatting {
    return {
      bold: true,
    };
  }

  /**
   * Formatting for emphasis (important text, achievements)
   */
  static getEmphasisFormatting(): TextFormatting {
    return {
      bold: true,
      italic: true,
    };
  }

  /**
   * Formatting for highlighted text
   */
  static getHighlightFormatting(): TextFormatting {
    return {
      backgroundColor: {
        red: 1.0,
        green: 1.0,
        blue: 0.0, // Yellow highlight
      },
    };
  }

  /**
   * Formatting for colored text (e.g., for visual hierarchy)
   * @param color RGB color values (0-1 range)
   */
  static getColorFormatting(color: { red: number; green: number; blue: number }): TextFormatting {
    return {
      foregroundColor: color,
    };
  }

  /**
   * Merge multiple formatting options into a single formatting object
   * Later formatting options override earlier ones
   */
  static mergeFormatting(...formattingOptions: (Partial<TextFormatting> | undefined)[]): Partial<TextFormatting> {
    const merged: Partial<TextFormatting> = {};
    
    for (const formatting of formattingOptions) {
      if (!formatting) continue;
      
      if (formatting.bold !== undefined) {
        merged.bold = formatting.bold;
      }
      if (formatting.italic !== undefined) {
        merged.italic = formatting.italic;
      }
      if (formatting.underline !== undefined) {
        merged.underline = formatting.underline;
      }
      if (formatting.fontSize !== undefined) {
        merged.fontSize = formatting.fontSize;
      }
      if (formatting.foregroundColor) {
        merged.foregroundColor = formatting.foregroundColor;
      }
      if (formatting.backgroundColor) {
        merged.backgroundColor = formatting.backgroundColor;
      }
    }
    
    return merged;
  }

  /**
   * Apply formatting rules based on section type
   * @param sectionType The type of section (header, label, body, etc.)
   * @param customFormatting Optional custom formatting to override defaults
   */
  static getFormattingForSection(
    sectionType: 'header' | 'label' | 'body' | 'emphasis' | 'skillCategory',
    customFormatting?: Partial<TextFormatting>
  ): Partial<TextFormatting> {
    let defaultFormatting: Partial<TextFormatting>;
    
    switch (sectionType) {
      case 'header':
        defaultFormatting = this.getDefaultHeaderFormatting();
        break;
      case 'label':
        defaultFormatting = this.getDefaultLabelFormatting();
        break;
      case 'skillCategory':
        defaultFormatting = this.getDefaultSkillCategoryFormatting();
        break;
      case 'emphasis':
        defaultFormatting = this.getEmphasisFormatting();
        break;
      case 'body':
      default:
        defaultFormatting = {};
        break;
    }
    
    return this.mergeFormatting(defaultFormatting, customFormatting);
  }
}


