import React, { useState, useEffect } from 'react';
import { FieldContainer, FieldLabel, FieldDescription } from '@keystone-ui/fields';
import { Checkbox, TextInput, Select } from '@keystone-ui/fields';
import { controller } from '@keystone-6/core/fields/types/json/views';

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

export const Field = ({ field, value, onChange, autoFocus }) => {
  // Initialize with default or existing value
  const [schedule, setSchedule] = useState<ScheduleData>(
    value && typeof value === 'object' 
      ? value as ScheduleData
      : { days: [], startTime: '08:00', endTime: '09:30' }
  );

  // Update the field value when schedule changes
  useEffect(() => {
    onChange(schedule);
  }, [schedule, onChange]);

  // Handle days selection
  const handleDayToggle = (day: string) => {
    setSchedule(prev => {
      const newDays = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days: newDays };
    });
  };

  // Handle time changes
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => ({ ...prev, [field]: value }));
  };

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>{field.description}</FieldDescription>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>Days</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {DAYS_OPTIONS.map(day => (
            <label key={day.value} style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={schedule.days.includes(day.value)}
                onChange={() => handleDayToggle(day.value)}
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
            value={generateTimeOptions().find(opt => opt.value === schedule.startTime)}
            onChange={option => handleTimeChange('startTime', option?.value || '08:00')}
            options={generateTimeOptions()}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>End Time</label>
          <Select
            value={generateTimeOptions().find(opt => opt.value === schedule.endTime)}
            onChange={option => handleTimeChange('endTime', option?.value || '09:30')}
            options={generateTimeOptions()}
          />
        </div>
      </div>
    </FieldContainer>
  );
};

export const Cell = ({ item, field }) => {
  const value = item[field.path];
  if (!value) return null;
  
  const schedule = typeof value === 'string' ? JSON.parse(value) : value;
  const { days = [], startTime = '', endTime = '' } = schedule;
  
  return (
    <div>
      {days.join(', ')} {startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : ''}
    </div>
  );
};

export const CardValue = ({ item, field }) => {
  const value = item[field.path];
  if (!value) return null;
  
  const schedule = typeof value === 'string' ? JSON.parse(value) : value;
  const { days = [], startTime = '', endTime = '' } = schedule;
  
  return (
    <div>
      {days.join(', ')} {startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : ''}
    </div>
  );
};

export { controller };
