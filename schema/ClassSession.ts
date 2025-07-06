import { list } from '@keystone-6/core';
import { relationship, timestamp, select, text, checkbox, calendarDay } from '@keystone-6/core/fields';

export const ClassSession = list({
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
               session?.data?.roles?.includes('admin');
      },
      update: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin') || 
               session?.data?.roles?.includes('admin') ||
               session?.data?.roles?.includes('instructor') ||
               session?.data?.roles?.includes('ta');
      },
      delete: ({ session }) => {
        return session?.data?.roles?.includes('superAdmin') ||
               session?.data?.roles?.includes('admin');
      },
    },
  },
  fields: {
    scheduledDate: calendarDay({ 
      validation: { isRequired: true },
    }),
    dayOfWeek: text({
      ui: {
        description: 'Day of the week (e.g., Monday, Tuesday)',
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    courseNumber: text({
      ui: {
        description: 'Course code (e.g., AUTO-302)',
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    scheduledStartTime: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'Start time in HH:MM format (e.g., 08:00)',
      },
    }),
    scheduledEndTime: text({ 
      validation: { isRequired: true },
      ui: {
        description: 'End time (auto-calculated based on session length)',
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
      },
    }),
    actualDate: calendarDay({
      ui: {
        description: 'Actual date if rescheduled',
      },
    }),
    sessionType: select({
      type: 'enum',
      options: [
        { label: 'Regular', value: 'regular' },
        { label: 'Midterm', value: 'midterm' },
        { label: 'Final', value: 'final' },
        { label: 'Lab', value: 'lab' }, // Future use
      ],
      defaultValue: 'regular',
      validation: { isRequired: true },
      ui: {
        description: 'Type of class session',
      },
    }),
    status: select({
      type: 'enum',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'scheduled',
      validation: { isRequired: true },
    }),
    isMidterm: checkbox({
      defaultValue: false,
      ui: {
        description: 'Is this a midterm exam meeting?',
      },
    }),
    isFinal: checkbox({
      defaultValue: false,
      ui: {
        description: 'Is this a final exam meeting?',
      },
    }),
    room: text({
      ui: {
        description: 'Room for this specific meeting (overrides class default)',
      },
    }),
    
    // Relationships
    class: relationship({ 
      ref: 'Class.sessions',
      ui: {
        displayMode: 'select',
        labelField: 'section',
        hideCreate: true,
      },
    }),
    attendanceRecords: relationship({ 
      ref: 'AttendanceRecord.classSession',
      many: true,
      ui: {
        linkToItem: false,
        hideCreate: true,
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
      initialColumns: ['courseNumber', 'class', 'scheduledDate', 'dayOfWeek', 'sessionType', 'scheduledStartTime', 'status'],
    },
    labelField: 'scheduledDate',
    description: '⏰ Classes & Scheduling - Individual class meetings (Generated automatically)',
    hideCreate: true,
    hideDelete: true,
  },
  hooks: {
    validateInput: async ({ resolvedData, addValidationError }) => {
      // Require class
      if (!resolvedData.class?.connect?.id) {
        addValidationError('Class is required');
      }
    },
    resolveInput: {
      create: async ({ resolvedData, context }) => {
        // Auto-populate day of week when creating
        if (resolvedData.scheduledDate) {
          const date = new Date(resolvedData.scheduledDate);
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          resolvedData.dayOfWeek = days[date.getDay()];
        }

        // Auto-populate course number when creating
        if (resolvedData.class?.connect?.id) {
          const classData = await context.query.Class.findOne({
            where: { id: resolvedData.class.connect.id },
            query: 'course { code }'
          });
          if (classData?.course?.code) {
            resolvedData.courseNumber = classData.course.code;
          }
        }
        
        return resolvedData;
      },
      update: async ({ resolvedData, context, item }) => {
        // Update day of week if date changes
        if (resolvedData.scheduledDate) {
          const date = new Date(resolvedData.scheduledDate);
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          resolvedData.dayOfWeek = days[date.getDay()];
        }
        
        // Auto-calculate end time if start time changes
        if (resolvedData.scheduledStartTime) {
          // Get the class to find the normal session duration
          const classData = await context.query.Class.findOne({
            where: { id: String(item.classId) },
            query: 'schedule'
          });
          
          if (classData?.schedule?.startTime && classData?.schedule?.endTime) {
            const startTime = classData.schedule.startTime;
            const endTime = classData.schedule.endTime;
            
            // Calculate duration in minutes
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
            
            // Apply same duration to new start time
            const [newStartHour, newStartMin] = resolvedData.scheduledStartTime.split(':').map(Number);
            const newEndMinutes = (newStartHour * 60 + newStartMin) + durationMinutes;
            const newEndHour = Math.floor(newEndMinutes / 60);
            const newEndMin = newEndMinutes % 60;
            
            resolvedData.scheduledEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;
          }
        }
        
        return resolvedData;
      },
    },
  },
});