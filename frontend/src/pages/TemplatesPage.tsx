import { useState, useEffect } from 'react';
import { templateStore } from '../stores/templateStore';
import { profileStore } from '../stores/profileStore';

export default function TemplatesPage() {
  const { templates, loadTemplates, connectGoogleDrive, createTemplate } = templateStore();
  const { profiles } = profileStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadTemplates();
    // Check Google Drive connection status
    // This would be implemented with an API call
  }, [loadTemplates]);

  const handleConnect = async () => {
    try {
      await connectGoogleDrive();
      setIsConnected(true);
    } catch (error: any) {
      console.error('Failed to connect Google Drive:', error);
      alert('Failed to connect Google Drive. Please ensure the backend is running and Google OAuth credentials are configured.');
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resume Templates</h2>
          <p className="text-sm text-gray-500 mt-1">Manage resume templates from Google Drive</p>
        </div>
        {!isConnected && (
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Connect Google Drive
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">
            Connect your Google Drive account to manage resume templates.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Templates</h3>
          {templates.length === 0 ? (
            <p className="text-gray-600">No templates yet. Create one from a Google Doc.</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((template) => (
                <li key={template.id} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{template.name}</span>
                    <span className="text-sm text-gray-500">
                      {profiles.find(p => p.id === template.profileId)?.name || 'No profile'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

