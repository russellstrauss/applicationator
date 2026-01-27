import { useState, useEffect } from 'react';
import { User, PersonalInfo, Education } from '../../../shared/types';
import { userStore } from '../stores/userStore';
import EducationForm from '../components/EducationForm';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UserSettingsPage() {
  const { user, loadUser, updatePersonalInfo, updateEducation } = userStore();
  const [loading, setLoading] = useState(true);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      await loadUser();
      setLoading(false);
    };
    fetchUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      setPersonalInfo(user.personalInfo);
    }
  }, [user]);

  const handleSavePersonalInfo = async () => {
    await updatePersonalInfo(personalInfo);
    alert('Personal information saved successfully!');
  };

  const updateAddress = (field: keyof PersonalInfo['address'], value: string) => {
    setPersonalInfo({
      ...personalInfo,
      address: {
        ...personalInfo.address,
        [field]: value,
      },
    });
  };

  const handleAddEducation = () => {
    setEditingEducation(null);
    setShowEducationForm(true);
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducation(edu);
    setShowEducationForm(true);
  };

  const handleSaveEducation = async (edu: Education) => {
    const existing = user?.education || [];
    let updatedEducation: Education[];
    if (editingEducation) {
      updatedEducation = existing.map((e) => (e.id === edu.id ? edu : e));
    } else {
      updatedEducation = [...existing, edu];
    }
    await updateEducation(updatedEducation);
    setShowEducationForm(false);
    setEditingEducation(null);
  };

  const handleDeleteEducation = async (id: string) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      const existing = user?.education || [];
      await updateEducation(existing.filter((e) => e.id !== id));
    }
  };

  const handleMoveEducation = async (id: string, direction: 'up' | 'down') => {
    const educations = user?.education || [];
    const index = educations.findIndex((e) => e.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= educations.length) return;

    const newEducations = [...educations];
    [newEducations[index], newEducations[newIndex]] = [
      newEducations[newIndex],
      newEducations[index],
    ];
    await updateEducation(newEducations);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and education</p>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                value={personalInfo.firstName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                value={personalInfo.lastName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              value={personalInfo.address.street}
              onChange={(e) => updateAddress('street', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={personalInfo.address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                value={personalInfo.address.state}
                onChange={(e) => updateAddress('state', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zip Code</label>
              <input
                type="text"
                value={personalInfo.address.zipCode}
                onChange={(e) => updateAddress('zipCode', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Online Portfolio</label>
              <input
                type="url"
                value={personalInfo.onlinePortfolio || ''}
                onChange={(e) => setPersonalInfo({ ...personalInfo, onlinePortfolio: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">GitHub</label>
              <input
                type="url"
                value={personalInfo.github || ''}
                onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSavePersonalInfo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Personal Information
            </button>
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Education</h3>
          <button
            onClick={handleAddEducation}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Add Education
          </button>
        </div>
        {showEducationForm && (
          <div className="mb-4">
            <EducationForm
              education={editingEducation}
              onSave={handleSaveEducation}
              onCancel={() => {
                setShowEducationForm(false);
                setEditingEducation(null);
              }}
            />
          </div>
        )}
        {user?.education && user.education.length > 0 && (
          <div className="space-y-3">
            {user.education.map((edu, index) => (
              <div key={edu.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium">{edu.degree}</h5>
                    <p className="text-sm text-gray-600">
                      {edu.institution}
                      {edu.fieldOfStudy && ` • ${edu.fieldOfStudy}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {edu.startDate} - {edu.endDate || 'N/A'}
                      {edu.gpa && ` • GPA: ${edu.gpa}`}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4 items-center">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveEducation(edu.id, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveEducation(edu.id, 'down')}
                        disabled={index === user.education!.length - 1}
                        className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditEducation(edu)}
                      className="px-2 py-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


