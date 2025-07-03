import { list } from '@keystone-6/core';
import { text, relationship, timestamp, calendarDay } from '@keystone-6/core/fields';

export const Holiday = list({
  access: {
    filter: {
      query: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        return { semester: { schoolSystem: { id: { equals: session?.data?.schoolSystemId } } } };
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
        return session?.data?.roles?.includes('superAdmin') || 
               session?.data?.roles?.includes('admin');
      },
    },
  },
  fields: {
    name: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Holiday name (e.g., Labor Day, Thanksgiving)',
      },
    }),
    date: calendarDay({ 
      validation: { isRequired: true },
    }),
    
    // Relationships
    semester: relationship({ 
      ref: 'Semester.holidays',
      ui: {
        displayMode: 'select',
        labelField: 'name',
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
  ui: {
    listView: {
      initialColumns: ['name', 'date', 'semester'],
    },
    labelField: 'name',
  },
});