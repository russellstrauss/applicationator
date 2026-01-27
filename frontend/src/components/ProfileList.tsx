import { Profile } from '../../../shared/types';

interface ProfileListProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
}

export default function ProfileList({ profiles, onEdit, onDelete }: ProfileListProps) {
  if (profiles.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
        No profiles yet. Create your first profile to get started.
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {profiles.map((profile) => (
          <li key={profile.id} className="p-6 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                <p className="text-sm text-gray-500">
                  {profile.personalInfo.firstName} {profile.personalInfo.lastName} • {profile.personalInfo.email}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(profile)}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(profile.id)}
                  className="text-red-600 hover:text-red-900 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

