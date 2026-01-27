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

## Development

- Frontend development: `npm run dev:frontend`
- Backend development: `npm run dev:backend`
- Build: `npm run build`

## License

Private project

