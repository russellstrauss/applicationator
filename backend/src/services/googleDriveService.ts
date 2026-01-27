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
   */
  async fillPlaceholders(documentId: string, placeholderMap: Map<string, string>, conditionMap?: Map<string, boolean>): Promise<void> {
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
    
    // Then, handle conditional blocks AFTER placeholders are replaced
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
   * Extract full text content from document
   */
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
   */
  async fillAndExportToPDF(documentId: string, placeholderMap: Map<string, string>, conditionMap?: Map<string, boolean>): Promise<Buffer> {
    let copyId: string | null = null;
    
    try {
      // Create a copy of the template
      copyId = await this.copyDocument(documentId, 'Temp Resume Export');
      
      // Fill placeholders in the copy
      await this.fillPlaceholders(copyId, placeholderMap, conditionMap);
      
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

