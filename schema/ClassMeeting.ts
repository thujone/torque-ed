import { list } from '@keystone-6/core';
import { relationship, timestamp, select, text, checkbox, calendarDay } from '@keystone-6/core/fields';

export const ClassMeeting = list({
  access: {
    filter: {
      query: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        if (session?.data?.roles?.includes('admin')) {
          return { class: { school: { schoolSystem: { id: { equals: session?.data?.schoolSystemId } } } } };
        }
        if (session?.data?.roles?.includes('instructor')) {
          return { 
            class: { 
              OR: [
                { instructor: { id: { equals: session?.data?.id } } },
                { teachingAssistants: { some: { id: { equals: session?.data?.id } } } }
              ]
            }
          };
        }
        if (session?.data?.roles?.includes('ta')) {
          return { class: { teachingAssistants: { some: { id: { equals: session?.data?.id } } } } };
        }
        return false;
      },
    },
    operation: {
      query: ({ session }) => {
        return !!session?.data; // Allow queries for authenticated users
      },
      create: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin') || 
               session?.data?.roles?.includes('admin');
      },
      update: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin') || 
               session?.data?.roles?.includes('admin') ||
               session?.data?.roles?.includes('instructor');
      },
      delete: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin') ||
               session?.data?.roles?.includes('admin');
      },
    },
  },
  fields: {
    scheduledDate: calendarDay({ 
      validation: { isRequired: true },
    }),
    scheduledStartTime: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Start time in HH:MM format',
      },
    }),
    scheduledEndTime: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'End time in HH:MM format',
      },
    }),
    actualDate: calendarDay({
      ui: {
        description: 'Actual date if rescheduled',
      },
    }),
    status: select({
      type: 'enum',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'scheduled',
      validation: { isRequired: true },
    }),
    isMidterm: checkbox({
      defaultValue: false,
      ui: {
        description: 'Is this a midterm exam meeting?',
      },
    }),
    isFinal: checkbox({
      defaultValue: false,
      ui: {
        description: 'Is this a final exam meeting?',
      },
    }),
    room: text({
      ui: {
        description: 'Room for this specific meeting (overrides class default)',
      },
    }),
    
    // Relationships
    class: relationship({ 
      ref: 'Class.meetings',
      ui: {
        displayMode: 'select',
        labelField: 'section',
      },
    }),
    attendanceRecords: relationship({ 
      ref: 'AttendanceRecord.classMeeting',
      many: true,
    }),
    
    // Timestamps
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      ui: { createView: { fieldMode: 'hidden' } },
    }),
    updatedAt: timestamp({
      db: { updatedAt: true },
      ui: { createView: { fieldMode: 'hidden' } },
    }),
  },
  ui: {
    listView: {
      initialColumns: ['class', 'scheduledDate', 'scheduledStartTime', 'status'],
    },
    labelField: 'scheduledDate',
  },
});