import { list } from '@keystone-6/core';
import { text, relationship, timestamp, virtual } from '@keystone-6/core/fields';
import { v4 as uuidv4 } from 'uuid';
import { graphql } from '@graphql-ts/schema';

export const Student = list({
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
               session?.data?.roles?.includes('admin') ||
               session?.data?.roles?.includes('instructor');
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
    studentId: text({ 
      validation: { isRequired: true },
      isIndexed: 'unique',
      ui: {
        description: 'Unique student identifier',
      },
    }),
    firstName: text({ 
      validation: { isRequired: true },
    }),
    lastName: text({ 
      validation: { isRequired: true },
    }),
    email: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Student email address',
      },
    }),
    qrCode: text({
      isIndexed: 'unique',
      defaultValue: '',
      ui: {
        description: 'Unique QR code for attendance scanning',
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    displayName: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve: (item) => {
          const email = item.email?.replace(/^mailto:/, '') || '';
          return `${item.studentId} - ${item.firstName} ${item.lastName} (${email})`;
        },
      }),
      ui: {
        query: 'studentId firstName lastName email',
      },
    }),
    
    // Relationships
    schoolSystem: relationship({ 
      ref: 'SchoolSystem.students',
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
    school: relationship({ 
      ref: 'School',
      ui: {
        displayMode: 'select',
        labelField: 'name',
        linkToItem: false,
        hideCreate: true,
      },
    }),
    enrollments: relationship({ 
      ref: 'Enrollment.student',
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
  ui: {
    listView: {
      initialColumns: ['studentId', 'firstName', 'lastName', 'email', 'school', 'schoolSystem'],
    },
    labelField: 'displayName',
    description: '🎓 People - Student records',
  },
  hooks: {
    validateInput: async ({ resolvedData, addValidationError }) => {
      // Require schoolSystem
      if (!resolvedData.schoolSystem?.connect?.id) {
        addValidationError('School system is required');
      }
    },
    resolveInput: {
      create: ({ resolvedData, context }) => {
        // Ensure QR code is generated if not provided
        if (!resolvedData.qrCode) {
          resolvedData.qrCode = uuidv4();
        }
        return resolvedData;
      },
    },
  },
});