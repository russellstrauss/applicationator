import { useState, useEffect } from 'react';
import { Profile, WorkExperience, Certification, SkillCategory } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import WorkExperienceForm from './WorkExperienceForm';
import CertificationForm from './CertificationForm';
import SkillsInput from './SkillsInput';

interface ProfileFormProps {
  profile: Profile | null;
  onSave: (data: Partial<Profile>) => void;
  onCancel: () => void;
}

export default function ProfileForm({ profile, onSave, onCancel }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    summary: '',
    workExperience: [],
    skills: [],
    certifications: [],
  });

  const [editingWorkExp, setEditingWorkExp] = useState<WorkExperience | null>(null);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [showWorkExpForm, setShowWorkExpForm] = useState(false);
  const [showCertificationForm, setShowCertificationForm] = useState(false);

  useEffect(() => {
    if (profile) {
      // Migrate old profile format: remove personalInfo and education (now at user level)
      // and migrate old skills format (string[]) to new format (SkillCategory[])
      let migratedProfile: Partial<Profile> = {
        id: profile.id,
        name: profile.name,
        summary: profile.summary,
        workExperience: profile.workExperience || [],
        skills: profile.skills || [],
        certifications: profile.certifications || [],
        resumeTemplateId: profile.resumeTemplateId,
        fieldMappings: profile.fieldMappings,
      };
      
      if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
        // Check if it's the old format (string[])
        if (typeof profile.skills[0] === 'string') {
          // Migrate: create a default "Skills" category with all skills
          migratedProfile.skills = [
            {
              id: uuidv4(),
              title: 'Skills',
              skills: profile.skills as string[],
            },
          ];
        }
      }
      setFormData(migratedProfile);
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Work Experience handlers
  const handleAddWorkExp = () => {
    setEditingWorkExp(null);
    setShowWorkExpForm(true);
  };

  const handleEditWorkExp = (exp: WorkExperience) => {
    setEditingWorkExp(exp);
    setShowWorkExpForm(true);
  };

  const handleSaveWorkExp = (exp: WorkExperience) => {
    const existing = formData.workExperience || [];
    if (editingWorkExp) {
      setFormData({
        ...formData,
        workExperience: existing.map((e) => (e.id === exp.id ? exp : e)),
      });
    } else {
      setFormData({
        ...formData,
        workExperience: [...existing, exp],
      });
    }
    setShowWorkExpForm(false);
    setEditingWorkExp(null);
  };

  const handleDeleteWorkExp = (id: string) => {
    if (confirm('Are you sure you want to delete this work experience?')) {
      setFormData({
        ...formData,
        workExperience: (formData.workExperience || []).filter((e) => e.id !== id),
      });
    }
  };

  const handleMoveWorkExp = (id: string, direction: 'up' | 'down') => {
    const experiences = formData.workExperience || [];
    const index = experiences.findIndex((e) => e.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= experiences.length) return;

    const newExperiences = [...experiences];
    [newExperiences[index], newExperiences[newIndex]] = [
      newExperiences[newIndex],
      newExperiences[index],
    ];
    setFormData({ ...formData, workExperience: newExperiences });
  };


  // Certification handlers
  const handleAddCertification = () => {
    setEditingCertification(null);
    setShowCertificationForm(true);
  };

  const handleEditCertification = (cert: Certification) => {
    setEditingCertification(cert);
    setShowCertificationForm(true);
  };

  const handleSaveCertification = (cert: Certification) => {
    const existing = formData.certifications || [];
    if (editingCertification) {
      setFormData({
        ...formData,
        certifications: existing.map((c) => (c.id === cert.id ? cert : c)),
      });
    } else {
      setFormData({
        ...formData,
        certifications: [...existing, cert],
      });
    }
    setShowCertificationForm(false);
    setEditingCertification(null);
  };

  const handleDeleteCertification = (id: string) => {
    if (confirm('Are you sure you want to delete this certification?')) {
      setFormData({
        ...formData,
        certifications: (formData.certifications || []).filter((c) => c.id !== id),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white mb-10">
        <h3 className="text-lg font-bold mb-4">
          {profile ? 'Edit Profile' : 'Create Profile'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {/* Profile Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={4}
              placeholder="Brief professional summary or objective..."
            />
          </div>

          {/* Work Experience Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-semibold">Work Experience</h4>
              <button
                type="button"
                onClick={handleAddWorkExp}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Add Experience
              </button>
            </div>
            {showWorkExpForm && (
              <div className="mb-4">
                <WorkExperienceForm
                  experience={editingWorkExp}
                  onSave={handleSaveWorkExp}
                  onCancel={() => {
                    setShowWorkExpForm(false);
                    setEditingWorkExp(null);
                  }}
                />
              </div>
            )}
            {formData.workExperience && formData.workExperience.length > 0 && (
              <div className="space-y-3">
                {formData.workExperience.map((exp, index) => (
                  <div key={exp.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium">{exp.position} at {exp.company}</h5>
                        <p className="text-sm text-gray-600">
                          {exp.location && `${exp.location} • `}
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'N/A'}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4 items-center">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveWorkExp(exp.id, 'up')}
                            disabled={index === 0}
                            className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveWorkExp(exp.id, 'down')}
                            disabled={index === formData.workExperience!.length - 1}
                            className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditWorkExp(exp)}
                          className="px-2 py-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkExp(exp.id)}
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

          {/* Skills Section */}
          <div className="border-t pt-4">
            <h4 className="text-md font-semibold mb-3">Skills</h4>
            <SkillsInput
              skills={formData.skills || []}
              onChange={(skills) => setFormData({ ...formData, skills })}
            />
          </div>

          {/* Certifications Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-semibold">Certifications</h4>
              <button
                type="button"
                onClick={handleAddCertification}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Add Certification
              </button>
            </div>
            {showCertificationForm && (
              <div className="mb-4">
                <CertificationForm
                  certification={editingCertification}
                  onSave={handleSaveCertification}
                  onCancel={() => {
                    setShowCertificationForm(false);
                    setEditingCertification(null);
                  }}
                />
              </div>
            )}
            {formData.certifications && formData.certifications.length > 0 && (
              <div className="space-y-3">
                {formData.certifications.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium">{cert.name}</h5>
                        <p className="text-sm text-gray-600">
                          {cert.issuer}
                          {cert.credentialId && ` • ID: ${cert.credentialId}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          Issued: {cert.issueDate}
                          {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleEditCertification(cert)}
                          className="px-2 py-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(cert.id)}
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

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
