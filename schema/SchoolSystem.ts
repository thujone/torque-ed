import { list } from '@keystone-6/core';
import { text, relationship, timestamp, json } from '@keystone-6/core/fields';

export const SchoolSystem = list({
  access: {
    filter: {
      query: ({ session }) => {
        // Super admins see all, others see only their school system
        if (session?.data?.roles?.includes('superAdmin')) return true;
        return { id: { equals: session?.data?.schoolSystemId } };
      },
    },
    operation: {
      query: ({ session }) => {
        return !!session?.data; // Allow queries for authenticated users
      },
      create: ({ session }) => {
        // Only super admins can create school systems
        return !!session?.data?.roles?.includes('superAdmin');
      },
      update: ({ session }) => {
        // Only super admins can update school systems
        return !!session?.data?.roles?.includes('superAdmin');
      },
      delete: ({ session }) => {
        // Only super admins can delete school systems
        return !!session?.data?.roles?.includes('superAdmin');
      },
    },
  },
  fields: {
    name: text({ 
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),
    subdomain: text({
      isIndexed: 'unique',
      ui: {
        description: 'Subdomain for future multi-tenant URLs (e.g., "district1" for district1.torqueed.com)',
      },
    }),
    settings: json({
      ui: {
        views: './admin/components/JSONField',
        description: 'System-wide configuration settings',
      },
      defaultValue: {
        attendanceGracePeriod: 30, // minutes before class
        defaultClassDuration: 90, // minutes
        minimumAttendancePercentage: 70,
      },
    }),
    
    // Relationships
    users: relationship({ 
      ref: 'User.schoolSystem',
      many: true,
    }),
    schools: relationship({ 
      ref: 'School.schoolSystem',
      many: true,
    }),
    courses: relationship({ 
      ref: 'Course.schoolSystem',
      many: true,
    }),
    semesters: relationship({ 
      ref: 'Semester.schoolSystem',
      many: true,
    }),
    students: relationship({ 
      ref: 'Student.schoolSystem',
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
      initialColumns: ['name', 'subdomain', 'createdAt'],
    },
    labelField: 'name',
  },
});