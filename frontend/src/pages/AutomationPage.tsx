import { useState, useEffect } from 'react';
import { automationStore } from '../stores/automationStore';
import { profileStore } from '../stores/profileStore';
import FieldPromptModal from '../components/FieldPromptModal';
import { FieldType } from '../../../shared/types';

export default function AutomationPage() {
  const { currentSession, startAutomation, stopAutomation, checkStatus } = automationStore();
  const { profiles } = profileStore();
  const [url, setUrl] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [promptField, setPromptField] = useState<{ name: string; type: FieldType } | null>(null);

  // Poll for status updates
  useEffect(() => {
    if (currentSession?.status === 'running') {
      const interval = setInterval(() => {
        checkStatus();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentSession?.status, checkStatus]);

  const handleStart = async () => {
    if (!selectedProfileId) {
      alert('Please select a profile');
      return;
    }
    if (mode === 'url' && !url) {
      alert('Please enter a URL');
      return;
    }
    await startAutomation({
      profileId: selectedProfileId,
      url: mode === 'url' ? url : undefined,
      mode,
    });
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Automation</h2>
        <p className="text-sm text-gray-500 mt-1">Automate job application form filling</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select a profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="url"
                  checked={mode === 'url'}
                  onChange={(e) => setMode(e.target.value as 'url' | 'manual')}
                  className="mr-2"
                />
                URL Mode
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={mode === 'manual'}
                  onChange={(e) => setMode(e.target.value as 'url' | 'manual')}
                  className="mr-2"
                />
                Manual Mode
              </label>
            </div>
          </div>

          {mode === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/apply"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleStart}
              disabled={currentSession?.status === 'running'}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start Automation
            </button>
            {currentSession?.status === 'running' && (
              <button
                onClick={stopAutomation}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Stop Automation
              </button>
            )}
          </div>
        </div>
      </div>

      {currentSession && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Session Status</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                currentSession.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                currentSession.status === 'completed' ? 'bg-green-100 text-green-800' :
                currentSession.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentSession.status}
              </span>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Progress:</span>
                <span>{currentSession.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${currentSession.progress}%` }}
                ></div>
              </div>
            </div>
            {currentSession.currentStep && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Current Step:</span> {currentSession.currentStep}
              </p>
            )}
            {currentSession.errors.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-red-600">Errors:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {currentSession.errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-600">{error.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {promptField && (
        <FieldPromptModal
          fieldName={promptField.name}
          onResolve={(fieldType, value) => {
            // Handle field resolution
            setPromptField(null);
          }}
          onSkip={() => setPromptField(null)}
        />
      )}
    </div>
  );
}

