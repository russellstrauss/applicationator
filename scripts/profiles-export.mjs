import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT_DIR, 'data', 'profiles-bundle.json');
const API_URL = process.env.PROFILES_API_URL || 'http://localhost:5000/api/profiles/export';

async function main() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const json = await res.json();

    await fs.promises.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.promises.writeFile(OUTPUT_PATH, JSON.stringify(json, null, 2), 'utf8');

    console.log(`Profiles exported to ${OUTPUT_PATH}`);
  } catch (err) {
    console.error('Failed to export profiles:', err);
    process.exitCode = 1;
  }
}

main();


