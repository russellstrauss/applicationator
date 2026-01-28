import { useState, useEffect } from 'react';
import { templateStore } from '../stores/templateStore';

interface CreateTemplateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime?: string;
}

export default function CreateTemplateModal({ onClose, onSuccess }: CreateTemplateModalProps) {
  const { googleDocs, loadingDocs, docsError, listGoogleDocs, createTemplate } = templateStore();
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGoogleDocs();
  }, [listGoogleDocs]);

  const handleCreate = async () => {
    if (!selectedDocId) {
      setError('Please select a Google Doc');
      return;
    }

    const selectedDoc = googleDocs.find(doc => doc.id === selectedDocId);
    if (!selectedDoc) {
      setError('Selected document not found');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createTemplate({
        name: selectedDoc.name,
        googleDriveId: selectedDoc.id,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create template:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold mb-4">Create Template from Google Doc</h3>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {docsError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {docsError}
          </div>
        )}

        {loadingDocs ? (
          <div className="mb-4 text-center py-8">
            <p className="text-gray-600">Loading Google Docs...</p>
          </div>
        ) : googleDocs.length === 0 ? (
          <div className="mb-4 text-center py-8">
            <p className="text-gray-600">No Google Docs found in your Drive.</p>
            <p className="text-sm text-gray-500 mt-2">Make sure you have Google Docs in your Drive.</p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Google Doc
            </label>
            <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
              {googleDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedDocId === doc.id ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Modified: {formatDate(doc.modifiedTime)}
                      </p>
                    </div>
                    {selectedDocId === doc.id && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !selectedDocId || loadingDocs}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}


