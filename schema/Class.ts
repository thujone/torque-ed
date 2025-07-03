import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer, json } from '@keystone-6/core/fields';
import { generateClassSessions } from '../lib/generateClassSessions';

export const Class = list({
  access: {
    filter: {
      query: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        if (session?.data?.roles?.includes('admin')) {
          return { school: { schoolSystem: { id: { equals: session?.data?.schoolSystemId } } } };
        }
        if (session?.data?.roles?.includes('instructor')) {
          return { 
            OR: [
              { instructor: { id: { equals: session?.data?.id } } },
              { teachingAssistants: { some: { id: { equals: session?.data?.id } } } }
            ]
          };
        }
        if (session?.data?.roles?.includes('ta')) {
          return { teachingAssistants: { some: { id: { equals: session?.data?.id } } } };
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
      update: ({ session, item }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        if (session?.data?.roles?.includes('admin')) return true;
        if (session?.data?.roles?.includes('instructor') && 
            session?.data?.id === item.instructorId) return true;
        return false;
      },
      delete: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin') ||
               session?.data?.roles?.includes('admin');
      },
    },
  },
  fields: {
    section: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Section identifier (e.g., Morning II, Evening A)',
      },
    }),
    maxEnrollment: integer({ 
      validation: { isRequired: true, min: 1 },
      defaultValue: 30,
    }),
    room: text({
      ui: {
        description: 'Default room for this class',
      },
    }),
    building: text({
      ui: {
        description: 'Building where this class is held',
      },
    }),
    schedule: json({
      ui: {
        views: './admin/components/ScheduleField',
        description: 'Class schedule: days, start time, end time',
      },
      defaultValue: {
        days: ['M', 'W', 'F'],
        startTime: '08:00',
        endTime: '09:30',
      },
    }),
    
    // Relationships
    course: relationship({ 
      ref: 'Course.classes',
      ui: {
        displayMode: 'select',
        labelField: 'code',
      },
    }),
    semester: relationship({ 
      ref: 'Semester.classes',
      ui: {
        displayMode: 'select',
        labelField: 'name',
      },
    }),
    school: relationship({ 
      ref: 'School.classes',
      ui: {
        displayMode: 'select',
        labelField: 'name',
      },
    }),
    instructor: relationship({ 
      ref: 'User.instructorClasses',
      ui: {
        displayMode: 'select',
        labelField: 'email',
      },
    }),
    teachingAssistants: relationship({ 
      ref: 'User.taClasses',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['firstName', 'lastName', 'email'],
        linkToItem: true,
      },
    }),
    enrollments: relationship({ 
      ref: 'Enrollment.class',
      many: true,
    }),
    sessions: relationship({ 
      ref: 'ClassSession.class',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['scheduledDate', 'sessionType', 'status'],
        linkToItem: true,
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
      initialColumns: ['course', 'section', 'instructor', 'semester', 'school'],
    },
    labelField: 'section',
    description: '📊 To view attendance in spreadsheet format, go to: /attendance',
  },
  hooks: {
    afterOperation: {
      create: async ({ item, context }) => {
        // Generate class sessions after class creation
        console.log(`Class created: ${item.id}, generating sessions...`);
        await generateClassSessions(context, item.id);
      },
    },
  },
});