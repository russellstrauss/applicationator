import { useState, useEffect } from 'react';
import { WorkExperience } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from './DatePicker';

interface WorkExperienceFormProps {
  experience: WorkExperience | null;
  onSave: (experience: WorkExperience) => void;
  onCancel: () => void;
}

export default function WorkExperienceForm({ experience, onSave, onCancel }: WorkExperienceFormProps) {
  const [formData, setFormData] = useState<WorkExperience>({
    id: uuidv4(),
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    location: '',
  });

  useEffect(() => {
    if (experience) {
      setFormData(experience);
    }
  }, [experience]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.position || !formData.startDate) {
      alert('Please fill in required fields: Company, Position, and Start Date');
      return;
    }
    // Validate date range
    if (!formData.current && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        alert('End date must be after start date');
        return;
      }
    }
    onSave(formData);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-3">{experience ? 'Edit Work Experience' : 'Add Work Experience'}</h4>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position *</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="City, State"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <DatePicker
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <DatePicker
              value={formData.endDate || ''}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={formData.current}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="current-job"
            checked={formData.current}
            onChange={(e) => {
              setFormData({
                ...formData,
                current: e.target.checked,
                endDate: e.target.checked ? undefined : formData.endDate,
              });
            }}
            className="mr-2"
          />
          <label htmlFor="current-job" className="text-sm text-gray-700">
            I currently work here
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            rows={4}
            placeholder="Describe your responsibilities and achievements..."
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

