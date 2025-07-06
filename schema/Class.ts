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
      ui: {
        description: 'Maximum number of students that can enroll',
      },
    }),
    room: text({
      ui: {
        description: 'Default room for this class (optional)',
      },
    }),
    building: text({
      ui: {
        description: 'Building where this class is held (optional)',
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
      validation: { isRequired: true },
    }),
    
    // Relationships
    course: relationship({ 
      ref: 'Course.classes',
      ui: {
        displayMode: 'select',
        labelField: 'code',
        description: 'Which course this class is teaching',
        linkToItem: false,
        hideCreate: true,
      },
      validation: { isRequired: true },
    }),
    semester: relationship({ 
      ref: 'Semester.classes',
      ui: {
        displayMode: 'select',
        labelField: 'name',
        description: 'Academic term when this class runs',
        linkToItem: false,
        hideCreate: true,
      },
      validation: { isRequired: true },
    }),
    school: relationship({ 
      ref: 'School.classes',
      ui: {
        displayMode: 'select',
        labelField: 'name',
        description: 'Which school this class belongs to',
        linkToItem: false,
        hideCreate: true,
      },
      validation: { isRequired: true },
    }),
    instructor: relationship({ 
      ref: 'User.instructorClasses',
      ui: {
        displayMode: 'select',
        labelField: 'email',
        description: 'Primary instructor for this class',
        linkToItem: false,
        hideCreate: true,
      },
    }),
    teachingAssistants: relationship({ 
      ref: 'User.taClasses',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['firstName', 'lastName', 'email'],
        linkToItem: false,
        hideCreate: true,
        description: 'Teaching assistants for this class',
      },
    }),
    enrollments: relationship({ 
      ref: 'Enrollment.class',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['student', 'status'],
        linkToItem: false,
        hideCreate: true,
        createView: { fieldMode: 'hidden' },
      },
    }),
    sessions: relationship({ 
      ref: 'ClassSession.class',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['scheduledDate', 'sessionType', 'status'],
        linkToItem: false,
        hideCreate: true,
        createView: { fieldMode: 'hidden' },
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
    description: '📋 Classes & Scheduling - Class sections\n\n📊 To view attendance in spreadsheet format, go to: /attendance\n\n📅 When you create a new class, class sessions will be automatically generated based on the schedule and semester dates.',
  },
  hooks: {
    validateInput: async ({ resolvedData, context, operation, addValidationError }) => {
      // Validate that course, semester, and school all belong to the same school system
      if (operation === 'create' || operation === 'update') {
        const checkData = [];
        
        if (resolvedData.course?.connect?.id) {
          checkData.push({
            field: 'course',
            id: resolvedData.course.connect.id,
            query: 'Course'
          });
        }
        
        if (resolvedData.semester?.connect?.id) {
          checkData.push({
            field: 'semester', 
            id: resolvedData.semester.connect.id,
            query: 'Semester'
          });
        }
        
        if (resolvedData.school?.connect?.id) {
          checkData.push({
            field: 'school',
            id: resolvedData.school.connect.id,
            query: 'School'
          });
        }
        
        if (checkData.length > 0) {
          const schoolSystemIds = await Promise.all(
            checkData.map(async (check) => {
              const result = await context.query[check.query].findOne({
                where: { id: check.id },
                query: 'schoolSystem { id }'
              });
              return { field: check.field, schoolSystemId: result?.schoolSystem?.id };
            })
          );
          
          const uniqueSchoolSystems = [...new Set(schoolSystemIds.map(s => s.schoolSystemId).filter(Boolean))];
          
          if (uniqueSchoolSystems.length > 1) {
            addValidationError('Course, semester, and school must all belong to the same school system');
          }
        }
      }
    },
    afterOperation: {
      create: async ({ item, context }) => {
        // Generate class sessions after class creation
        try {
          console.log(`Class created: ${item.id}, generating sessions...`);
          await generateClassSessions(context, item.id);
          
          // Count the sessions that were actually created
          const sessionCount = await context.query.ClassSession.count({
            where: { class: { id: { equals: item.id } } }
          });
          
          // Update the UI description to show session count
          if (sessionCount > 0) {
            console.log(`Successfully created class with ${sessionCount} scheduled sessions`);
            // Store session count for potential future use
            await context.query.Class.updateOne({
              where: { id: item.id },
              data: { 
                // This will trigger an update timestamp but won't affect functionality
                updatedAt: new Date().toISOString()
              }
            });
          }
        } catch (error) {
          console.error('Error generating sessions:', error);
          // Don't throw - allow class creation to succeed even if session generation fails
        }
      },
    },
    validateDelete: async ({ item, context, addValidationError }) => {
      // Check if class has sessions and enrollments
      const [sessions, enrollments] = await Promise.all([
        context.query.ClassSession.count({
          where: { class: { id: { equals: item.id } } }
        }),
        context.query.Enrollment.count({
          where: { class: { id: { equals: item.id } } }
        })
      ]);
      
      const warnings = [];
      if (sessions > 0) {
        warnings.push(`${sessions} scheduled session${sessions === 1 ? '' : 's'}`);
      }
      if (enrollments > 0) {
        warnings.push(`${enrollments} student enrollment${enrollments === 1 ? '' : 's'}`);
      }
      
      if (warnings.length > 0) {
        addValidationError(
          `WARNING: Deleting this class will also delete ${warnings.join(' and ')}. This action cannot be undone. Click delete again to confirm.`
        );
      }
    },
    beforeOperation: {
      delete: async ({ item, context }) => {
        // Delete all sessions and enrollments for this class before deleting the class
        console.log(`Deleting class ${item.id} and its related data...`);
        
        // Get sessions and enrollments
        const [sessions, enrollments] = await Promise.all([
          context.query.ClassSession.findMany({
            where: { class: { id: { equals: item.id } } },
            query: 'id'
          }),
          context.query.Enrollment.findMany({
            where: { class: { id: { equals: item.id } } },
            query: 'id'
          })
        ]);
        
        // Delete sessions
        if (sessions.length > 0) {
          console.log(`Deleting ${sessions.length} sessions...`);
          await context.query.ClassSession.deleteMany({
            where: sessions.map(s => ({ id: s.id }))
          });
        }
        
        // Delete enrollments
        if (enrollments.length > 0) {
          console.log(`Deleting ${enrollments.length} enrollments...`);
          await context.query.Enrollment.deleteMany({
            where: enrollments.map(e => ({ id: e.id }))
          });
        }
      },
    },
  },
});