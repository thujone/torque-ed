import React, { useState } from 'react';
import { FieldContainer, FieldLabel, FieldDescription } from '@keystone-ui/fields';
import { TextArea } from '@keystone-ui/fields';
import { controller } from '@keystone-6/core/fields/types/json/views';

export const Field = ({ field, value, onChange, autoFocus }) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    try {
      const parsed = JSON.parse(newValue);
      onChange(parsed);
      setError(null);
    } catch (err) {
      setError('Invalid JSON');
      // Still update the field with the raw value so they can fix it
      onChange(newValue);
    }
  };

  const stringValue = value === undefined ? '' : 
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>{field.description}</FieldDescription>
      <TextArea
        autoFocus={autoFocus}
        id={field.path}
        onChange={handleChange}
        value={stringValue}
        aria-describedby={field.description === null ? undefined : `${field.path}-description`}
      />
      {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
    </FieldContainer>
  );
};

export const Cell = ({ item, field }) => {
  const value = item[field.path];
  return (
    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value === null ? '' : JSON.stringify(value)}
    </div>
  );
};

export const CardValue = ({ item, field }) => {
  const value = item[field.path];
  return (
    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value === null ? '' : JSON.stringify(value)}
    </div>
  );
};

export { controller };
