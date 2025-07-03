import { list } from '@keystone-6/core';
import { text, relationship, timestamp } from '@keystone-6/core/fields';

export const Course = list({
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
    code: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Course code (e.g., AUTO-302)',
      },
    }),
    name: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Course name (e.g., Transmission Repair)',
      },
    }),
    description: text({
      ui: { displayMode: 'textarea' },
    }),
    prerequisites: text({
      ui: {
        displayMode: 'textarea',
        description: 'Free text description of prerequisites',
      },
    }),
    
    // Relationships
    schoolSystem: relationship({ 
      ref: 'SchoolSystem.courses',
      ui: {
        displayMode: 'select',
        labelField: 'name',
      },
    }),
    classes: relationship({ 
      ref: 'Class.course',
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
      initialColumns: ['code', 'name', 'schoolSystem'],
    },
    labelField: 'code',
  },
});