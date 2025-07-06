import { list } from '@keystone-6/core';
import { relationship, timestamp, select, integer, virtual } from '@keystone-6/core/fields';
import { graphql } from '@graphql-ts/schema';

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
    // Core relationships - the main purpose
    student: relationship({ 
      ref: 'Student.enrollments',
      ui: {
        displayMode: 'select',
        labelField: 'displayName',
        hideCreate: true,
      },
    }),
    class: relationship({ 
      ref: 'Class.enrollments',
      ui: {
        displayMode: 'select',
        labelField: 'section',
        hideCreate: true,
      },
    }),
    
    // Status tracking
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
    
    // Optional tracking fields
    waitlistPosition: integer({
      ui: {
        description: 'Position on waitlist (only for waitlisted students)',
        itemView: { fieldMode: ({ item }) => item?.status === 'waitlisted' ? 'edit' : 'hidden' },
      },
    }),
    enrolledAt: timestamp({
      ui: {
        description: 'When student was enrolled (optional - auto-filled on creation)',
      },
    }),
    droppedAt: timestamp({
      ui: {
        description: 'When student was dropped (optional - auto-filled when status changes)',
      },
    }),
    
    // Hidden system relationships
    attendanceRecords: relationship({ 
      ref: 'AttendanceRecord.enrollment',
      many: true,
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    
    // Virtual fields for display
    studentFirstName: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item, args, context) {
          const enrollment = await context.query.Enrollment.findOne({
            where: { id: item.id },
            query: 'student { firstName }',
          });
          return enrollment?.student?.firstName || '';
        },
      }),
      ui: {
        listView: { fieldMode: 'read' },
        itemView: { fieldMode: 'hidden' },
      },
    }),
    studentLastName: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item, args, context) {
          const enrollment = await context.query.Enrollment.findOne({
            where: { id: item.id },
            query: 'student { lastName }',
          });
          return enrollment?.student?.lastName || '';
        },
      }),
      ui: {
        listView: { fieldMode: 'read' },
        itemView: { fieldMode: 'hidden' },
      },
    }),
    courseCode: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item, args, context) {
          const enrollment = await context.query.Enrollment.findOne({
            where: { id: item.id },
            query: 'class { course { code } }',
          });
          return enrollment?.class?.course?.code || '';
        },
      }),
      ui: {
        listView: { fieldMode: 'read' },
        itemView: { fieldMode: 'hidden' },
      },
    }),
    classSection: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item, args, context) {
          const enrollment = await context.query.Enrollment.findOne({
            where: { id: item.id },
            query: 'class { section }',
          });
          return enrollment?.class?.section || '';
        },
      }),
      ui: {
        listView: { fieldMode: 'read' },
        itemView: { fieldMode: 'hidden' },
      },
    }),
    
    // System timestamps
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
    }),
    updatedAt: timestamp({
      db: { updatedAt: true },
      ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
    }),
  },
  ui: {
    listView: {
      initialColumns: ['studentFirstName', 'studentLastName', 'courseCode', 'classSection', 'status'],
      pageSize: 50,
    },
    description: '📝 Academic Records - Student enrollments',
  },
  hooks: {
    validateInput: async ({ resolvedData, context, operation, addValidationError }) => {
      // Require student and class
      if (!resolvedData.student?.connect?.id) {
        addValidationError('Student is required');
      }
      if (!resolvedData.class?.connect?.id) {
        addValidationError('Class is required');
      }
      
      // Validate that student and class belong to the same school system
      if ((operation === 'create' || operation === 'update') && 
          resolvedData.student?.connect?.id && resolvedData.class?.connect?.id) {
        
        const [student, classData] = await Promise.all([
          context.query.Student.findOne({
            where: { id: resolvedData.student.connect.id },
            query: 'schoolSystem { id }'
          }),
          context.query.Class.findOne({
            where: { id: resolvedData.class.connect.id },
            query: 'school { schoolSystem { id } }'
          })
        ]);
        
        const studentSchoolSystemId = student?.schoolSystem?.id;
        const classSchoolSystemId = classData?.school?.schoolSystem?.id;
        
        if (studentSchoolSystemId && classSchoolSystemId && 
            studentSchoolSystemId !== classSchoolSystemId) {
          addValidationError('Student and class must belong to the same school system');
        }
      }
    },
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