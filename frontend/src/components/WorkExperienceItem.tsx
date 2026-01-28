import React from 'react';
import { WorkExperience } from '../../../shared/types';
import ListItemDisplay, { AttributeDefinition } from './ListItemDisplay';

interface WorkExperienceItemProps {
  experience: WorkExperience;
  index: number;
  totalItems: number;
  onEdit: (exp: WorkExperience) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

export default function WorkExperienceItem({
  experience,
  index,
  totalItems,
  onEdit,
  onDelete,
  onMove,
}: WorkExperienceItemProps) {
  const descriptionItems = experience.description
    ? experience.description.split('\n').filter(line => line.trim())
    : [];

  const attributes: AttributeDefinition[] = [
    {
      label: 'Position',
      value: experience.position,
    },
    {
      label: 'Company',
      value: experience.company,
    },
    {
      label: 'Location',
      value: experience.location,
      hideIfEmpty: true,
    },
    {
      label: 'Start Date',
      value: experience.startDate,
    },
    {
      label: 'End Date',
      value: experience.current ? null : (experience.endDate || null),
      format: (value) => value || 'N/A',
      hideIfEmpty: experience.current,
    },
    {
      label: 'Current',
      value: experience.current,
      format: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Current' : 'Past'}
        </span>
      ),
    },
    {
      label: 'Description',
      value: descriptionItems,
      format: (items: string[]) => {
        if (items.length === 0) return null;
        return (
          <ul className="list-disc list-outside ml-5 space-y-1 mt-1">
            {items.map((item, idx) => (
              <li key={idx} className="pl-1">{item.trim()}</li>
            ))}
          </ul>
        );
      },
      hideIfEmpty: true,
      className: 'mt-2',
    },
  ];

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <ListItemDisplay attributes={attributes} />
        </div>
        <div className="flex gap-2 ml-4 items-center">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onMove(experience.id, 'up')}
              disabled={index === 0}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(experience.id, 'down')}
              disabled={index === totalItems - 1}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              ↓
            </button>
          </div>
          <button
            type="button"
            onClick={() => onEdit(experience)}
            className="px-2 py-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(experience.id)}
            className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}


