import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { templateStore } from '../stores/templateStore';
import { profileStore } from '../stores/profileStore';
import CreateTemplateModal from '../components/CreateTemplateModal';

export default function TemplatesPage() {
  const { templates, loadTemplates, connectGoogleDrive, createTemplate, isConnected, checkConnectionStatus, disconnectGoogleDrive, exportTemplate } = templateStore();
  const { profiles, loadProfiles } = profileStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportingTemplateId, setExportingTemplateId] = useState<string | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
    loadProfiles();
    checkConnectionStatus();
  }, [loadTemplates, loadProfiles, checkConnectionStatus]);

  // Handle OAuth callback redirect
  useEffect(() => {
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');
    
    if (connected !== null) {
      if (connected === 'true') {
        // Successfully connected
        checkConnectionStatus();
        setError(null);
      } else if (errorParam) {
        // Connection failed
        setError(decodeURIComponent(errorParam));
      }
      
      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('connected');
      newSearchParams.delete('error');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, checkConnectionStatus]);

  const handleConnect = async () => {
    try {
      setError(null);
      await connectGoogleDrive();
      // Note: connectGoogleDrive redirects to OAuth, so this won't execute
      // Connection status will be checked after redirect
    } catch (error: any) {
      console.error('Failed to connect Google Drive:', error);
      setError(error.message || 'Failed to connect Google Drive. Please ensure the backend is running and Google OAuth credentials are configured.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleDrive();
      setError(null);
    } catch (error: any) {
      console.error('Failed to disconnect Google Drive:', error);
      setError(error.message || 'Failed to disconnect Google Drive.');
    }
  };

  const handleExport = async (templateId: string) => {
    const profileId = selectedProfileIds[templateId];
    if (!profileId) {
      setError('Please select a profile to export');
      return;
    }

    setExportingTemplateId(templateId);
    setError(null);

    try {
      await exportTemplate(templateId, profileId);
    } catch (error: any) {
      console.error('Failed to export template:', error);
      setError(error.message || 'Failed to export template. Please ensure the template has placeholders and profile data is complete.');
    } finally {
      setExportingTemplateId(null);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resume Templates</h2>
          <p className="text-sm text-gray-500 mt-1">Manage resume templates from Google Drive</p>
        </div>
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <span className="px-3 py-2 text-sm text-green-700 bg-green-100 rounded-md flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected
              </span>
              <button
                onClick={handleDisconnect}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md text-sm"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Connect Google Drive
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {!isConnected ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">
            Connect your Google Drive account to manage resume templates.
          </p>
          <p className="text-sm text-gray-500">
            You'll be redirected to Google to authorize access to your Drive files.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Templates</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm"
            >
              Create Template from Google Doc
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No templates yet. Create one from a Google Doc.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Create Template
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {templates.map((template) => (
                <li key={template.id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Select a profile to generate a resume with this template
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile
                      </label>
                      <select
                        value={selectedProfileIds[template.id] || ''}
                        onChange={(e) => setSelectedProfileIds({
                          ...selectedProfileIds,
                          [template.id]: e.target.value,
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Select a profile...</option>
                        {profiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleExport(template.id)}
                      disabled={!selectedProfileIds[template.id] || exportingTemplateId === template.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {exportingTemplateId === template.id ? 'Exporting...' : 'Export PDF'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadTemplates();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

