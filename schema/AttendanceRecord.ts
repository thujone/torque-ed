import { list } from '@keystone-6/core';
import { relationship, timestamp, select, text, virtual, integer } from '@keystone-6/core/fields';

export const AttendanceRecord = list({
  access: {
    filter: {
      query: ({ session }) => {
        if (session?.data?.roles?.includes('superAdmin')) return true;
        if (session?.data?.roles?.includes('admin')) {
          return { 
            enrollment: { 
              class: { 
                school: { 
                  schoolSystem: { id: { equals: session?.data?.schoolSystemId } } 
                } 
              } 
            } 
          };
        }
        if (session?.data?.roles?.includes('instructor')) {
          return { 
            enrollment: {
              class: { 
                OR: [
                  { instructor: { id: { equals: session?.data?.id } } },
                  { teachingAssistants: { some: { id: { equals: session?.data?.id } } } }
                ]
              }
            }
          };
        }
        if (session?.data?.roles?.includes('ta')) {
          return { 
            enrollment: {
              class: { teachingAssistants: { some: { id: { equals: session?.data?.id } } } }
            }
          };
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
               session?.data?.roles?.includes('instructor') ||
               session?.data?.roles?.includes('ta');
      },
      update: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin') || 
               session?.data?.roles?.includes('admin') ||
               session?.data?.roles?.includes('instructor') ||
               session?.data?.roles?.includes('ta');
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
        { label: 'Present', value: 'present' },
        { label: 'Absent', value: 'absent' },
        { label: 'Excused', value: 'excused' },
      ],
      defaultValue: 'present',
      validation: { isRequired: true },
    }),
    clockInTime: timestamp({
      ui: {
        description: 'When student clocked in to session',
      },
    }),
    clockOutTime: timestamp({
      ui: {
        description: 'When student clocked out of session',
      },
    }),
    sessionDuration: integer({
      ui: {
        description: 'Session duration in minutes (auto-calculated)',
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    markedAt: timestamp({
      defaultValue: { kind: 'now' },
      ui: {
        description: 'When attendance was first marked',
      },
    }),
    notes: text({
      ui: {
        displayMode: 'textarea',
        description: 'Optional notes about this attendance record',
      },
    }),
    
    // Relationships
    enrollment: relationship({ 
      ref: 'Enrollment.attendanceRecords',
      ui: {
        displayMode: 'select',
        // Note: We'll need to create a custom label for this
      },
    }),
    classSession: relationship({ 
      ref: 'ClassSession.attendanceRecords',
      ui: {
        displayMode: 'select',
        labelField: 'scheduledDate',
      },
    }),
    markedBy: relationship({ 
      ref: 'User',
      ui: {
        displayMode: 'select',
        labelField: 'email',
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
      initialColumns: ['enrollment', 'classSession', 'status', 'clockInTime', 'clockOutTime', 'sessionDuration'],
    },
    description: 'Individual attendance records. For a spreadsheet view, use the Attendance Spreadsheet page in the navigation menu.',
  },
  hooks: {
    resolveInput: {
      create: ({ resolvedData, context }) => {
        // Set markedBy to current user
        if (context.session?.data?.id && !resolvedData.markedBy) {
          resolvedData.markedBy = { connect: { id: context.session.data.id } };
        }
        
        // Calculate session duration if both clock times are provided
        if (resolvedData.clockInTime && resolvedData.clockOutTime) {
          const clockIn = new Date(resolvedData.clockInTime);
          const clockOut = new Date(resolvedData.clockOutTime);
          const durationMs = clockOut.getTime() - clockIn.getTime();
          resolvedData.sessionDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        }
        
        return resolvedData;
      },
      update: ({ resolvedData }) => {
        // Recalculate session duration if clock times change
        if (resolvedData.clockInTime && resolvedData.clockOutTime) {
          const clockIn = new Date(resolvedData.clockInTime);
          const clockOut = new Date(resolvedData.clockOutTime);
          const durationMs = clockOut.getTime() - clockIn.getTime();
          resolvedData.sessionDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        } else if (resolvedData.clockInTime === null || resolvedData.clockOutTime === null) {
          // Clear duration if either time is removed
          resolvedData.sessionDuration = null;
        }
        
        return resolvedData;
      },
    },
  },
});