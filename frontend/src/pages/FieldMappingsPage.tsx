import { useState, useEffect } from 'react';
import { fieldMappingStore } from '../stores/fieldMappingStore';
import { FieldType } from '../../../shared/types';

export default function FieldMappingsPage() {
  const { mappings, loadMappings, updateMapping, deleteMapping } = fieldMappingStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<FieldType>(FieldType.UNKNOWN);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const handleSave = async (id: string) => {
    await updateMapping(id, { fieldType: editType });
    setEditingId(null);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Field Mappings</h2>
        <p className="text-sm text-gray-500 mt-1">View and edit learned field mappings</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mappings.map((mapping) => (
              <tr key={mapping.fieldName}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {mapping.fieldName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === mapping.fieldName ? (
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as FieldType)}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      {Object.values(FieldType).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    mapping.fieldType
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {mapping.confidence ? `${Math.round(mapping.confidence * 100)}%` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingId === mapping.fieldName ? (
                    <>
                      <button
                        onClick={() => handleSave(mapping.fieldName)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(mapping.fieldName);
                          setEditType(mapping.fieldType);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMapping(mapping.fieldName)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

