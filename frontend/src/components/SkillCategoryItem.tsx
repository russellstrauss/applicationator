import React from 'react';
import { SkillCategory } from '../../../shared/types';
import ListItemDisplay, { AttributeDefinition } from './ListItemDisplay';

interface SkillCategoryItemProps {
  category: SkillCategory;
  isCollapsed: boolean;
  editingCategory: SkillCategory | null;
  newSkill: string;
  draggedSkill: { categoryId: string; skillIndex: number } | null;
  dragOverSkill: { categoryId: string; skillIndex: number } | null;
  onToggleCollapse: () => void;
  onEditTitle: (category: SkillCategory) => void;
  onUpdateTitle: (newTitle: string) => void;
  onCancelEditTitle: () => void;
  onDeleteCategory: () => void;
  onNewSkillChange: (value: string) => void;
  onAddSkill: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onRemoveSkill: (skill: string) => void;
  onDragSkillStart: (e: React.DragEvent, skillIndex: number) => void;
  onDragSkillOver: (e: React.DragEvent, skillIndex: number) => void;
  onDragSkillLeave: () => void;
  onDragSkillDrop: (e: React.DragEvent, skillIndex: number) => void;
  onDragCategoryStart: (e: React.DragEvent) => void;
  onDragCategoryOver: (e: React.DragEvent) => void;
  onDragCategoryLeave: () => void;
  onDragCategoryDrop: (e: React.DragEvent) => void;
  showDragIndicator?: boolean;
}

export default function SkillCategoryItem({
  category,
  isCollapsed,
  editingCategory,
  newSkill,
  draggedSkill,
  dragOverSkill,
  onToggleCollapse,
  onEditTitle,
  onUpdateTitle,
  onCancelEditTitle,
  onDeleteCategory,
  onNewSkillChange,
  onAddSkill,
  onKeyPress,
  onRemoveSkill,
  onDragSkillStart,
  onDragSkillOver,
  onDragSkillLeave,
  onDragSkillDrop,
  onDragCategoryStart,
  onDragCategoryOver,
  onDragCategoryLeave,
  onDragCategoryDrop,
  showDragIndicator = false,
}: SkillCategoryItemProps) {
  const attributes: AttributeDefinition[] = [
    {
      label: 'Category Title',
      value: category.title,
    },
    {
      label: 'Skills Count',
      value: category.skills.length,
      format: (count: number) => `${count} skill${count !== 1 ? 's' : ''}`,
    },
  ];

  return (
    <div>
      {showDragIndicator && (
        <div className="h-0 border-t-2 border-blue-400 -mt-px mb-2" />
      )}
      <div
        className="border rounded-lg p-4 bg-gray-50"
        draggable
        onDragStart={onDragCategoryStart}
        onDragOver={onDragCategoryOver}
        onDragLeave={onDragCategoryLeave}
        onDrop={onDragCategoryDrop}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="cursor-move text-gray-400 hover:text-gray-600"
              title="Drag to reorder category"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
              </svg>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-gray-500 hover:text-gray-700 focus:outline-none flex items-center justify-center w-7 h-7"
              aria-label={isCollapsed ? 'Expand skills' : 'Collapse skills'}
            >
              <span className="text-2xl leading-none">
                {isCollapsed ? '▸' : '▾'}
              </span>
            </button>
            {editingCategory?.id === category.id ? (
              <input
                type="text"
                value={editingCategory.title}
                onChange={(e) =>
                  onUpdateTitle(e.target.value)
                }
                onBlur={() => {
                  if (editingCategory.title.trim()) {
                    onUpdateTitle(editingCategory.title);
                  }
                  onCancelEditTitle();
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (editingCategory.title.trim()) {
                      onUpdateTitle(editingCategory.title);
                    }
                    onCancelEditTitle();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
                autoFocus
              />
            ) : (
              <h5
                className="font-medium cursor-pointer hover:text-blue-600"
                onClick={() => onEditTitle(category)}
                title="Click to edit category name"
              >
                {category.title}
              </h5>
            )}
          </div>
          <button
            type="button"
            onClick={onDeleteCategory}
            className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
          >
            Delete Category
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="mb-3">
              <ListItemDisplay attributes={attributes} />
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => onNewSkillChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Enter a skill and press Enter"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={onAddSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {category.skills.length > 0 && (
              <div className="mt-2">
                <ListItemDisplay
                  attributes={[
                    {
                      label: 'Skills',
                      value: category.skills,
                      format: (skills: string[]) => {
                        return (
                          <ol className="list-decimal list-inside space-y-1 ml-4">
                            {skills.map((skill, skillIndex) => (
                              <li
                                key={skillIndex}
                                className={`flex items-center justify-between group ${
                                  dragOverSkill &&
                                  dragOverSkill.categoryId === category.id &&
                                  dragOverSkill.skillIndex === skillIndex
                                    ? 'border-t-2 border-blue-400 -mt-px pt-1'
                                    : ''
                                }`}
                                draggable
                                onDragStart={(e) =>
                                  onDragSkillStart(e, skillIndex)
                                }
                                onDragOver={(e) =>
                                  onDragSkillOver(e, skillIndex)
                                }
                                onDragLeave={onDragSkillLeave}
                                onDrop={(e) =>
                                  onDragSkillDrop(e, skillIndex)
                                }
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div
                                    className="cursor-move text-gray-400 hover:text-gray-600"
                                    title="Drag to reorder skill"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                                    </svg>
                                  </div>
                                  <span className="text-sm text-gray-700">{skill}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onRemoveSkill(skill)}
                                  className="ml-2 px-2 py-1 text-red-600 hover:text-red-800 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label={`Remove ${skill}`}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ol>
                        );
                      },
                    },
                  ]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

