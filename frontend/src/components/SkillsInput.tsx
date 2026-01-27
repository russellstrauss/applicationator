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

  return (
    <div className="space-y-4">
      {skills.map((category) => (
        <div key={category.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
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
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(category.id, skill)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
