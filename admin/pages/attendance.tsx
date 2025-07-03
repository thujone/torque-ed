import React, { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { PageContainer } from '@keystone-6/core/admin-ui/components';
import { Heading } from '@keystone-ui/core';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { AttendanceScanner } from '../components/AttendanceScanner';

const GET_CLASSES = gql`
  query GetClasses($where: ClassWhereInput) {
    classes(where: $where) {
      id
      section
      course {
        code
        name
      }
      semester {
        id
        name
      }
      school {
        name
      }
    }
  }
`;

const GET_ATTENDANCE_DATA = gql`
  query GetAttendanceData($classId: ID!) {
    class(where: { id: $classId }) {
      id
      section
      course {
        code
        name
      }
      semester {
        name
        startDate
        endDate
      }
      enrollments {
        id
        student {
          id
          studentId
          firstName
          lastName
          qrCode
        }
        attendanceRecords {
          id
          status
          clockInTime
          clockOutTime
          sessionDuration
          classSession {
            id
          }
        }
      }
      sessions(orderBy: { scheduledDate: asc }) {
        id
        scheduledDate
        scheduledStartTime
        scheduledEndTime
        status
        sessionType
        isMidterm
        isFinal
      }
    }
  }
`;

const UPDATE_ATTENDANCE = gql`
  mutation UpdateAttendance($enrollmentId: ID!, $classSessionId: ID!, $data: AttendanceRecordUpdateInput!) {
    updateAttendanceRecord(
      where: { enrollment: { id: { equals: $enrollmentId } }, classSession: { id: { equals: $classSessionId } } }
      data: $data
    ) {
      id
      status
      clockInTime
      clockOutTime
      sessionDuration
    }
  }
`;

const CREATE_ATTENDANCE = gql`
  mutation CreateAttendance($data: AttendanceRecordCreateInput!) {
    createAttendanceRecord(data: $data) {
      id
      status
      clockInTime
      clockOutTime
      sessionDuration
    }
  }
`;

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const { data: classesData, loading: classesLoading } = useQuery(GET_CLASSES);
  const { data: attendanceData, loading: attendanceLoading, refetch } = useQuery(GET_ATTENDANCE_DATA, {
    variables: { classId: selectedClassId },
    skip: !selectedClassId,
  });
  
  const [updateAttendance] = useMutation(UPDATE_ATTENDANCE);
  const [createAttendance] = useMutation(CREATE_ATTENDANCE);

  const handleAttendanceChange = async (enrollmentId: string, sessionId: string, field: string, value: any) => {
    try {
      // First, check if record exists
      const enrollment = attendanceData?.class?.enrollments?.find((e: any) => e.id === enrollmentId);
      const existingRecord = enrollment?.attendanceRecords?.find((r: any) => r.classSession.id === sessionId);
      
      const updateData: any = { [field]: value };
      
      if (existingRecord) {
        await updateAttendance({
          variables: {
            enrollmentId,
            classSessionId: sessionId,
            data: updateData,
          },
        });
      } else {
        await createAttendance({
          variables: {
            data: {
              enrollment: { connect: { id: enrollmentId } },
              classSession: { connect: { id: sessionId } },
              status: 'present',
              ...updateData,
            },
          },
        });
      }
      
      // Refetch to update the UI
      refetch();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const getAttendanceRecord = (enrollment: any, sessionId: string) => {
    return enrollment.attendanceRecords?.find((r: any) => r.classSession?.id === sessionId) || null;
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'excused': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const classOptions = classesData?.classes?.map((cls: any) => ({
    label: `${cls.course.code} - ${cls.section} (${cls.semester.name})`,
    value: cls.id,
  })) || [];

  if (classesLoading) return <div>Loading classes...</div>;

  return (
    <PageContainer header={<Heading type="h3">Attendance Management</Heading>}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <select
            value={selectedClassId || ''}
            onChange={(e) => setSelectedClassId(e.target.value || null)}
            style={{
              padding: '8px',
              fontSize: '16px',
              width: '100%',
              maxWidth: '400px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <option value="">Select a class</option>
            {classOptions.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {selectedClassId && attendanceLoading && <div>Loading attendance data...</div>}
        
        {selectedClassId && attendanceData?.class && (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{attendanceData.class.course.code} - {attendanceData.class.course.name}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowScanner(!showScanner)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {showScanner ? 'Hide' : 'Show'} Scanner
                </button>
                <button
                  onClick={() => setShowQRCodes(!showQRCodes)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {showQRCodes ? 'Hide' : 'Show'} QR Codes
                </button>
              </div>
            </div>

            {showScanner && (
              <div style={{ marginBottom: '20px' }}>
                <AttendanceScanner onScanResult={() => refetch()} />
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '8px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #e5e7eb',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'white',
                      minWidth: '200px'
                    }}>
                      Student
                    </th>
                    {showQRCodes && (
                      <th style={{ 
                        padding: '8px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #e5e7eb',
                        minWidth: '80px'
                      }}>
                        QR Code
                      </th>
                    )}
                    {attendanceData.class.sessions.map((session: any) => (
                      <React.Fragment key={session.id}>
                        <th style={{ 
                          padding: '4px', 
                          textAlign: 'center', 
                          borderBottom: '2px solid #e5e7eb',
                          minWidth: '80px',
                          backgroundColor: session.sessionType === 'midterm' ? '#fef3c7' : 
                                         session.sessionType === 'final' ? '#fecaca' : 'white',
                          borderRight: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                            {formatDate(session.scheduledDate)}
                          </div>
                          <div style={{ fontSize: '8px', color: '#6b7280' }}>
                            {session.sessionType === 'midterm' && 'Midterm'}
                            {session.sessionType === 'final' && 'Final'}
                            {session.sessionType === 'lab' && 'Lab'}
                          </div>
                          <div style={{ fontSize: '9px', marginTop: '2px' }}>Clock In</div>
                        </th>
                        <th style={{ 
                          padding: '4px', 
                          textAlign: 'center', 
                          borderBottom: '2px solid #e5e7eb',
                          minWidth: '80px',
                          backgroundColor: session.sessionType === 'midterm' ? '#fef3c7' : 
                                         session.sessionType === 'final' ? '#fecaca' : 'white',
                          borderRight: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '9px', marginTop: '16px' }}>Clock Out</div>
                        </th>
                        <th style={{ 
                          padding: '4px', 
                          textAlign: 'center', 
                          borderBottom: '2px solid #e5e7eb',
                          minWidth: '60px',
                          backgroundColor: session.sessionType === 'midterm' ? '#fef3c7' : 
                                         session.sessionType === 'final' ? '#fecaca' : 'white',
                          borderRight: '2px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '9px', marginTop: '16px' }}>Duration</div>
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.class.enrollments.map((enrollment: any) => (
                    <tr key={enrollment.id}>
                      <td style={{ 
                        padding: '8px', 
                        borderBottom: '1px solid #e5e7eb',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'white'
                      }}>
                        {enrollment.student.lastName}, {enrollment.student.firstName}
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          ID: {enrollment.student.studentId}
                        </div>
                      </td>
                      {showQRCodes && (
                        <td style={{ 
                          padding: '8px', 
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'center'
                        }}>
                          <QRCodeDisplay value={enrollment.student.qrCode || enrollment.student.studentId} size={60} />
                        </td>
                      )}
                      {attendanceData.class.sessions.map((session: any) => {
                        const record = getAttendanceRecord(enrollment, session.id);
                        return (
                          <React.Fragment key={session.id}>
                            {/* Clock In Time */}
                            <td style={{ 
                              padding: '2px', 
                              borderBottom: '1px solid #e5e7eb',
                              borderRight: '1px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <input
                                type="datetime-local"
                                value={record?.clockInTime ? new Date(record.clockInTime).toISOString().slice(0, 16) : ''}
                                onChange={(e) => handleAttendanceChange(enrollment.id, session.id, 'clockInTime', e.target.value || null)}
                                style={{
                                  width: '75px',
                                  fontSize: '10px',
                                  padding: '2px',
                                  border: '1px solid #ccc',
                                  borderRadius: '2px'
                                }}
                              />
                            </td>
                            {/* Clock Out Time */}
                            <td style={{ 
                              padding: '2px', 
                              borderBottom: '1px solid #e5e7eb',
                              borderRight: '1px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <input
                                type="datetime-local"
                                value={record?.clockOutTime ? new Date(record.clockOutTime).toISOString().slice(0, 16) : ''}
                                onChange={(e) => handleAttendanceChange(enrollment.id, session.id, 'clockOutTime', e.target.value || null)}
                                style={{
                                  width: '75px',
                                  fontSize: '10px',
                                  padding: '2px',
                                  border: '1px solid #ccc',
                                  borderRadius: '2px'
                                }}
                              />
                            </td>
                            {/* Session Duration */}
                            <td style={{ 
                              padding: '2px', 
                              borderBottom: '1px solid #e5e7eb',
                              borderRight: '2px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <input
                                type="number"
                                value={record?.sessionDuration || ''}
                                onChange={(e) => handleAttendanceChange(enrollment.id, session.id, 'sessionDuration', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="mins"
                                style={{
                                  width: '50px',
                                  fontSize: '10px',
                                  padding: '2px',
                                  border: '1px solid #ccc',
                                  borderRadius: '2px'
                                }}
                              />
                              <div style={{ fontSize: '8px', color: '#6b7280' }}>
                                {formatDuration(record?.sessionDuration)}
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}