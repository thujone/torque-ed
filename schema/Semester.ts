import { list } from '@keystone-6/core';
import { text, relationship, timestamp, calendarDay } from '@keystone-6/core/fields';

export const Semester = list({
  access: {
    filter: {
      query: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        return { schoolSystem: { id: { equals: session?.data?.schoolSystemId } } };
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
               session?.data?.roles?.includes('admin');
      },
      delete: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin');
      },
    },
  },
  fields: {
    name: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Semester name (e.g., Fall 2025)',
      },
    }),
    startDate: calendarDay({ 
      validation: { isRequired: true },
    }),
    endDate: calendarDay({ 
      validation: { isRequired: true },
    }),
    midtermStartDate: calendarDay({
      ui: {
        description: 'Start of midterm exam period',
      },
    }),
    midtermEndDate: calendarDay({
      ui: {
        description: 'End of midterm exam period',
      },
    }),
    finalStartDate: calendarDay({
      ui: {
        description: 'Start of final exam period',
      },
    }),
    finalEndDate: calendarDay({
      ui: {
        description: 'End of final exam period',
      },
    }),
    
    // Relationships
    schoolSystem: relationship({ 
      ref: 'SchoolSystem.semesters',
      ui: {
        displayMode: 'select',
        labelField: 'name',
        linkToItem: false,
        hideCreate: true,
      },
      hooks: {
        resolveInput: ({ resolvedData, context, operation }) => {
          // Auto-populate schoolSystem for non-superAdmin users on create
          if (operation === 'create' && !resolvedData.schoolSystem && context.session?.data?.schoolSystemId) {
            return { connect: { id: context.session.data.schoolSystemId } };
          }
          return resolvedData.schoolSystem;
        },
      },
    }),
    holidays: relationship({ 
      ref: 'Holiday.semester',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['name', 'date'],
        linkToItem: false,
        hideCreate: true,
      },
    }),
    classes: relationship({ 
      ref: 'Class.semester',
      many: true,
      ui: {
        linkToItem: false,
        hideCreate: true,
      },
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
  hooks: {
    validateInput: async ({ resolvedData, addValidationError }) => {
      // Require schoolSystem
      if (!resolvedData.schoolSystem?.connect?.id) {
        addValidationError('School system is required');
      }
    },
  },
  ui: {
    listView: {
      initialColumns: ['name', 'startDate', 'endDate', 'schoolSystem'],
    },
    labelField: 'name',
    description: '📅 Academic Structure - Academic terms',
  },
});