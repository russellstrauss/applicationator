import { useState } from 'react';
import { SkillCategory } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import SkillCategoryItem from './SkillCategoryItem';

interface SkillsInputProps {
  skills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}

export default function SkillsInput({ skills, onChange }: SkillsInputProps) {
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newSkill, setNewSkill] = useState<{ [categoryId: string]: string }>({});
  const [draggedSkill, setDraggedSkill] = useState<{ categoryId: string; skillIndex: number } | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dragOverSkill, setDragOverSkill] = useState<{ categoryId: string; skillIndex: number } | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<{ [categoryId: string]: boolean }>({});

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

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(categoryId);
    }
  };


  const handleDragSkillStart = (e: React.DragEvent, categoryId: string, skillIndex: number) => {
    setDraggedSkill({ categoryId, skillIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragSkillOver = (
    e: React.DragEvent,
    categoryId: string,
    skillIndex: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSkill({ categoryId, skillIndex });
  };

  const handleDragSkillLeave = () => {
    setDragOverSkill(null);
  };

  const handleDragSkillDrop = (e: React.DragEvent, targetCategoryId: string, targetSkillIndex: number) => {
    e.preventDefault();
    if (!draggedSkill) return;

    const { categoryId: sourceCategoryId, skillIndex: sourceSkillIndex } = draggedSkill;

    if (sourceCategoryId === targetCategoryId && sourceSkillIndex === targetSkillIndex) {
      setDraggedSkill(null);
      return;
    }

    const sourceCategory = skills.find((cat) => cat.id === sourceCategoryId);
    if (!sourceCategory) return;

    const skillToMove = sourceCategory.skills[sourceSkillIndex];
    const newSkills = [...sourceCategory.skills];
    newSkills.splice(sourceSkillIndex, 1);

    if (sourceCategoryId === targetCategoryId) {
      // Moving within same category
      const adjustedIndex = sourceSkillIndex < targetSkillIndex ? targetSkillIndex - 1 : targetSkillIndex;
      newSkills.splice(adjustedIndex, 0, skillToMove);
      onChange(
        skills.map((cat) =>
          cat.id === sourceCategoryId ? { ...cat, skills: newSkills } : cat
        )
      );
    } else {
      // Moving to different category
      const targetCategory = skills.find((cat) => cat.id === targetCategoryId);
      if (!targetCategory) return;

      const targetSkills = [...targetCategory.skills];
      targetSkills.splice(targetSkillIndex, 0, skillToMove);

      onChange(
        skills.map((cat) => {
          if (cat.id === sourceCategoryId) {
            return { ...cat, skills: newSkills };
          }
          if (cat.id === targetCategoryId) {
            return { ...cat, skills: targetSkills };
          }
          return cat;
        })
      );
    }

    setDraggedSkill(null);
    setDragOverSkill(null);
  };

  const handleDragCategoryStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragCategoryOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategoryIndex(targetIndex);
  };

  const handleDragCategoryLeave = () => {
    setDragOverCategoryIndex(null);
  };

  const handleDragCategoryDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategoryId) {
      setDraggedCategory(null);
      return;
    }

    const sourceIndex = skills.findIndex((cat) => cat.id === draggedCategory);
    const targetIndex = skills.findIndex((cat) => cat.id === targetCategoryId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedCategory(null);
      return;
    }

    const newCategories = [...skills];
    const [movedCategory] = newCategories.splice(sourceIndex, 1);
    newCategories.splice(targetIndex, 0, movedCategory);

    onChange(newCategories);
    setDraggedCategory(null);
    setDragOverCategoryIndex(null);
  };

  return (
    <div className="space-y-4">
      {skills.map((category, categoryIndex) => {
        const isCollapsed = !!collapsedCategories[category.id];
        return (
          <SkillCategoryItem
            key={category.id}
            category={category}
            isCollapsed={isCollapsed}
            editingCategory={editingCategory}
            newSkill={newSkill[category.id] || ''}
            draggedSkill={draggedSkill}
            dragOverSkill={dragOverSkill}
            onToggleCollapse={() => toggleCategoryCollapse(category.id)}
            onEditTitle={(cat) => setEditingCategory(cat)}
            onUpdateTitle={(newTitle) => handleUpdateCategoryTitle(category.id, newTitle)}
            onCancelEditTitle={() => setEditingCategory(null)}
            onDeleteCategory={() => handleDeleteCategory(category.id)}
            onNewSkillChange={(value) => setNewSkill({ ...newSkill, [category.id]: value })}
            onAddSkill={() => handleAddSkill(category.id)}
            onKeyPress={(e) => handleKeyPress(e, category.id)}
            onRemoveSkill={(skill) => handleRemoveSkill(category.id, skill)}
            onDragSkillStart={(e, skillIndex) => handleDragSkillStart(e, category.id, skillIndex)}
            onDragSkillOver={(e, skillIndex) => handleDragSkillOver(e, category.id, skillIndex)}
            onDragSkillLeave={handleDragSkillLeave}
            onDragSkillDrop={(e, skillIndex) => handleDragSkillDrop(e, category.id, skillIndex)}
            onDragCategoryStart={(e) => handleDragCategoryStart(e, category.id)}
            onDragCategoryOver={(e) => handleDragCategoryOver(e, categoryIndex)}
            onDragCategoryLeave={handleDragCategoryLeave}
            onDragCategoryDrop={(e) => handleDragCategoryDrop(e, category.id)}
            showDragIndicator={dragOverCategoryIndex === categoryIndex}
          />
        );
      })}

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
