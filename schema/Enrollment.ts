import { list } from '@keystone-6/core';
import { relationship, timestamp, select, integer } from '@keystone-6/core/fields';

export const Enrollment = list({
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
               session?.data?.roles?.includes('admin') ||
               session?.data?.roles?.includes('instructor');
      },
    },
  },
  fields: {
    status: select({
      type: 'enum',
      options: [
        { label: 'Enrolled', value: 'enrolled' },
        { label: 'Waitlisted', value: 'waitlisted' },
        { label: 'Dropped', value: 'dropped' },
      ],
      defaultValue: 'enrolled',
      validation: { isRequired: true },
    }),
    waitlistPosition: integer({
      ui: {
        description: 'Position on waitlist (null if enrolled)',
      },
    }),
    enrolledAt: timestamp({
      ui: {
        description: 'When student was enrolled',
      },
    }),
    droppedAt: timestamp({
      ui: {
        description: 'When student was dropped',
      },
    }),
    
    // Relationships
    student: relationship({ 
      ref: 'Student.enrollments',
      ui: {
        displayMode: 'select',
        labelField: 'studentId',
      },
    }),
    class: relationship({ 
      ref: 'Class.enrollments',
      ui: {
        displayMode: 'select',
        labelField: 'section',
      },
    }),
    attendanceRecords: relationship({ 
      ref: 'AttendanceRecord.enrollment',
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
      initialColumns: ['student', 'class', 'status', 'enrolledAt'],
    },
  },
  hooks: {
    resolveInput: {
      create: ({ resolvedData }) => {
        // Set enrolledAt when status is enrolled
        if (resolvedData.status === 'enrolled' && !resolvedData.enrolledAt) {
          resolvedData.enrolledAt = new Date().toISOString();
        }
        return resolvedData;
      },
      update: ({ resolvedData }) => {
        // Set droppedAt when status changes to dropped
        if (resolvedData.status === 'dropped' && !resolvedData.droppedAt) {
          resolvedData.droppedAt = new Date().toISOString();
        }
        return resolvedData;
      },
    },
  },
});