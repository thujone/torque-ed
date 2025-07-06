import React, { useState } from 'react';
import { FieldContainer, FieldLabel, FieldDescription, Checkbox, Select } from '@keystone-ui/fields';
import {
  type CardValueComponent,
  type CellComponent,
  type FieldController,
  type FieldControllerConfig,
  type FieldProps,
} from '@keystone-6/core';
import { CellLink, CellContainer } from '@keystone-6/core/admin-ui/components';

type ScheduleData = {
  days: string[];
  startTime: string;
  endTime: string;
};

// Days of the week options
const DAYS_OPTIONS = [
  { label: 'Monday', value: 'M' },
  { label: 'Tuesday', value: 'T' },
  { label: 'Wednesday', value: 'W' },
  { label: 'Thursday', value: 'R' },
  { label: 'Friday', value: 'F' },
  { label: 'Saturday', value: 'S' },
  { label: 'Sunday', value: 'U' },
];

// Time options in 15 minute increments
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      const time = `${h}:${m}`;
      options.push({ label: formatTime(time), value: time });
    }
  }
  return options;
};

// Format time from 24-hour to 12-hour
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const Field = ({ field, value, onChange, autoFocus }: FieldProps<typeof controller>) => {
  const handleDayToggle = (day: string) => {
    if (!onChange) return;
    
    const currentValue = value || { days: [], startTime: '08:00', endTime: '09:30' };
    const newDays = currentValue.days.includes(day)
      ? currentValue.days.filter((d: string) => d !== day)
      : [...currentValue.days, day];
    
    onChange({
      ...currentValue,
      days: newDays
    });
  };

  const handleTimeChange = (fieldName: 'startTime' | 'endTime', newValue: string) => {
    if (!onChange) return;
    
    onChange({
      ...value,
      [fieldName]: newValue
    });
  };
  const scheduleValue = value || { days: ['M', 'W', 'F'], startTime: '08:00', endTime: '09:30' };
  const isDisabled = onChange === undefined;
  
  return (
    <FieldContainer>
      <FieldLabel htmlFor={field.path}>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>{field.description}</FieldDescription>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>Days</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {DAYS_OPTIONS.map(day => (
            <label key={day.value} style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={scheduleValue.days.includes(day.value)}
                onChange={() => handleDayToggle(day.value)}
                disabled={isDisabled}
              />
              <span style={{ marginLeft: '4px' }}>{day.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Start Time</label>
          <Select
            value={generateTimeOptions().find(opt => opt.value === scheduleValue.startTime)}
            onChange={option => handleTimeChange('startTime', option?.value || '08:00')}
            options={generateTimeOptions()}
            isDisabled={isDisabled}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>End Time</label>
          <Select
            value={generateTimeOptions().find(opt => opt.value === scheduleValue.endTime)}
            onChange={option => handleTimeChange('endTime', option?.value || '09:30')}
            options={generateTimeOptions()}
            isDisabled={isDisabled}
          />
        </div>
      </div>
    </FieldContainer>
  );
};

export const Cell: CellComponent = ({ item, field, linkTo }) => {
  const value = item[field.path];
  if (!value) return null;
  
  const { days = [], startTime = '', endTime = '' } = value;
  const content = `${days.join(', ')} ${startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : ''}`;
  
  return linkTo ? <CellLink {...linkTo}>{content}</CellLink> : <CellContainer>{content}</CellContainer>;
};
Cell.supportsLinkTo = true;

export const CardValue: CardValueComponent = ({ item, field }) => {
  const value = item[field.path];
  if (!value) return null;
  
  const { days = [], startTime = '', endTime = '' } = value;
  
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <div>{days.join(', ')} {startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : ''}</div>
    </FieldContainer>
  );
};

export const controller = (
  config: FieldControllerConfig
): FieldController<ScheduleData | null, string> => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: { days: ['M', 'W', 'F'], startTime: '08:00', endTime: '09:30' },
    deserialize: data => {
      const value = data[config.path];
      if (!value) return null;
      return value;
    },
    serialize: value => ({
      [config.path]: value
    }),
    validate: value => value !== undefined
  };
};
