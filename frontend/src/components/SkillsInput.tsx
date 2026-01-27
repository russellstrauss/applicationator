import { useState } from 'react';
import { SkillCategory } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface SkillsInputProps {
  skills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}

export default function SkillsInput({ skills, onChange }: SkillsInputProps) {
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newSkill, setNewSkill] = useState<{ [categoryId: string]: string }>({});

  const handleAddCategory = () => {
    if (newCategoryTitle.trim()) {
      const newCategory: SkillCategory = {
        id: uuidv4(),
        title: newCategoryTitle.trim(),
        skills: [],
      };
      onChange([...skills, newCategory]);
      setNewCategoryTitle('');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this skill category?')) {
      onChange(skills.filter((cat) => cat.id !== categoryId));
    }
  };

  const handleAddSkill = (categoryId: string) => {
    const skillText = newSkill[categoryId]?.trim();
    if (skillText) {
      onChange(
        skills.map((cat) =>
          cat.id === categoryId
            ? { ...cat, skills: [...cat.skills, skillText] }
            : cat
        )
      );
      setNewSkill({ ...newSkill, [categoryId]: '' });
    }
  };

  const handleRemoveSkill = (categoryId: string, skillToRemove: string) => {
    onChange(
      skills.map((cat) =>
        cat.id === categoryId
          ? { ...cat, skills: cat.skills.filter((skill) => skill !== skillToRemove) }
          : cat
      )
    );
  };

  const handleUpdateCategoryTitle = (categoryId: string, newTitle: string) => {
    onChange(
      skills.map((cat) => (cat.id === categoryId ? { ...cat, title: newTitle } : cat))
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(categoryId);
    }
  };

  const handleMoveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const index = skills.findIndex((cat) => cat.id === categoryId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= skills.length) return;

    const newCategories = [...skills];
    [newCategories[index], newCategories[newIndex]] = [
      newCategories[newIndex],
      newCategories[index],
    ];
    onChange(newCategories);
  };

  const handleMoveSkill = (categoryId: string, skillIndex: number, direction: 'up' | 'down') => {
    const category = skills.find((cat) => cat.id === categoryId);
    if (!category) return;

    const newIndex = direction === 'up' ? skillIndex - 1 : skillIndex + 1;
    if (newIndex < 0 || newIndex >= category.skills.length) return;

    const newSkills = [...category.skills];
    [newSkills[skillIndex], newSkills[newIndex]] = [
      newSkills[newIndex],
      newSkills[skillIndex],
    ];

    onChange(
      skills.map((cat) =>
        cat.id === categoryId ? { ...cat, skills: newSkills } : cat
      )
    );
  };

  return (
    <div className="space-y-4">
      {skills.map((category, categoryIndex) => (
        <div key={category.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveCategory(category.id, 'up')}
                  disabled={categoryIndex === 0}
                  className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move category up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveCategory(category.id, 'down')}
                  disabled={categoryIndex === skills.length - 1}
                  className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move category down"
                >
                  ↓
                </button>
              </div>
              {editingCategory?.id === category.id ? (
                <input
                  type="text"
                  value={editingCategory.title}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, title: e.target.value })
                  }
                  onBlur={() => {
                    if (editingCategory.title.trim()) {
                      handleUpdateCategoryTitle(category.id, editingCategory.title);
                    }
                    setEditingCategory(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (editingCategory.title.trim()) {
                        handleUpdateCategoryTitle(category.id, editingCategory.title);
                      }
                      setEditingCategory(null);
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
                  autoFocus
                />
              ) : (
                <h5
                  className="font-medium cursor-pointer hover:text-blue-600"
                  onClick={() => setEditingCategory({ ...category })}
                  title="Click to edit category name"
                >
                  {category.title}
                </h5>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDeleteCategory(category.id)}
              className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
            >
              Delete Category
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSkill[category.id] || ''}
              onChange={(e) =>
                setNewSkill({ ...newSkill, [category.id]: e.target.value })
              }
              onKeyPress={(e) => handleKeyPress(e, category.id)}
              placeholder="Enter a skill and press Enter"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(category.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {category.skills.length > 0 && (
            <ol className="list-decimal list-inside space-y-1 ml-4">
              {category.skills.map((skill, skillIndex) => (
                <li
                  key={skillIndex}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSkill(category.id, skillIndex, 'up')}
                        disabled={skillIndex === 0}
                        className="px-1 py-0.5 text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Move skill up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSkill(category.id, skillIndex, 'down')}
                        disabled={skillIndex === category.skills.length - 1}
                        className="px-1 py-0.5 text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Move skill down"
                      >
                        ↓
                      </button>
                    </div>
                    <span className="text-sm text-gray-700">{skill}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(category.id, skill)}
                    className="ml-2 px-2 py-1 text-red-600 hover:text-red-800 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryTitle}
          onChange={(e) => setNewCategoryTitle(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCategory();
            }
          }}
          placeholder="Enter category name (e.g., Programming Languages, Tools, etc.)"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAddCategory}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
        >
          Add Category
        </button>
      </div>
    </div>
  );
}
