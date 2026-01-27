import { useState, useEffect } from 'react';
import { Education } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface EducationFormProps {
  education: Education | null;
  onSave: (education: Education) => void;
  onCancel: () => void;
}

export default function EducationForm({ education, onSave, onCancel }: EducationFormProps) {
  const [formData, setFormData] = useState<Education>({
    id: uuidv4(),
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    gpa: '',
    honors: '',
  });

  useEffect(() => {
    if (education) {
      setFormData(education);
    }
  }, [education]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institution || !formData.degree || !formData.startDate) {
      alert('Please fill in required fields: Institution, Degree, and Start Date');
      return;
    }
    // Validate date range
    if (formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        alert('End date must be after start date');
        return;
      }
    }
    onSave(formData);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-3">{education ? 'Edit Education' : 'Add Education'}</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Institution *</label>
          <input
            type="text"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Degree *</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., Bachelor of Science"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Field of Study</label>
            <input
              type="text"
              value={formData.fieldOfStudy || ''}
              onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., Computer Science"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">GPA</label>
            <input
              type="text"
              value={formData.gpa || ''}
              onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., 3.8"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Honors</label>
            <input
              type="text"
              value={formData.honors || ''}
              onChange={(e) => setFormData({ ...formData, honors: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="e.g., Summa Cum Laude"
            />
          </div>
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

