import { list } from '@keystone-6/core';
import { text, relationship, timestamp } from '@keystone-6/core/fields';

export const School = list({
  access: {
    filter: {
      query: ({ session }) => {
        if (session?.data?.roles === 'superAdmin') return true;
        return { schoolSystem: { id: { equals: session?.data?.schoolSystemId } } };
      },
    },
    operation: {
      query: ({ session }) => {
        return !!session?.data; // Allow queries for authenticated users
      },
      create: ({ session }) => {
        return session?.data?.roles === 'superAdmin' || 
               session?.data?.roles === 'admin';
      },
      update: ({ session }) => {
        return session?.data?.roles === 'superAdmin' || 
               session?.data?.roles === 'admin';
      },
      delete: ({ session }) => {
        return session?.data?.roles === 'superAdmin';
      },
    },
  },
  fields: {
    name: text({ 
      validation: { isRequired: true },
    }),
    address: text(),
    
    // Relationships
    schoolSystem: relationship({ 
      ref: 'SchoolSystem.schools',
      ui: {
        displayMode: 'select',
        labelField: 'name',
      },
    }),
    administrators: relationship({ 
      ref: 'User.schools',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['firstName', 'lastName', 'email'],
        linkToItem: true,
      },
    }),
    classes: relationship({ 
      ref: 'Class.school',
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
      initialColumns: ['name', 'schoolSystem', 'address'],
    },
    labelField: 'name',
  },
});