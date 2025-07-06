import { list } from '@keystone-6/core';
import { text, password, select, relationship, timestamp } from '@keystone-6/core/fields';
import { allowAll, denyAll } from '@keystone-6/core/access';

export const User = list({
  access: {
    filter: {
      query: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        if (session?.data?.roles?.includes('admin')) {
          return { schoolSystem: { id: { equals: session?.data?.schoolSystemId } } };
        }
        // Regular users can only see themselves
        return { id: { equals: session?.data?.id } };
      },
      update: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        if (session?.data?.roles?.includes('admin')) {
          return { schoolSystem: { id: { equals: session?.data?.schoolSystemId } } };
        }
        // Regular users can only update themselves
        return { id: { equals: session?.data?.id } };
      },
      delete: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        return false; // Only super admins can delete
      },
    },
    operation: {
      query: ({ session }) => {
        return !!session?.data; // Allow queries for authenticated users
      },
      create: ({ session }) => {
        // Only super admins and admins can create users
        return session?.data?.roles?.includes('superAdmin') || 
               session?.data?.roles?.includes('admin');
      },
      update: ({ session }) => {
        // Allow authenticated users to attempt updates (filtering handles specifics)
        return !!session?.data;
      },
      delete: ({ session }) => {
        // Only super admins can delete users
        return session?.data?.roles?.includes('superAdmin');
      },
    },
  },
  fields: {
    email: text({ 
      validation: { isRequired: true },
      isIndexed: 'unique',
      access: {
        read: allowAll,
        create: allowAll,
        update: ({ session, item }) => {
          return session?.data?.roles?.includes('superAdmin') || session?.data?.id === item.id;
        },
      },
    }),
    password: password({ validation: { isRequired: true } }),
    firstName: text({ validation: { isRequired: true } }),
    lastName: text({ validation: { isRequired: true } }),
    roles: select({
      type: 'enum',
      options: [
        { label: 'Super Admin', value: 'superAdmin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Instructor', value: 'instructor' },
        { label: 'Teaching Assistant', value: 'ta' },
      ],
      defaultValue: 'instructor',
      ui: { displayMode: 'select' },
    }),
    
    // Relationships
    schoolSystem: relationship({ 
      ref: 'SchoolSystem.users',
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
    schools: relationship({ 
      ref: 'School.administrators',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['name'],
        linkToItem: false,
        hideCreate: true,
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'hidden' },
      },
    }),
    instructorClasses: relationship({ 
      ref: 'Class.instructor',
      many: true,
      ui: {
        linkToItem: false,
        hideCreate: true,
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'hidden' },
      },
    }),
    taClasses: relationship({ 
      ref: 'Class.teachingAssistants',
      many: true,
      ui: {
        linkToItem: false,
        hideCreate: true,
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'hidden' },
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
      // Require schoolSystem for non-superAdmin users
      if (!resolvedData.schoolSystem?.connect?.id && resolvedData.roles !== 'superAdmin') {
        addValidationError('School system is required');
      }
    },
  },
  ui: {
    listView: {
      initialColumns: ['firstName', 'lastName', 'email', 'roles', 'schoolSystem'],
    },
    labelField: 'email',
    description: '👥 People - Faculty and staff (admins, instructors, TAs)',
    label: 'Faculty and Staff',
    singular: 'Faculty/Staff Member',
    plural: 'Faculty and Staff',
  },
});