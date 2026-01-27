import { useState, useEffect } from 'react';
import { Profile } from '../../../shared/types';
import { profileStore } from '../stores/profileStore';
import ProfileForm from '../components/ProfileForm';
import ProfileList from '../components/ProfileList';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfilesPage() {
  const { profiles, loadProfiles, createProfile, updateProfile, deleteProfile } = profileStore();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      await loadProfiles();
      setLoading(false);
    };
    fetchProfiles();
  }, [loadProfiles]);

  const handleCreate = () => {
    setSelectedProfile(null);
    setIsFormOpen(true);
  };

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsFormOpen(true);
  };

  const handleSave = async (profileData: Partial<Profile>) => {
    if (selectedProfile) {
      await updateProfile(selectedProfile.id, profileData);
    } else {
      await createProfile(profileData as Profile);
    }
    setIsFormOpen(false);
    setSelectedProfile(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      await deleteProfile(id);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profiles</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your job application profiles</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Create Profile
        </button>
      </div>

      {isFormOpen && (
        <ProfileForm
          profile={selectedProfile}
          onSave={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedProfile(null);
          }}
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ProfileList
          profiles={profiles}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

