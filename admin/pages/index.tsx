import React, { useState } from 'react';
import { PageContainer } from '@keystone-6/core/admin-ui/components';
import { Heading } from '@keystone-ui/core';
import { gql, useQuery } from '@keystone-6/core/admin-ui/apollo';

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    authenticatedItem {
      ... on User {
        id
        firstName
        lastName
        roles
        schoolSystem {
          id
          name
        }
      }
    }
  }
`;

const GET_SCHOOL_SYSTEMS = gql`
  query GetSchoolSystems {
    schoolSystems {
      id
      name
    }
  }
`;


export default function GroupedDashboard() {
  const [showNukeDialog, setShowNukeDialog] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [selectedSchoolSystemId, setSelectedSchoolSystemId] = useState('');
  const [isNuking, setIsNuking] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const { data: currentUser } = useQuery(GET_CURRENT_USER);
  const { data: schoolSystemsData } = useQuery(GET_SCHOOL_SYSTEMS);

  const isSuperAdmin = currentUser?.authenticatedItem?.roles?.includes('superAdmin');
  const schoolSystems = schoolSystemsData?.schoolSystems || [];

  const handleNukeClick = () => {
    if (schoolSystems.length > 0) {
      setSelectedSchoolSystemId(schoolSystems[0].id);
      setShowNukeDialog(true);
    }
  };

  const handleSeedClick = () => {
    setShowSeedDialog(true);
  };

  const handleNukeConfirm = async () => {
    if (!selectedSchoolSystemId) return;
    
    setIsNuking(true);
    try {
      const response = await fetch('/api/nuke-school-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolSystemId: selectedSchoolSystemId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Data successfully cleared for the selected school system.');
        window.location.reload(); // Refresh the page
      } else {
        alert('Error: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error clearing data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsNuking(false);
      setShowNukeDialog(false);
    }
  };

  const handleSeedConfirm = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Sample data successfully created.');
        window.location.reload(); // Refresh the page
      } else {
        alert('Error: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error seeding data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSeeding(false);
      setShowSeedDialog(false);
    }
  };

  const groups = [
    {
      title: '🏛️ Academic Structure',
      description: 'Manage schools, courses, and academic periods',
      lists: [
        { key: 'school-systems', label: 'School Systems', description: 'School districts and systems' },
        { key: 'schools', label: 'Schools', description: 'Individual schools' },
        { key: 'courses', label: 'Courses', description: 'Course catalog' },
        { key: 'semesters', label: 'Semesters', description: 'Academic terms' },
        { key: 'holidays', label: 'Holidays', description: 'Holidays and breaks' },
      ]
    },
    {
      title: '📋 Classes & Scheduling',
      description: 'Manage class sections and sessions',
      lists: [
        { key: 'classes', label: 'Classes', description: 'Class sections' },
        { key: 'class-sessions', label: 'Class Sessions', description: 'Individual class meetings' },
      ]
    },
    {
      title: '👥 People',
      description: 'Manage users and students',
      lists: [
        { key: 'users', label: 'Users', description: 'All users (admins, instructors, TAs)' },
        { key: 'students', label: 'Students', description: 'Student records' },
      ]
    },
    {
      title: '📝 Academic Records',
      description: 'Track enrollments and attendance',
      lists: [
        { key: 'enrollments', label: 'Enrollments', description: 'Student enrollments' },
        { key: 'attendance-records', label: 'Attendance Records', description: 'Attendance tracking' },
      ]
    }
  ];

  const worksheets = [
    { path: '/attendance', label: 'Attendance Sheets', description: 'Spreadsheet view for attendance management' }
  ];

  return (
    <PageContainer header={<Heading type="h3">TorqueEd Dashboard</Heading>}>
      <div style={{ padding: '0.5rem' }}>
        <p style={{ color: '#6B7280', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          Automotive Education Management System
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {groups.map((group) => (
            <div
              key={group.title}
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.75rem',
              }}
            >
              <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                {group.title}
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                {group.description}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {group.lists.map((list) => (
                  <a
                    key={list.key}
                    href={`/${list.key}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '0.1rem', fontSize: '0.9rem' }}>
                        {list.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {list.description}
                      </div>
                    </div>
                    <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Worksheets Section */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          padding: '0.75rem'
        }}>
          <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>
            📊 Worksheets
          </h3>
          <p style={{ color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            Interactive tools for daily operations
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {worksheets.map((worksheet) => (
              <a
                key={worksheet.path}
                href={worksheet.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: 'white',
                  border: '1px solid #0ea5e9',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#0ea5e9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '0.1rem', fontSize: '0.9rem' }}>
                    {worksheet.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {worksheet.description}
                  </div>
                </div>
                <span style={{ color: '#0ea5e9', fontSize: '0.875rem' }}>→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Tools Section - Only for SuperAdmins */}
        {isSuperAdmin && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '0.75rem',
            marginTop: '0.75rem'
          }}>
            <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem', color: '#dc2626' }}>
              🔧 Tools
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              Administrative operations for system management
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSeedClick}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#047857';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#059669';
                }}
              >
                🌱 Seed Data
              </button>
              <button
                onClick={handleNukeClick}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                🗑️ Nuke Data
              </button>
            </div>
          </div>
        )}

        {/* Nuke Confirmation Dialog */}
        {showNukeDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>
                ⚠️ Confirm Data Deletion
              </h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                This will permanently delete ALL data for the selected school system including:
                schools, courses, classes, sessions, students, enrollments, attendance records, 
                and non-superadmin users.
              </p>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                ✅ Preserved: All school systems and superadmin users will NOT be deleted.
              </p>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#dc2626' }}>
                ⚠️ This action cannot be undone!
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Select School System:
                </label>
                <select
                  value={selectedSchoolSystemId}
                  onChange={(e) => setSelectedSchoolSystemId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                >
                  {schoolSystems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowNukeDialog(false)}
                  disabled={isNuking}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: isNuking ? 'not-allowed' : 'pointer',
                    opacity: isNuking ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNukeConfirm}
                  disabled={isNuking || !selectedSchoolSystemId}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: (isNuking || !selectedSchoolSystemId) ? 'not-allowed' : 'pointer',
                    opacity: (isNuking || !selectedSchoolSystemId) ? 0.5 : 1
                  }}
                >
                  {isNuking ? 'Deleting...' : 'Yes, Delete All Data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seed Confirmation Dialog */}
        {showSeedDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#059669', marginBottom: '1rem' }}>
                🌱 Confirm Sample Data Creation
              </h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                This will create sample data including:
                San Diego Community College District, San Diego Miramar College, 
                Spring 2026 semester, holidays, and sample automotive courses.
              </p>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                ✅ Safe Operation: This will not overwrite existing data.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowSeedDialog(false)}
                  disabled={isSeeding}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: isSeeding ? 'not-allowed' : 'pointer',
                    opacity: isSeeding ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSeedConfirm}
                  disabled={isSeeding}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: isSeeding ? 'not-allowed' : 'pointer',
                    opacity: isSeeding ? 0.5 : 1
                  }}
                >
                  {isSeeding ? 'Creating...' : 'Yes, Create Sample Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}