import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { GoogleAuthToken } from '../../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOKEN_PATH = path.join(__dirname, '../../tokens');
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');

export class GoogleDriveService {
  private oauth2Client: OAuth2Client | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Start initialization but don't wait for it
    this.initializationPromise = this.initializeOAuth();
  }

  private async initializeOAuth(): Promise<void> {
    // Load credentials from environment or file
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-auth/callback';

    if (clientId && clientSecret) {
      this.oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
      
      // Try to load existing token
      try {
        const tokenPath = path.join(TOKEN_PATH, 'token.json');
        if (await fs.pathExists(tokenPath)) {
          const token = await fs.readJson(tokenPath);
          this.oauth2Client.setCredentials(token);
          
          // Check if token needs refresh
          if (token.expiry_date && token.expiry_date <= Date.now()) {
            await this.refreshTokenIfNeeded();
          }
        }
      } catch (error) {
        // No existing token
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    } else {
      await this.initializeOAuth();
    }
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.oauth2Client) return;

    const credentials = this.oauth2Client.credentials;
    if (!credentials.refresh_token) return;

    try {
      // Check if token is expired or will expire soon (within 5 minutes)
      if (credentials.expiry_date && credentials.expiry_date <= Date.now() + 5 * 60 * 1000) {
        const { credentials: newCredentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(newCredentials);
        
        // Save refreshed token
        await fs.ensureDir(TOKEN_PATH);
        await fs.writeJson(path.join(TOKEN_PATH, 'token.json'), newCredentials);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Token refresh failed, user will need to re-authenticate
    }
  }

  async getAuthUrl(): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.oauth2Client) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
      }
      // Try to initialize again
      await this.initializeOAuth();
      if (!this.oauth2Client) {
        throw new Error('Failed to initialize Google OAuth. Please check your credentials.');
      }
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/documents', // Write access for filling placeholders
      'https://www.googleapis.com/auth/drive.file', // Access to create/delete files (for copying template)
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to ensure refresh token is obtained
    });
  }

  async handleCallback(code: string): Promise<GoogleAuthToken> {
    await this.ensureInitialized();
    
    if (!this.oauth2Client) {
      throw new Error('OAuth not initialized');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Save token
    await fs.ensureDir(TOKEN_PATH);
    await fs.writeJson(path.join(TOKEN_PATH, 'token.json'), tokens);

    return tokens as GoogleAuthToken;
  }

  async isConnected(): Promise<boolean> {
    await this.ensureInitialized();
    
    // Check if credentials are configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return false;
    }

    // Check if we have a valid token
    if (!this.oauth2Client) {
      return false;
    }

    const credentials = this.oauth2Client.credentials;
    if (!credentials.access_token) {
      return false;
    }

    // Check if token is expired and try to refresh
    if (credentials.expiry_date && credentials.expiry_date <= Date.now()) {
      try {
        await this.refreshTokenIfNeeded();
        // Check again after refresh attempt
        const newCredentials = this.oauth2Client.credentials;
        return !!newCredentials.access_token;
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  async disconnect(): Promise<void> {
    // Remove saved token
    try {
      const tokenPath = path.join(TOKEN_PATH, 'token.json');
      if (await fs.pathExists(tokenPath)) {
        await fs.remove(tokenPath);
      }
    } catch (error) {
      console.error('Failed to remove token:', error);
    }

    // Clear OAuth client
    if (this.oauth2Client) {
      this.oauth2Client.setCredentials({});
    }
    this.oauth2Client = null;
  }

  async getDriveClient() {
    await this.ensureInitialized();
    await this.refreshTokenIfNeeded();
    
    if (!this.oauth2Client) {
      throw new Error('OAuth not initialized');
    }
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async getDocsClient() {
    await this.ensureInitialized();
    await this.refreshTokenIfNeeded();
    
    if (!this.oauth2Client) {
      throw new Error('OAuth not initialized');
    }
    return google.docs({ version: 'v1', auth: this.oauth2Client });
  }

  async listDocuments(): Promise<any[]> {
    const drive = await this.getDriveClient();
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      fields: 'files(id, name, modifiedTime)',
    });
    return response.data.files || [];
  }

  async getDocumentContent(documentId: string): Promise<string> {
    const docs = await this.getDocsClient();
    const response = await docs.documents.get({ documentId });
    // Extract text content from document structure
    // This is simplified - actual implementation would parse the document structure
    return JSON.stringify(response.data);
  }

  /**
   * Fill placeholders in a Google Doc with provided data
   * @param documentId The Google Doc ID
   * @param placeholderMap Map of placeholder strings to replacement values
   * @param conditionMap Map of condition names to boolean values for conditional blocks
   * @param profile Optional profile data for loop processing
   */
  async fillPlaceholders(documentId: string, placeholderMap: Map<string, string>, conditionMap?: Map<string, boolean>, profile?: any): Promise<void> {
    const docs = await this.getDocsClient();
    
    // First, replace placeholders (this makes location fields empty when hideLocation is true)
    const requests: any[] = [];
    
    placeholderMap.forEach((replacementText, placeholder) => {
      requests.push({
        replaceAllText: {
          containsText: {
            text: placeholder,
            matchCase: false, // Case-insensitive matching
          },
          replaceText: replacementText || '', // Replace with empty string if value is null/undefined
        },
      });
    });
    
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }
    
    // Apply formatting to skills (bold category names)
    await this.formatSkillsCategories(documentId);
    
    // Then, handle loops BEFORE conditionals (loops may contain conditionals)
    // Process loops to expand {{#each}} blocks
    if (profile) {
      await this.processLoops(documentId, profile);
      // Process nested description loops after parent loops are expanded
      // This is a fallback in case processNestedDescriptionLoop (singular) didn't catch all blocks
      await this.processNestedDescriptionLoops(documentId, profile);
      // Clean up any remaining loop closing tags that might have been left behind
      await this.cleanupRemainingLoopTags(documentId);
    }
    
    // Then, handle conditional blocks AFTER placeholders and loops are replaced
    // This way we can match the actual content including empty placeholders
    if (conditionMap && conditionMap.size > 0) {
      await this.processConditionalBlocks(documentId, conditionMap);
    }
  }

  /**
   * Process conditional blocks in a Google Doc
   * Supports format: {{#if conditionName}}...content...{{/endif}}
   * If condition is false, removes the entire block including markers
   * If condition is true, removes only the markers and keeps content
   * 
   * Note: This processes conditionals AFTER placeholders are replaced,
   * so we can extract and match the actual block content
   */
  private async processConditionalBlocks(documentId: string, conditionMap: Map<string, boolean>): Promise<void> {
    const docs = await this.getDocsClient();
    
    // Get document after placeholders are replaced
    const document = await docs.documents.get({ documentId });
    const fullText = this.extractFullText(document.data);
    const requests: any[] = [];
    
    // Process each conditional block
    conditionMap.forEach((conditionValue, conditionName) => {
      // Pattern: {{#if conditionName}} or {{#if conditionName }} or {#if conditionName}
      const startPatterns = [
        `{{#if ${conditionName}}}`,
        `{{#if ${conditionName} }}`,
        `{#if ${conditionName}}`,
        `{#if ${conditionName} }`,
      ];
      
      const endPatterns = [
        '{{/endif}}',
        '{{/endif }}',
        '{/endif}',
        '{/endif }',
      ];
      
      // Find all blocks in the text
      for (const startPattern of startPatterns) {
        for (const endPattern of endPatterns) {
          // Use regex to find all blocks (non-greedy match)
          const regex = new RegExp(
            this.escapeRegex(startPattern) + '[\\s\\S]*?' + this.escapeRegex(endPattern),
            'gi'
          );
          
          let match;
          const blocks: string[] = [];
          while ((match = regex.exec(fullText)) !== null) {
            blocks.push(match[0]);
          }
          
          // Process each found block
          for (const block of blocks) {
            if (conditionValue) {
              // Condition is true - remove only the markers, keep content
              const content = block
                .replace(new RegExp(this.escapeRegex(startPattern), 'gi'), '')
                .replace(new RegExp(this.escapeRegex(endPattern), 'gi'), '');
              
              requests.push({
                replaceAllText: {
                  containsText: { text: block, matchCase: false },
                  replaceText: content,
                },
              });
            } else {
              // Condition is false - remove entire block
              requests.push({
                replaceAllText: {
                  containsText: { text: block, matchCase: false },
                  replaceText: '',
                },
              });
            }
          }
        }
      }
    });
    
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }
  }

  /**
   * Process loop blocks in a Google Doc
   * Supports format: {{#each collectionName}}...content with {{fieldName}}...{{/endeach}}
   * Expands the block for each item in the collection, replacing item-specific placeholders
   * 
   * Supported collections:
   * - workExperience: loops through profile.workExperience array
   * - skills: loops through profile.skills array (SkillCategory[])
   * - certifications: loops through profile.certifications array
   * 
   * Placeholders within loops:
   * - For workExperience: {{position}}, {{company}}, {{location}}, {{startDate}}, {{endDate}}, {{current}}, {{description}}
   * - For skills: {{title}}, {{skills}} (comma-separated list)
   * - For certifications: {{name}}, {{issuer}}, {{issueDate}}, {{expiryDate}}, {{credentialId}}
   */
  private async processLoops(documentId: string, profile: any): Promise<void> {
    const docs = await this.getDocsClient();
    
    // Process loops iteratively - each iteration processes one set of loops
    // This is necessary because after replacing, the document structure changes
    let hasMoreLoops = true;
    let iterations = 0;
    const maxIterations = 10; // Safety limit
    
    while (hasMoreLoops && iterations < maxIterations) {
      iterations++;
      
      // Get document current state
      const document = await docs.documents.get({ documentId });
      const fullText = this.extractFullText(document.data);
      const requests: any[] = [];
      
      // Define supported collections and their data accessors
      const collections: { [key: string]: () => any[] } = {
        workExperience: () => profile.workExperience || [],
        skills: () => profile.skills || [],
        certifications: () => profile.certifications || [],
      };
      
      hasMoreLoops = false;
      
      // Process each collection type
      for (const collectionName of Object.keys(collections)) {
        const getCollection = collections[collectionName];
        const items = getCollection();
        
        // Find all loop blocks for this collection
        const startPatterns = [
          `{{#each ${collectionName}}}`,
          `{{#each ${collectionName} }}`,
          `{#each ${collectionName}}`,
          `{#each ${collectionName} }`,
        ];
        
        const endPatterns = [
          '{{/endeach}}',
          '{{/endeach }}',
          '{/endeach}',
          '{/endeach }',
        ];
        
        for (const startPattern of startPatterns) {
          for (const endPattern of endPatterns) {
            const regex = new RegExp(
              this.escapeRegex(startPattern) + '([\\s\\S]*?)' + this.escapeRegex(endPattern),
              'gi'
            );
            
            let match;
            const blocks: Array<{ full: string; content: string }> = [];
            
            // Find all blocks
            while ((match = regex.exec(fullText)) !== null) {
              blocks.push({
                full: match[0],
                content: match[1], // Content between start and end markers
              });
            }
            
            if (blocks.length > 0) {
              hasMoreLoops = true;
            }
            
            // Process each block
            for (const block of blocks) {
              if (items.length === 0) {
                // If collection is empty, remove the entire block
                requests.push({
                  replaceAllText: {
                    containsText: { text: block.full, matchCase: false },
                    replaceText: '',
                  },
                });
              } else {
                const expandedContent: string[] = [];
                
                // Expand block for each item
                items.forEach((item) => {
                  let itemContent = block.content;
                  
                  // Replace item-specific placeholders
                  if (collectionName === 'workExperience') {
                    itemContent = this.replaceWorkExperiencePlaceholders(itemContent, item);
                  } else if (collectionName === 'skills') {
                    itemContent = this.replaceSkillsPlaceholders(itemContent, item);
                  } else if (collectionName === 'certifications') {
                    itemContent = this.replaceCertificationPlaceholders(itemContent, item);
                  }
                  
                  expandedContent.push(itemContent);
                });
                
                // Replace the entire block with expanded content
                const replacement = expandedContent.join('\n\n'); // Separate items with double newline
                
                requests.push({
                  replaceAllText: {
                    containsText: { text: block.full, matchCase: false },
                    replaceText: replacement,
                  },
                });
              }
            }
          }
        }
      }
      
      // Apply all requests for this iteration
      if (requests.length > 0) {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: { requests },
        });
      }
    }
  }

  /**
   * Replace work experience placeholders within a loop block
   * Also handles nested {{#each description}} loops
   */
  private replaceWorkExperiencePlaceholders(content: string, item: any): string {
    // Parse description into array of items
    const descriptionItems = this.parseDescriptionItems(item.description || '');
    
    // Check for nested description loops (check all possible variations)
    const hasNestedLoop = content.includes('{{#each description}}') || 
                          content.includes('{{#each description }}') ||
                          content.includes('{#each description}') ||
                          content.includes('{#each description }');
    
    // Debug logging
    if (hasNestedLoop) {
      console.log(`[Nested Loop Debug] Processing nested description loop for: ${item.position} at ${item.company}`);
      console.log(`[Nested Loop Debug] Description items count: ${descriptionItems.length}`);
      console.log(`[Nested Loop Debug] Description items:`, descriptionItems);
      console.log(`[Nested Loop Debug] Content before processing (first 500 chars): "${content.substring(0, 500)}"`);
    }
    
    // First, handle nested {{#each description}} loops if present
    let result = this.processNestedDescriptionLoop(content, descriptionItems);
    
    // Debug logging
    if (hasNestedLoop) {
      console.log(`[Nested Loop Debug] Content after processing (first 500 chars): "${result.substring(0, 500)}"`);
      const stillHasMarkers = result.includes('{{#each description}}') || 
                               result.includes('{{#each description }}') ||
                               result.includes('{#each description}') ||
                               result.includes('{#each description }');
      console.log(`[Nested Loop Debug] Still contains markers: ${stillHasMarkers}`);
      if (stillHasMarkers) {
        console.log(`[Nested Loop Debug] ERROR: Markers still present after processing!`);
      }
    }
    
    // Then replace regular placeholders
    const replacements: { [key: string]: string } = {
      '{{position}}': item.position || '',
      '{{company}}': item.company || '',
      '{{location}}': item.location || '',
      '{{startDate}}': item.startDate || '',
      '{{endDate}}': item.current ? '' : (item.endDate || ''),
      '{{current}}': item.current ? 'Yes' : 'No',
      '{{description}}': item.description || '', // Keep for backward compatibility
      // Also support with spaces
      '{{ position }}': item.position || '',
      '{{ company }}': item.company || '',
      '{{ location }}': item.location || '',
      '{{ startDate }}': item.startDate || '',
      '{{ endDate }}': item.current ? '' : (item.endDate || ''),
      '{{ current }}': item.current ? 'Yes' : 'No',
      '{{ description }}': item.description || '',
      // Without double braces
      '{position}': item.position || '',
      '{company}': item.company || '',
      '{location}': item.location || '',
      '{startDate}': item.startDate || '',
      '{endDate}': item.current ? '' : (item.endDate || ''),
      '{current}': item.current ? 'Yes' : 'No',
      '{description}': item.description || '',
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(this.escapeRegex(placeholder), 'gi');
      result = result.replace(regex, value);
    });
    
    return result;
  }

  /**
   * Parse description string into array of items
   * Splits by newlines, trims whitespace, and filters empty strings
   */
  private parseDescriptionItems(description: string): string[] {
    if (!description) return [];
    return description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Process nested {{#each description}} loop within work experience content
   * This is called during work experience loop expansion
   */
  private processNestedDescriptionLoop(content: string, descriptionItems: string[]): string {
    const startPatterns = [
      '{{#each description}}',
      '{{#each description }}',
      '{#each description}',
      '{#each description }',
    ];
    
    const endPatterns = [
      '{{/endeach}}',
      '{{/endeach }}',
      '{/endeach}',
      '{/endeach }',
    ];
    
    let result = content;
    let hasMoreLoops = true;
    let iterations = 0;
    const maxIterations = 10; // Safety limit
    
    // Debug: Check if content contains any start patterns
    const containsStartPattern = startPatterns.some(pattern => result.includes(pattern));
    const containsEndPattern = endPatterns.some(pattern => result.includes(pattern));
    console.log(`[Nested Loop Debug] Content contains start pattern: ${containsStartPattern}`);
    console.log(`[Nested Loop Debug] Content contains end pattern: ${containsEndPattern}`);
    if (containsStartPattern && !containsEndPattern) {
      console.log(`[Nested Loop Debug] WARNING: Found start pattern but no end pattern!`);
    }
    
    // Process loops iteratively to handle multiple nested loops
    while (hasMoreLoops && iterations < maxIterations) {
      iterations++;
      hasMoreLoops = false;
      
      // Try all pattern combinations
      for (const startPattern of startPatterns) {
        for (const endPattern of endPatterns) {
          const regex = new RegExp(
            this.escapeRegex(startPattern) + '([\\s\\S]*?)' + this.escapeRegex(endPattern),
            'gi'
          );
          
          const blocks: Array<{ full: string; content: string; index: number }> = [];
          
          // Use a more precise algorithm to find blocks
          // Find each start pattern, then find the CLOSEST end pattern after it
          // If no end pattern is found, assume the loop continues to the end of the content
          let searchStart = 0;
          while (true) {
            // Find the next start pattern
            const startIndex = result.indexOf(startPattern, searchStart);
            if (startIndex === -1) break;
            
            // Find the closest end pattern after this start pattern
            const afterStart = result.substring(startIndex + startPattern.length);
            let endIndex = afterStart.indexOf(endPattern);
            
            // If no end pattern found, assume the loop goes to the end of the content
            // This handles templates that don't have explicit closing tags
            // But we should stop at parent-level markers or template structure
            if (endIndex === -1) {
              // Look for parent-level markers that would indicate the end of this work experience block
              const parentMarkers = ['{{/endeach}}', '{/endeach}', '{{#each workExperience}}', '{#each workExperience}'];
              let foundParentMarker = false;
              let parentMarkerIndex = afterStart.length;
              
              for (const marker of parentMarkers) {
                const markerIndex = afterStart.indexOf(marker);
                if (markerIndex !== -1 && markerIndex < parentMarkerIndex) {
                  parentMarkerIndex = markerIndex;
                  foundParentMarker = true;
                }
              }
              
              // Extract content up to the parent marker (or end of content)
              // Trim any trailing whitespace or stray characters
              let content = afterStart.substring(0, parentMarkerIndex);
              
              // Remove any trailing single braces or other template artifacts
              content = content.replace(/\{\s*$/, '').trimEnd();
              
              const full = startPattern + content; // No closing tag, just start + content
              
              // Only process if we have description items and meaningful content
              if (descriptionItems.length > 0 && content.trim().length > 0) {
                blocks.push({
                  full,
                  content,
                  index: startIndex,
                });
                console.log(`[Nested Loop Debug] Found block without closing tag, using content to end: "${content.substring(0, 100)}"`);
              }
              
              // Move search past this block
              searchStart = startIndex + startPattern.length + (foundParentMarker ? parentMarkerIndex : afterStart.length);
              continue;
            }
            
            const actualEndIndex = startIndex + startPattern.length + endIndex + endPattern.length;
            const content = result.substring(startIndex + startPattern.length, startIndex + startPattern.length + endIndex);
            const full = result.substring(startIndex, actualEndIndex);
            
            // Check if this block contains another start pattern - if so, it's incorrectly nested, skip it
            const hasNestedStart = startPatterns.some(pattern => content.includes(pattern));
            if (!hasNestedStart) {
              blocks.push({
                full,
                content,
                index: startIndex,
              });
            }
            
            // Continue searching after this block
            searchStart = actualEndIndex;
          }
          
          if (blocks.length > 0) {
            hasMoreLoops = true;
            
            // Process each block - replace one at a time from end to start to preserve indices
            // Sort by index in reverse order so we process from end to start
            blocks.sort((a, b) => b.index - a.index);
            
            console.log(`[Nested Loop Debug] Found ${blocks.length} nested description loop blocks to process`);
            
            for (const block of blocks) {
              console.log(`[Nested Loop Debug] Processing block at index ${block.index}`);
              console.log(`[Nested Loop Debug] Block full text: "${block.full.substring(0, 200)}"`);
              console.log(`[Nested Loop Debug] Block content: "${block.content.substring(0, 200)}"`);
              
              if (descriptionItems.length === 0) {
                // If no description items, remove the entire block
                if (block.full.startsWith(startPattern) && !block.full.includes(endPattern)) {
                  // No closing tag - remove from start to end of content
                  result = result.substring(0, block.index);
                  console.log(`[Nested Loop Debug] Removed empty description block (no closing tag)`);
                } else {
                  // Has closing tag - remove the full block
                  result = result.substring(0, block.index) + result.substring(block.index + block.full.length);
                  console.log(`[Nested Loop Debug] Removed empty description block (with closing tag)`);
                }
              } else {
                // Expand block for each description item
                const expandedContent: string[] = [];
                
                descriptionItems.forEach((item, index) => {
                  let itemContent = String(block.content); // Make a copy
                  
                  // Replace description item placeholders
                  const itemReplacements: { [key: string]: string } = {
                    '{{item}}': item,
                    '{{text}}': item,
                    '{{index}}': String(index),
                    '{{index1}}': String(index + 1), // 1-based index
                    // With spaces
                    '{{ item }}': item,
                    '{{ text }}': item,
                    '{{ index }}': String(index),
                    '{{ index1 }}': String(index + 1),
                    // Without double braces
                    '{item}': item,
                    '{text}': item,
                    '{index}': String(index),
                    '{index1}': String(index + 1),
                  };
                  
                  Object.entries(itemReplacements).forEach(([placeholder, value]) => {
                    const placeholderRegex = new RegExp(this.escapeRegex(placeholder), 'gi');
                    itemContent = itemContent.replace(placeholderRegex, value);
                  });
                  
                  expandedContent.push(itemContent);
                });
                
                // Replace using the exact index from the match
                // If the block doesn't have a closing tag (full === startPattern + content), 
                // we need to replace from startIndex to the end of the content
                const replacement = expandedContent.join('\n');
                
                if (block.full.startsWith(startPattern) && !block.full.includes(endPattern)) {
                  // No closing tag - replace from start to end of content
                  result = result.substring(0, block.index) + replacement;
                  console.log(`[Nested Loop Debug] Replaced block (no closing tag) with ${expandedContent.length} description items`);
                } else {
                  // Has closing tag - replace the full block
                  result = result.substring(0, block.index) + replacement + result.substring(block.index + block.full.length);
                  console.log(`[Nested Loop Debug] Replaced block (with closing tag) with ${expandedContent.length} description items`);
                }
              }
            }
            
            // Break after processing blocks for this pattern combination
            // We'll re-iterate to find any remaining blocks
            break;
          }
        }
        if (hasMoreLoops) break; // Break outer loop too if we found blocks
      }
    }
    
    return result;
  }

  /**
   * Process nested {{#each description}} loops in the document
   * This runs after work experience loops are expanded, so it can find
   * description loops within each expanded work experience block
   */
  private async processNestedDescriptionLoops(documentId: string, profile: any): Promise<void> {
    const docs = await this.getDocsClient();
    
    let hasMoreLoops = true;
    let iterations = 0;
    const maxIterations = 50; // Increased to handle more blocks
    let workExpIndex = 0; // Track work experience index across iterations
    
    while (hasMoreLoops && iterations < maxIterations) {
      iterations++;
      hasMoreLoops = false;
      
      const document = await docs.documents.get({ documentId });
      const fullText = this.extractFullText(document.data);
      
      const startPatterns = [
        '{{#each description}}',
        '{{#each description }}',
        '{#each description}',
        '{#each description }',
      ];
      
      const endPatterns = [
        '{{/endeach}}',
        '{{/endeach }}',
        '{/endeach}',
        '{/endeach }',
      ];
      
      // Find all description loops with their unique context
      const allBlocks: Array<{ 
        full: string; 
        content: string; 
        index: number; 
        startPattern: string; 
        endPattern: string;
        contextBefore: string;
      }> = [];
      
      for (const startPattern of startPatterns) {
        for (const endPattern of endPatterns) {
          const regex = new RegExp(
            this.escapeRegex(startPattern) + '([\\s\\S]*?)' + this.escapeRegex(endPattern),
            'gi'
          );
          
          let match;
          while ((match = regex.exec(fullText)) !== null) {
            const blockIndex = match.index;
            const contextBefore = fullText.substring(Math.max(0, blockIndex - 2000), blockIndex);
            
            allBlocks.push({
              full: match[0],
              content: match[1],
              index: blockIndex,
              startPattern,
              endPattern,
              contextBefore,
            });
          }
        }
      }
      
      if (allBlocks.length === 0) {
        break; // No more loops to process
      }
      
      console.log(`[Nested Loops Plural] Found ${allBlocks.length} description loop blocks`);
      
      hasMoreLoops = true;
      
      // Process blocks one at a time
      // Process in forward order (first to last) so we can match by order
      allBlocks.sort((a, b) => a.index - b.index);
      
      // Process only the first block in this iteration
      // After replacement, the document changes, so we'll find the next block in the next iteration
      if (allBlocks.length > 0) {
        const block = allBlocks[0];
        console.log(`[Nested Loops Plural] Processing block ${workExpIndex + 1}, content preview: "${block.content.substring(0, 100)}"`);
        // Re-read document to get current state
        const currentDoc = await docs.documents.get({ documentId });
        const currentText = this.extractFullText(currentDoc.data);
        
        // Find this block in current document
        const blockIndex = currentText.indexOf(block.full);
        if (blockIndex === -1) {
          continue; // Block already processed or not found
        }
        
        // Get fresh context from current document
        const contextBefore = currentText.substring(Math.max(0, blockIndex - 2000), blockIndex);
        
        let matchingWorkExp: any = null;
        
        if (profile.workExperience && profile.workExperience.length > 0) {
          // Primary strategy: Match by order (most reliable when loops are in same order as work experiences)
          if (workExpIndex < profile.workExperience.length) {
            matchingWorkExp = profile.workExperience[workExpIndex];
            workExpIndex++;
          } else {
            // Fallback: If we've run out of work experiences, try context matching
            let bestMatchScore = 0;
            for (const workExp of profile.workExperience) {
              let score = 0;
              if (workExp.position && contextBefore.includes(workExp.position)) {
                score += 2;
              }
              if (workExp.company && contextBefore.includes(workExp.company)) {
                score += 1;
              }
              if (score > bestMatchScore) {
                bestMatchScore = score;
                matchingWorkExp = workExp;
              }
            }
            
            // If still no match, try single field
            if (!matchingWorkExp) {
              for (const workExp of profile.workExperience) {
                if (workExp.position && contextBefore.includes(workExp.position)) {
                  matchingWorkExp = workExp;
                  break;
                }
              }
            }
          }
        }
        
        if (matchingWorkExp) {
          const descriptionItems = this.parseDescriptionItems(matchingWorkExp.description || '');
          
          if (descriptionItems.length === 0) {
            await docs.documents.batchUpdate({
              documentId,
              requestBody: {
                requests: [{
                  replaceAllText: {
                    containsText: { text: block.full, matchCase: false },
                    replaceText: '',
                  },
                }],
              },
            });
          } else {
            const expandedContent: string[] = [];
            
            // Process each description item - create one expanded line per item
            // IMPORTANT: We need to process ALL items, not just the first one
            for (let index = 0; index < descriptionItems.length; index++) {
              const item = descriptionItems[index];
              // Start with a fresh copy of the block content for each item
              let itemContent = String(block.content); // Ensure it's a string copy
              
              // Replace description item placeholders
              const itemReplacements: { [key: string]: string } = {
                '{{item}}': item,
                '{{text}}': item,
                '{{index}}': String(index),
                '{{index1}}': String(index + 1),
                '{{ item }}': item,
                '{{ text }}': item,
                '{{ index }}': String(index),
                '{{ index1 }}': String(index + 1),
                '{item}': item,
                '{text}': item,
                '{index}': String(index),
                '{index1}': String(index + 1),
              };
              
              Object.entries(itemReplacements).forEach(([placeholder, value]) => {
                const placeholderRegex = new RegExp(this.escapeRegex(placeholder), 'gi');
                itemContent = itemContent.replace(placeholderRegex, value);
              });
              
              expandedContent.push(itemContent);
            }
            
            // Join all expanded items with newlines - each item on its own line
            const replacementText = expandedContent.join('\n');
            
            // Debug logging to help diagnose the issue
            console.log(`[Description Loop Debug] Work Experience: ${matchingWorkExp.position} at ${matchingWorkExp.company}`);
            console.log(`[Description Loop Debug] Description items count: ${descriptionItems.length}`);
            console.log(`[Description Loop Debug] Description items:`, descriptionItems);
            console.log(`[Description Loop Debug] Block content: "${block.content}"`);
            console.log(`[Description Loop Debug] Expanded content count: ${expandedContent.length}`);
            console.log(`[Description Loop Debug] Expanded content:`, expandedContent);
            console.log(`[Description Loop Debug] Replacement text (first 300 chars): "${replacementText.substring(0, 300)}"`);
            
            // Replace this specific block
            // Since replaceAllText replaces ALL occurrences, we need to make the block unique
            // by using a temporary unique marker, then replacing that marker with the content
            const uniqueMarker = `__DESC_LOOP_TEMP_${Date.now()}_${Math.random().toString(36).substring(7)}__`;
            
            // First, replace the block with a unique marker
            await docs.documents.batchUpdate({
              documentId,
              requestBody: {
                requests: [{
                  replaceAllText: {
                    containsText: { 
                      text: block.full, 
                      matchCase: false 
                    },
                    replaceText: uniqueMarker,
                  },
                }],
              },
            });
            
            // Wait a moment for the update to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Then replace the unique marker with the actual content
            await docs.documents.batchUpdate({
              documentId,
              requestBody: {
                requests: [{
                  replaceAllText: {
                    containsText: { 
                      text: uniqueMarker, 
                      matchCase: true 
                    },
                    replaceText: replacementText,
                  },
                }],
              },
            });
            
            // Break after processing one block - next iteration will find the next block
            break;
          }
        } else {
          // No match found, remove the block
          await docs.documents.batchUpdate({
            documentId,
            requestBody: {
              requests: [{
                replaceAllText: {
                  containsText: { text: block.full, matchCase: false },
                  replaceText: '',
                },
              }],
            },
          });
          
          // Break after processing one block
          break;
        }
      }
    }
  }

  /**
   * Clean up any remaining loop closing tags that might have been left behind
   * This removes stray {{/endeach}} tags that weren't properly removed during loop expansion
   */
  private async cleanupRemainingLoopTags(documentId: string): Promise<void> {
    const docs = await this.getDocsClient();
    
    const closingTags = [
      '{{/endeach}}',
      '{{/endeach }}',
      '{/endeach}',
      '{/endeach }',
    ];
    
    const requests: any[] = [];
    
    for (const tag of closingTags) {
      requests.push({
        replaceAllText: {
          containsText: { text: tag, matchCase: false },
          replaceText: '',
        },
      });
    }
    
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }
  }

  /**
   * Replace skills placeholders within a loop block
   */
  private replaceSkillsPlaceholders(content: string, item: any): string {
    const skillsList = item.skills && Array.isArray(item.skills) 
      ? item.skills.join(', ') 
      : '';
    
    const replacements: { [key: string]: string } = {
      '{{title}}': item.title || '',
      '{{skills}}': skillsList,
      '{{category}}': item.title || '', // Alias for title
      // With spaces
      '{{ title }}': item.title || '',
      '{{ skills }}': skillsList,
      '{{ category }}': item.title || '',
      // Without double braces
      '{title}': item.title || '',
      '{skills}': skillsList,
      '{category}': item.title || '',
    };
    
    let result = content;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(this.escapeRegex(placeholder), 'gi');
      result = result.replace(regex, value);
    });
    
    return result;
  }

  /**
   * Replace certification placeholders within a loop block
   */
  private replaceCertificationPlaceholders(content: string, item: any): string {
    const replacements: { [key: string]: string } = {
      '{{name}}': item.name || '',
      '{{issuer}}': item.issuer || '',
      '{{issueDate}}': item.issueDate || '',
      '{{expiryDate}}': item.expiryDate || '',
      '{{credentialId}}': item.credentialId || '',
      // With spaces
      '{{ name }}': item.name || '',
      '{{ issuer }}': item.issuer || '',
      '{{ issueDate }}': item.issueDate || '',
      '{{ expiryDate }}': item.expiryDate || '',
      '{{ credentialId }}': item.credentialId || '',
      // Without double braces
      '{name}': item.name || '',
      '{issuer}': item.issuer || '',
      '{issueDate}': item.issueDate || '',
      '{expiryDate}': item.expiryDate || '',
      '{credentialId}': item.credentialId || '',
    };
    
    let result = content;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(this.escapeRegex(placeholder), 'gi');
      result = result.replace(regex, value);
    });
    
    return result;
  }

  /**
   * Format skills categories by making category names (including colon) bold
   * Processes document structure directly to find and format skill categories
   */
  private async formatSkillsCategories(documentId: string): Promise<void> {
    const docs = await this.getDocsClient();
    const document = await docs.documents.get({ documentId });
    
    if (!document.data.body?.content) {
      return;
    }
    
    const requests: any[] = [];
    
    // Pattern to match skill categories: "Category: skill1, skill2, ..."
    const skillCategoryPattern = /([A-Za-z][A-Za-z\s]*?):\s+([A-Za-z0-9#.,\s]+)/g;
    
    // Process document structure directly
    const processElement = (element: any, baseIndex: number): number => {
      let currentIndex = baseIndex;
      
      if (element.paragraph?.elements) {
        const paraStart = element.startIndex !== undefined ? element.startIndex : currentIndex;
        let paraOffset = 0;
        
        for (const el of element.paragraph.elements) {
          if (el.textRun?.content) {
            const text = el.textRun.content;
            const textStart = paraStart + paraOffset;
            
            // Find all skill category patterns in this text run
            // Reset regex lastIndex
            skillCategoryPattern.lastIndex = 0;
            let match;
            
            while ((match = skillCategoryPattern.exec(text)) !== null) {
              const categoryName = match[1].trim();
              const skillsPart = match[2].trim();
              
              // Only process if skills part contains commas (indicating it's a skill list)
              if (skillsPart.includes(',') && categoryName.length > 0) {
                const categoryWithColon = categoryName + ':';
                const matchIndex = match.index;
                
                // Calculate absolute document indices
                const categoryStart = textStart + matchIndex;
                const categoryEnd = categoryStart + categoryWithColon.length;
                
                // Bold the category name including colon
                requests.push({
                  updateTextStyle: {
                    range: {
                      startIndex: categoryStart,
                      endIndex: categoryEnd,
                    },
                    textStyle: {
                      bold: true,
                    },
                    fields: 'bold',
                  },
                });
              }
            }
            
            paraOffset += text.length;
          }
        }
        
        currentIndex = paraStart + paraOffset;
      } else if (element.table) {
        // Process table cells
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            for (const cellElement of cell.content || []) {
              if (cellElement.paragraph?.elements) {
                const paraStart = cellElement.startIndex !== undefined ? cellElement.startIndex : currentIndex;
                let paraOffset = 0;
                
                for (const el of cellElement.paragraph.elements) {
                  if (el.textRun?.content) {
                    const text = el.textRun.content;
                    const textStart = paraStart + paraOffset;
                    
                    skillCategoryPattern.lastIndex = 0;
                    let match;
                    
                    while ((match = skillCategoryPattern.exec(text)) !== null) {
                      const categoryName = match[1].trim();
                      const skillsPart = match[2].trim();
                      
                      if (skillsPart.includes(',') && categoryName.length > 0) {
                        const categoryWithColon = categoryName + ':';
                        const matchIndex = match.index;
                        
                        const categoryStart = textStart + matchIndex;
                        const categoryEnd = categoryStart + categoryWithColon.length;
                        
                        requests.push({
                          updateTextStyle: {
                            range: {
                              startIndex: categoryStart,
                              endIndex: categoryEnd,
                            },
                            textStyle: {
                              bold: true,
                            },
                            fields: 'bold',
                          },
                        });
                      }
                    }
                    
                    paraOffset += text.length;
                  }
                }
                
                currentIndex = paraStart + paraOffset;
              }
            }
          }
        }
      }
      
      return currentIndex;
    };
    
    // Process all content elements
    let docIndex = 1;
    for (const element of document.data.body.content || []) {
      docIndex = processElement(element, docIndex);
    }
    
    // Apply all formatting requests
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }
  }

  private extractFullText(document: any): string {
    let text = '';
    
    if (!document.body?.content) {
      return text;
    }
    
    for (const element of document.body.content) {
      if (element.paragraph?.elements) {
        for (const el of element.paragraph.elements) {
          if (el.textRun?.content) {
            text += el.textRun.content;
          }
        }
      } else if (element.table) {
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            for (const cellElement of cell.content || []) {
              if (cellElement.paragraph?.elements) {
                for (const el of cellElement.paragraph.elements) {
                  if (el.textRun?.content) {
                    text += el.textRun.content;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return text;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Copy a Google Doc
   * @param documentId The source Google Doc ID
   * @param name Optional name for the copy (defaults to "Copy of [original name]")
   * @returns The ID of the copied document
   */
  async copyDocument(documentId: string, name?: string): Promise<string> {
    const drive = await this.getDriveClient();
    
    // Get original document name if name not provided
    let copyName = name;
    if (!copyName) {
      const originalFile = await drive.files.get({
        fileId: documentId,
        fields: 'name',
      });
      copyName = `Copy of ${originalFile.data.name}`;
    }
    
    // Create copy
    const copyResponse = await drive.files.copy({
      fileId: documentId,
      requestBody: {
        name: copyName,
      },
    });
    
    if (!copyResponse.data.id) {
      throw new Error('Failed to create document copy');
    }
    
    return copyResponse.data.id;
  }

  /**
   * Delete a Google Doc
   * @param documentId The Google Doc ID to delete
   */
  async deleteDocument(documentId: string): Promise<void> {
    const drive = await this.getDriveClient();
    await drive.files.delete({
      fileId: documentId,
    });
  }

  /**
   * Export template to PDF after filling placeholders
   * This creates a temporary copy, fills it, exports, then deletes the copy
   * to preserve the original template
   * @param documentId The Google Doc template ID
   * @param placeholderMap Map of placeholder strings to replacement values
   * @param conditionMap Optional map of condition names to boolean values for conditional blocks
   * @param profile Optional profile data for loop processing
   */
  async fillAndExportToPDF(documentId: string, placeholderMap: Map<string, string>, conditionMap?: Map<string, boolean>, profile?: any): Promise<Buffer> {
    let copyId: string | null = null;
    
    try {
      // Create a copy of the template
      copyId = await this.copyDocument(documentId, 'Temp Resume Export');
      
      // Fill placeholders in the copy
      await this.fillPlaceholders(copyId, placeholderMap, conditionMap, profile);
      
      // Export the copy to PDF
      const pdf = await this.exportToPDF(copyId);
      
      return pdf;
    } finally {
      // Always delete the temporary copy, even if export fails
      if (copyId) {
        try {
          await this.deleteDocument(copyId);
        } catch (error) {
          console.error('Failed to delete temporary document copy:', error);
          // Don't throw - we still want to return the PDF even if cleanup fails
        }
      }
    }
  }

  async exportToPDF(documentId: string): Promise<Buffer> {
    const drive = await this.getDriveClient();
    const response = await drive.files.export(
      {
        fileId: documentId,
        mimeType: 'application/pdf',
      },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }
}

export const googleDriveService = new GoogleDriveService();

