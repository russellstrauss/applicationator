import React from 'react';

export interface AttributeDefinition {
  label: string;
  value: string | string[] | boolean | null | undefined;
  format?: (value: any) => string | React.ReactNode;
  hideIfEmpty?: boolean;
  className?: string;
}

interface ListItemDisplayProps {
  attributes: AttributeDefinition[];
  className?: string;
}

export default function ListItemDisplay({ attributes, className = '' }: ListItemDisplayProps) {
  const formatValue = (attr: AttributeDefinition): string | React.ReactNode => {
    const { value, format, hideIfEmpty } = attr;

    // Handle empty values
    if (value === null || value === undefined || value === '') {
      if (hideIfEmpty) return null;
      return 'N/A';
    }

    // Use custom formatter if provided
    if (format) {
      return format(value);
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle array values
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return hideIfEmpty ? null : 'None';
      }
      return value.join(', ');
    }

    // Handle string values
    return String(value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {attributes.map((attr, index) => {
        const formattedValue = formatValue(attr);
        
        // Skip rendering if formatter returns null (for hideIfEmpty)
        if (formattedValue === null) {
          return null;
        }

        return (
          <div key={index} className={`attribute-row ${attr.className || ''}`}>
            <span className="attribute-label text-sm font-medium text-gray-700">
              {attr.label}:
            </span>
            <span className="attribute-value text-sm text-gray-900 ml-2">
              {formattedValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}


