import React from 'react';
import { FieldContainer, FieldLabel } from '@keystone-ui/fields';

export const Field = ({ field }: any) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        marginTop: '8px'
      }}>
        <a 
          href="/attendance" 
          target="_blank"
          style={{ 
            color: '#3b82f6', 
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          📊 Open Attendance Spreadsheet →
        </a>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
          View and manage attendance for all classes in a spreadsheet format
        </p>
      </div>
    </FieldContainer>
  );
};

export const Cell = () => {
  return (
    <a href="/attendance" style={{ color: '#3b82f6' }}>
      📊 Spreadsheet
    </a>
  );
};

export const CardValue = () => {
  return (
    <a href="/attendance" style={{ color: '#3b82f6' }}>
      View Spreadsheet
    </a>
  );
};

export const controller = (config: any) => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path}`,
    defaultValue: '',
    deserialize: (data: any) => {
      return data[config.path] ?? '';
    },
    serialize: () => ({}),
  };
};