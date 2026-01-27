import { useState } from 'react';
import { FieldType } from '../../../shared/types';
import { fieldMatcher } from '../services/fieldMatcher';

interface FieldPromptModalProps {
  fieldName: string;
  onResolve: (fieldType: FieldType, value?: string) => void;
  onSkip: () => void;
}

export default function FieldPromptModal({ fieldName, onResolve, onSkip }: FieldPromptModalProps) {
  const [selectedType, setSelectedType] = useState<FieldType>(FieldType.UNKNOWN);
  const [customValue, setCustomValue] = useState('');

  const handleSave = async () => {
    if (selectedType !== FieldType.UNKNOWN) {
      // Learn the pattern
      await fieldMatcher.learnPattern(fieldName, selectedType);
      onResolve(selectedType, customValue || undefined);
    } else {
      onSkip();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold mb-4">Field Mapping Required</h3>
        <p className="text-gray-600 mb-4">
          The field <strong>"{fieldName}"</strong> needs to be mapped to a field type.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as FieldType)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {Object.values(FieldType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {selectedType === FieldType.UNKNOWN && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Value (optional)
            </label>
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter value if not from profile"
            />
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onSkip}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}


