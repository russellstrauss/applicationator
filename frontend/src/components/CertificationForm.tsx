import { useState, useEffect } from 'react';
import { Certification } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface CertificationFormProps {
  certification: Certification | null;
  onSave: (certification: Certification) => void;
  onCancel: () => void;
}

export default function CertificationForm({ certification, onSave, onCancel }: CertificationFormProps) {
  const [formData, setFormData] = useState<Certification>({
    id: uuidv4(),
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
  });

  useEffect(() => {
    if (certification) {
      setFormData(certification);
    }
  }, [certification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.issuer || !formData.issueDate) {
      alert('Please fill in required fields: Name, Issuer, and Issue Date');
      return;
    }
    // Validate date range
    if (formData.expiryDate) {
      if (new Date(formData.expiryDate) < new Date(formData.issueDate)) {
        alert('Expiry date must be after issue date');
        return;
      }
    }
    onSave(formData);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-3">{certification ? 'Edit Certification' : 'Add Certification'}</h4>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Certification Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Issuer *</label>
            <input
              type="text"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Date *</label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input
              type="date"
              value={formData.expiryDate || ''}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Credential ID</label>
          <input
            type="text"
            value={formData.credentialId || ''}
            onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="License or certificate number"
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

