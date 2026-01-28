# Applicationator

A full-stack web application that automates job applications using browser automation, machine learning field matching, and profile management.

## Features

- **Profile Management**: Create and manage multiple job application profiles with personal information, work experience, education, and skills
- **Browser Automation**: Automate form filling using Puppeteer with support for URL-based and manual trigger modes
- **ML Field Matching**: Intelligent field classification using TensorFlow.js and Universal Sentence Encoder
- **Field Learning**: Automatically learn new field patterns and reuse them across applications
- **Resume Templates**: Integrate with Google Drive to manage resume templates and export to PDF
- **Local Storage**: All data stored locally in JSON format with import/export capabilities
- **Console Logging**: Automatic capture of browser console logs to files for debugging runtime issues

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Automation**: Puppeteer
- **ML**: TensorFlow.js, Universal Sentence Encoder
- **Storage**: Local JSON files
- **Google Drive**: OAuth 2.0 integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Drive API enabled (for Google Drive integration)

### Installation

1. Install dependencies for all workspaces:
```bash
npm run install:all
```

2. Set up Google Drive OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable APIs: Google Drive API and Google Docs API
   - Navigate to "APIs & Services" > "Credentials"
   - Configure OAuth consent screen (if not done):
     - User Type: External (or Internal for workspace)
     - App name: Applicationator
     - Scopes: Add `https://www.googleapis.com/auth/drive.readonly` and `https://www.googleapis.com/auth/documents.readonly`
   - Create OAuth client:
     - Application type: Web application
     - Name: Applicationator Web Client
     - Authorized redirect URIs: `http://localhost:5000/api/google-auth/callback`
     - For production, add your production callback URL
   - Copy the Client ID and Client Secret

3. Set up environment variables (create `.env` in backend directory):
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google-auth/callback
PORT=5000
```

3. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

## Project Structure

```
applicationator/
├── frontend/          # React + TypeScript frontend
├── backend/           # Node.js + Express backend
├── shared/            # Shared TypeScript types
└── data/              # Local JSON storage
    ├── profiles/
    ├── field-mappings/
    └── learned-patterns/
```

## Usage

1. **Create Profiles**: Go to the Profiles page and create profiles with your information
2. **Start Automation**: Navigate to Automation page, select a profile, and provide a URL or use manual mode
3. **Manage Templates**: Connect Google Drive and link resume templates
4. **View Field Mappings**: Check and edit learned field mappings on the Field Mappings page

## Profile Git Sync

All application data is stored as JSON under the `data/` directory at the repo root:

- `data/profiles/`: individual profile files (`<id>.json`)
- `data/field-mappings/mappings.json`: learned field mappings
- `data/learned-patterns/patterns.json`: learned patterns
- `data/templates/`: template configuration
- `data/user.json`: user-level defaults and personal info

This directory is intended to be committed to git so profiles and other settings can be shared across machines and branches.

### Basic workflow

- **Edit via UI**:
  - Run the app with `npm run dev`.
  - Create or update profiles from the Profiles page.
  - The backend writes JSON files under `data/profiles/`.
  - `git status` will show changed files under `data/`, which you can commit and push.

- **Sync between machines**:
  - On machine A:
    - Work with profiles normally in the app.
    - Commit and push the changes under `data/`.
  - On machine B:
    - `git pull` to get the latest `data/` contents.
    - Start the app; it will read whatever profiles exist in `data/profiles/` for the current branch.

- **Manual edits**:
  - You can edit `data/profiles/*.json` directly in your editor.
  - Refresh the app and the updated values will be reflected in the UI.

### Profile bundle helpers

For power users or CI, there are helper commands that work against the running backend (default `http://localhost:5000`):

- Export all profiles to a single bundle file:

  ```bash
  npm run profiles:export
  ```

  This writes `data/profiles-bundle.json` containing:

  ```json
  {
    "profiles": [/* Profile[] */],
    "exportedAt": "2026-01-28T00:00:00.000Z"
  }
  ```

- Import profiles from the bundle (upsert by `id`):

  ```bash
  npm run profiles:import
  ```

  This reads `data/profiles-bundle.json` and sends it to the backend, creating new profiles or updating existing ones with matching `id`s.

### Notes and caveats

- **Sensitive data**:
  - Profiles and user data can contain personal information (name, email, address, work history, etc.).
  - Only push this repository (or the `data/` directory) to private, trusted remotes.

- **Merge conflicts**:
  - Because profiles are stored as JSON, git merge conflicts may appear in `data/profiles/*.json`.
  - Resolve conflicts by choosing the correct fields manually in the JSON file, then restart/reload the app.

## Development

- Frontend development: `npm run dev:frontend`
- Backend development: `npm run dev:backend`
- Build: `npm run build`

## License

Private project

