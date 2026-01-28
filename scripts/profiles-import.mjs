import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const INPUT_PATH = path.join(ROOT_DIR, 'data', 'profiles-bundle.json');
const API_URL = process.env.PROFILES_API_URL || 'http://localhost:5000/api/profiles/import';

async function main() {
  try {
    const exists = await fs.promises
      .access(INPUT_PATH, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      throw new Error(`Input file not found: ${INPUT_PATH}`);
    }

    const contents = await fs.promises.readFile(INPUT_PATH, 'utf8');
    const payload = JSON.parse(contents);

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed with status ${res.status}: ${text}`);
    }

    const json = await res.json();
    console.log('Profiles imported successfully:', json);
  } catch (err) {
    console.error('Failed to import profiles:', err);
    process.exitCode = 1;
  }
}

main();


