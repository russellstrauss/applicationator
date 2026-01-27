import puppeteer, { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import type { AutomationSession, Profile, FormField, FieldType, FieldMapping } from '../../../shared/types.js';
import { StorageService } from './storageService.js';

class AutomationService {
  private browser: Browser | null = null;
  private activeSessions: Map<string, AutomationSession> = new Map();

  async startSession(config: {
    profileId: string;
    url?: string;
    mode: 'url' | 'manual';
  }): Promise<AutomationSession> {
    const profile = await StorageService.getProfile(config.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const session: AutomationSession = {
      id: uuidv4(),
      profileId: config.profileId,
      url: config.url,
      mode: config.mode,
      status: 'running',
      progress: 0,
      errors: [],
      startedAt: new Date().toISOString(),
    };

    this.activeSessions.set(session.id, session);

    // Start automation in background
    this.runAutomation(session, profile).catch((error) => {
      session.status = 'error';
      session.errors.push({
        type: 'other',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    return session;
  }

  private async runAutomation(session: AutomationSession, profile: Profile) {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: false, // Set to true for production
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }

      const page = await this.browser.newPage();
      
      if (session.url) {
        await page.goto(session.url, { waitUntil: 'networkidle2' });
      }

      // Check if this is a multi-page form
      const isMultiPage = await this.detectMultiPageForm(page);
      
      if (isMultiPage) {
        await this.handleMultiPageForm(page, session, profile);
      } else {
        // Single page form
        const fields = await this.detectFormFields(page);
        session.currentStep = `Found ${fields.length} form fields`;
        session.progress = 10;

      // Fill fields based on profile data
      const unmappedFields: FormField[] = [];
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const result = await this.getFieldValue(field, profile);
        
        if (result.value) {
          try {
            await this.fillField(page, field, result.value);
            session.progress = 10 + (i / fields.length) * 70;
            
            // Learn the mapping if it was rule-based
            if (result.suggestedType && result.suggestedType !== FieldType.UNKNOWN) {
              await this.learnFieldMapping(field.name, result.suggestedType);
            }
          } catch (error: any) {
            session.errors.push({
              type: 'field_not_found',
              message: `Failed to fill ${field.name}: ${error.message}`,
              fieldName: field.name,
              timestamp: new Date().toISOString(),
            });
          }
        } else if (result.needsUserInput) {
          unmappedFields.push(field);
        }
      }

      // Handle unmapped fields - in production, this would pause and wait for user input
      if (unmappedFields.length > 0) {
        session.currentStep = `Found ${unmappedFields.length} unmapped fields requiring user input`;
        session.errors.push({
          type: 'field_unmapped',
          message: `Fields need mapping: ${unmappedFields.map(f => f.name).join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }

        session.progress = 100;
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
      }
    } catch (error: any) {
      session.status = 'error';
      session.errors.push({
        type: 'other',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async detectFormFields(page: Page): Promise<FormField[]> {
    return await page.evaluate(() => {
      const fields: FormField[] = [];
      const inputs = document.querySelectorAll('input, select, textarea');
      
      inputs.forEach((input) => {
        const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const name = element.getAttribute('name') || 
                    element.getAttribute('id') || 
                    element.getAttribute('placeholder') || 
                    'unknown';
        
        let type: FormField['type'] = 'text';
        if (element.tagName === 'SELECT') {
          type = 'select';
        } else if (element.tagName === 'TEXTAREA') {
          type = 'textarea';
        } else if (element instanceof HTMLInputElement) {
          type = (element.type || 'text') as FormField['type'];
        }

        fields.push({
          selector: `[name="${element.getAttribute('name')}"]` || 
                   `#${element.getAttribute('id')}` || 
                   `input[type="${type}"]`,
          name,
          type,
          required: element.hasAttribute('required'),
        });
      });

      return fields;
    });
  }

  private async getFieldValue(field: FormField, profile: Profile): Promise<{ value?: string; needsUserInput: boolean; suggestedType?: FieldType }> {
    // Check learned mappings first
    const mappings = await StorageService.getFieldMappings();
    const mapping = mappings.find((m: FieldMapping) => 
      m.fieldName.toLowerCase() === field.name.toLowerCase()
    );

    if (mapping && mapping.fieldType !== FieldType.UNKNOWN) {
      const value = this.extractValueFromProfile(profile, mapping.fieldType);
      if (value) {
        return { value, needsUserInput: false, suggestedType: mapping.fieldType };
      }
    }

    // Try rule-based matching
    const ruleBased = this.ruleBasedFieldMatch(field.name, profile);
    if (ruleBased.value) {
      return { value: ruleBased.value, needsUserInput: false, suggestedType: ruleBased.type };
    }

    // Needs user input
    return { needsUserInput: true, suggestedType: FieldType.UNKNOWN };
  }

  private extractValueFromProfile(profile: Profile, fieldType: FieldType): string | undefined {
    const personalInfo = profile.personalInfo;
    
    switch (fieldType) {
      case FieldType.FIRST_NAME:
        return personalInfo.firstName;
      case FieldType.LAST_NAME:
        return personalInfo.lastName;
      case FieldType.FULL_NAME:
        return `${personalInfo.firstName} ${personalInfo.lastName}`;
      case FieldType.EMAIL:
        return personalInfo.email;
      case FieldType.PHONE:
        return personalInfo.phone;
      case FieldType.ADDRESS_STREET:
        return personalInfo.address.street;
      case FieldType.ADDRESS_CITY:
        return personalInfo.address.city;
      case FieldType.ADDRESS_STATE:
        return personalInfo.address.state;
      case FieldType.ADDRESS_ZIP:
        return personalInfo.address.zipCode;
      case FieldType.ADDRESS_COUNTRY:
        return personalInfo.address.country;
      case FieldType.LINKEDIN:
        return personalInfo.linkedIn;
      case FieldType.PORTFOLIO:
        return personalInfo.portfolio;
      default:
        return undefined;
    }
  }

  private ruleBasedFieldMatch(fieldName: string, profile: Profile): { value?: string; type: FieldType } {
    const lower = fieldName.toLowerCase();
    const personalInfo = profile.personalInfo;

    if (lower.includes('first') && lower.includes('name')) {
      return { value: personalInfo.firstName, type: FieldType.FIRST_NAME };
    }
    if ((lower.includes('last') || lower.includes('surname')) && lower.includes('name')) {
      return { value: personalInfo.lastName, type: FieldType.LAST_NAME };
    }
    if (lower.includes('email')) {
      return { value: personalInfo.email, type: FieldType.EMAIL };
    }
    if (lower.includes('phone') || lower.includes('tel')) {
      return { value: personalInfo.phone, type: FieldType.PHONE };
    }
    if (lower.includes('address') && lower.includes('street')) {
      return { value: personalInfo.address.street, type: FieldType.ADDRESS_STREET };
    }
    if (lower.includes('city')) {
      return { value: personalInfo.address.city, type: FieldType.ADDRESS_CITY };
    }
    if (lower.includes('state') && !lower.includes('address')) {
      return { value: personalInfo.address.state, type: FieldType.ADDRESS_STATE };
    }
    if (lower.includes('zip') || lower.includes('postal')) {
      return { value: personalInfo.address.zipCode, type: FieldType.ADDRESS_ZIP };
    }

    return { type: FieldType.UNKNOWN };
  }

  private async fillField(page: Page, field: FormField, value: string) {
    const selector = field.selector;
    
    switch (field.type) {
      case 'select':
        await page.select(selector, value);
        break;
      case 'checkbox':
        await page.click(selector);
        break;
      case 'file':
        // File upload handling would go here
        break;
      default:
        await page.type(selector, value, { delay: 50 });
        break;
    }
  }

  async getSession(id: string): Promise<AutomationSession | null> {
    return this.activeSessions.get(id) || null;
  }

  async stopSession(id: string): Promise<void> {
    const session = this.activeSessions.get(id);
    if (session) {
      session.status = 'idle';
    }
    // Optionally close browser
    // if (this.browser) {
    //   await this.browser.close();
    //   this.browser = null;
    // }
  }

  private async learnFieldMapping(fieldName: string, fieldType: FieldType) {
    const mappings = await StorageService.getFieldMappings();
    const existing = mappings.find((m: FieldMapping) => m.fieldName === fieldName);
    
    if (!existing) {
      mappings.push({
        fieldName,
        fieldType,
        learnedAt: new Date().toISOString(),
        confidence: 0.8,
      });
      await StorageService.saveFieldMappings(mappings);
    }
  }

  private async detectMultiPageForm(page: Page): Promise<boolean> {
    // Check for pagination indicators
    const indicators = await page.evaluate(() => {
      const text = document.body.textContent?.toLowerCase() || '';
      const hasStepIndicator = /step \d+ of \d+|page \d+ of \d+|\d+ of \d+/.test(text);
      const hasProgressBar = document.querySelector('progress, [role="progressbar"], .progress');
      const hasNextButton = Array.from(document.querySelectorAll('button, a')).some((btn: any) => {
        const text = btn.textContent?.toLowerCase() || btn.value?.toLowerCase() || '';
        return text.includes('next') || text.includes('continue');
      });
      return hasStepIndicator || !!hasProgressBar || hasNextButton;
    });
    return indicators;
  }

  // Multi-page form handling
  async handleMultiPageForm(page: Page, session: AutomationSession, profile: Profile) {
    let currentPage = 1;
    let hasNext = true;
    const maxPages = 10; // Safety limit

    while (hasNext && currentPage <= maxPages) {
      session.currentStep = `Processing page ${currentPage}`;
      session.progress = Math.min(10 + (currentPage / maxPages) * 80, 90);
      
      // Wait for page to be ready
      await page.waitForSelector('input, select, textarea', { timeout: 5000 }).catch(() => {});
      
      // Detect and fill fields on current page
      const fields = await this.detectFormFields(page);
      const unmappedFields: FormField[] = [];
      
      for (const field of fields) {
        const result = await this.getFieldValue(field, profile);
        if (result.value) {
          try {
            await this.fillField(page, field, result.value);
            if (result.suggestedType && result.suggestedType !== FieldType.UNKNOWN) {
              await this.learnFieldMapping(field.name, result.suggestedType);
            }
          } catch (error: any) {
            session.errors.push({
              type: 'field_not_found',
              message: `Failed to fill ${field.name}: ${error.message}`,
              fieldName: field.name,
              timestamp: new Date().toISOString(),
            });
          }
        } else if (result.needsUserInput) {
          unmappedFields.push(field);
        }
      }

      if (unmappedFields.length > 0) {
        session.errors.push({
          type: 'field_unmapped',
          message: `Page ${currentPage}: Fields need mapping: ${unmappedFields.map(f => f.name).join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Look for next/continue button
      const nextButtonSelector = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
        for (const btn of buttons) {
          const text = (btn.textContent || (btn as HTMLInputElement).value || '').toLowerCase();
          if (text.includes('next') || text.includes('continue') || text.includes('proceed')) {
            // Return a selector for this button
            if (btn.id) return `#${btn.id}`;
            if (btn.className) return `.${btn.className.split(' ')[0]}`;
            return null;
          }
        }
        return null;
      });

      if (nextButtonSelector) {
        try {
          await page.click(nextButtonSelector);
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
          // Wait a bit for any dynamic content
          await page.waitForTimeout(1000);
          currentPage++;
        } catch (error: any) {
          session.errors.push({
            type: 'navigation_error',
            message: `Failed to navigate to next page: ${error.message}`,
            timestamp: new Date().toISOString(),
          });
          hasNext = false;
        }
      } else {
        // Check for submit button (last page)
        const submitButton = await page.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          session.currentStep = 'Form completed, ready to submit';
          session.progress = 95;
        }
        hasNext = false;
      }
    }

    session.progress = 100;
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
  }
}

export const automationService = new AutomationService();

