import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const PROFILES_DIR = path.join(DATA_DIR, 'profiles');
const FIELD_MAPPINGS_DIR = path.join(DATA_DIR, 'field-mappings');
const LEARNED_PATTERNS_DIR = path.join(DATA_DIR, 'learned-patterns');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const USER_FILE = path.join(DATA_DIR, 'user.json');

// Ensure directories exist
async function ensureDirectories() {
  await fs.ensureDir(PROFILES_DIR);
  await fs.ensureDir(FIELD_MAPPINGS_DIR);
  await fs.ensureDir(LEARNED_PATTERNS_DIR);
  await fs.ensureDir(TEMPLATES_DIR);
}

ensureDirectories();

export class StorageService {
  // Profile operations
  static async getProfile(id: string) {
    const filePath = path.join(PROFILES_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }

  static async getAllProfiles() {
    await ensureDirectories();
    const files = await fs.readdir(PROFILES_DIR);
    const profiles = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const profile = await fs.readJson(path.join(PROFILES_DIR, file));
        profiles.push(profile);
      }
    }
    return profiles;
  }

  static async saveProfile(profile: any) {
    await ensureDirectories();
    const filePath = path.join(PROFILES_DIR, `${profile.id}.json`);
    await fs.writeJson(filePath, profile, { spaces: 2 });
    return profile;
  }

  static async deleteProfile(id: string) {
    const filePath = path.join(PROFILES_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  }

  // Field mappings
  static async getFieldMappings() {
    await ensureDirectories();
    const filePath = path.join(FIELD_MAPPINGS_DIR, 'mappings.json');
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return [];
  }

  static async saveFieldMappings(mappings: any[]) {
    await ensureDirectories();
    const filePath = path.join(FIELD_MAPPINGS_DIR, 'mappings.json');
    await fs.writeJson(filePath, mappings, { spaces: 2 });
  }

  // Learned patterns
  static async getLearnedPatterns() {
    await ensureDirectories();
    const filePath = path.join(LEARNED_PATTERNS_DIR, 'patterns.json');
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return [];
  }

  static async saveLearnedPatterns(patterns: any[]) {
    await ensureDirectories();
    const filePath = path.join(LEARNED_PATTERNS_DIR, 'patterns.json');
    await fs.writeJson(filePath, patterns, { spaces: 2 });
  }

  // Template operations
  static async getTemplate(id: string) {
    const filePath = path.join(TEMPLATES_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }

  static async getAllTemplates() {
    await ensureDirectories();
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const template = await fs.readJson(path.join(TEMPLATES_DIR, file));
        templates.push(template);
      }
    }
    return templates;
  }

  static async saveTemplate(template: any) {
    await ensureDirectories();
    const filePath = path.join(TEMPLATES_DIR, `${template.id}.json`);
    await fs.writeJson(filePath, template, { spaces: 2 });
    return template;
  }

  static async deleteTemplate(id: string) {
    const filePath = path.join(TEMPLATES_DIR, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  }

  // Export/Import
  static async exportAll() {
    await ensureDirectories();
    const profiles = await this.getAllProfiles();
    const mappings = await this.getFieldMappings();
    const patterns = await this.getLearnedPatterns();
    const templates = await this.getAllTemplates();
    return {
      profiles,
      fieldMappings: mappings,
      learnedPatterns: patterns,
      templates,
      exportedAt: new Date().toISOString(),
    };
  }

  static async importAll(data: any) {
    await ensureDirectories();
    if (data.profiles) {
      for (const profile of data.profiles) {
        await this.saveProfile(profile);
      }
    }
    if (data.fieldMappings) {
      await this.saveFieldMappings(data.fieldMappings);
    }
    if (data.learnedPatterns) {
      await this.saveLearnedPatterns(data.learnedPatterns);
    }
    if (data.templates) {
      for (const template of data.templates) {
        await this.saveTemplate(template);
      }
    }
    if (data.user) {
      await this.saveUser(data.user);
    }
  }

  // User operations
  static async getUser() {
    await ensureDirectories();
    if (await fs.pathExists(USER_FILE)) {
      return await fs.readJson(USER_FILE);
    }
    return null;
  }

  static async saveUser(user: any) {
    await ensureDirectories();
    await fs.writeJson(USER_FILE, user, { spaces: 2 });
    return user;
  }
}

