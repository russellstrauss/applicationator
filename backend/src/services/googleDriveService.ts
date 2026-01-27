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

  constructor() {
    this.initializeOAuth();
  }

  private async initializeOAuth() {
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
        }
      } catch (error) {
        // No existing token
      }
    }
  }

  getAuthUrl(): string {
    if (!this.oauth2Client) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
      }
      // Try to initialize again
      this.initializeOAuth();
      if (!this.oauth2Client) {
        throw new Error('Failed to initialize Google OAuth. Please check your credentials.');
      }
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  async handleCallback(code: string): Promise<GoogleAuthToken> {
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

  async getDriveClient() {
    if (!this.oauth2Client) {
      await this.initializeOAuth();
    }
    if (!this.oauth2Client) {
      throw new Error('OAuth not initialized');
    }
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async getDocsClient() {
    if (!this.oauth2Client) {
      await this.initializeOAuth();
    }
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

