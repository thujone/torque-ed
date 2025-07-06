import React from 'react';
import type { AdminConfig } from '@keystone-6/core/types';
import { NavigationContainer, ListNavItems, NavItem } from '@keystone-6/core/admin-ui/components';
import type { NavigationProps } from '@keystone-6/core/admin-ui/components';
import { Heading } from '@keystone-ui/core';

function CustomLogo() {
  return <h3>TorqueEd 0.1</h3>;
}


function CustomNavigation({ lists, authenticatedItem }: NavigationProps) {
  // Group lists by category
  const academicStructure = ['SchoolSystem', 'School', 'Semester', 'Holiday'];
  const classesScheduling = ['Course', 'Class', 'ClassSession'];
  const people = ['User', 'Student'];
  const academicRecords = ['Enrollment', 'AttendanceRecord'];
  
  const renderListGroup = (title: string, listKeys: string[]) => {
    const groupLists = listKeys
      .map(key => lists.find(list => list.key === key))
      .filter(Boolean);
    
    if (groupLists.length === 0) return null;
    
    return (
      <div key={title} style={{ marginBottom: '0.25rem' }}>
        <div style={{ 
          fontSize: '0.7rem', 
          fontWeight: '600', 
          color: '#6B7280', 
          marginBottom: '0.15rem',
          marginLeft: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </div>
        <ListNavItems lists={groupLists} />
      </div>
    );
  };
  
  return (
    <>
      <style>{`
        /* Reduce font size for navigation links only, not headers */
        .keystone-ui ul li a {
          font-size: 0.8rem !important;
        }
        /* Keep dashboard and worksheet links at normal size */
        .keystone-ui > a,
        .keystone-ui > div > a {
          font-size: 0.875rem !important;
        }
      `}</style>
      <NavigationContainer authenticatedItem={authenticatedItem}>
        <NavItem href="/dashboard">📋 Dashboard</NavItem>
        
        {renderListGroup('Academic Structure', academicStructure)}
        {renderListGroup('Classes & Scheduling', classesScheduling)}
        {renderListGroup('People', people)}
        {renderListGroup('Academic Records', academicRecords)}
        
        <div style={{ marginBottom: '0.25rem' }}>
          <div style={{ 
            fontSize: '0.7rem', 
            fontWeight: '600', 
            color: '#6B7280', 
            marginBottom: '0.15rem',
            marginLeft: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Worksheets
          </div>
          <NavItem href="/attendance">📊 Attendance Sheets</NavItem>
        </div>
      </NavigationContainer>
    </>
  );
}

export const components: AdminConfig['components'] = {
  Logo: CustomLogo,
  Navigation: CustomNavigation,
};