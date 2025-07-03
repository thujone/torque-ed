import React, { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { QRCodeDisplay } from '../components/QRCodeDisplay';

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
          classMeeting {
            id
          }
        }
      }
      meetings(orderBy: { scheduledDate: asc }) {
        id
        scheduledDate
        scheduledStartTime
        scheduledEndTime
        status
        isMidterm
        isFinal
      }
    }
  }
`;

const UPDATE_ATTENDANCE = gql`
  mutation UpdateAttendance($enrollmentId: ID!, $classMeetingId: ID!, $status: AttendanceRecordStatusType!) {
    updateAttendanceRecord(
      where: { enrollment: { id: { equals: $enrollmentId } }, classMeeting: { id: { equals: $classMeetingId } } }
      data: { status: $status }
    ) {
      id
      status
    }
  }
`;

const CREATE_ATTENDANCE = gql`
  mutation CreateAttendance($data: AttendanceRecordCreateInput!) {
    createAttendanceRecord(data: $data) {
      id
      status
    }
  }
`;

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showQRCodes, setShowQRCodes] = useState(false);
  
  const { data: classesData, loading: classesLoading } = useQuery(GET_CLASSES);
  const { data: attendanceData, loading: attendanceLoading, refetch } = useQuery(GET_ATTENDANCE_DATA, {
    variables: { classId: selectedClassId },
    skip: !selectedClassId,
  });
  
  const [updateAttendance] = useMutation(UPDATE_ATTENDANCE);
  const [createAttendance] = useMutation(CREATE_ATTENDANCE);

  const handleAttendanceChange = async (enrollmentId: string, meetingId: string, newStatus: string) => {
    try {
      // First, check if record exists
      const enrollment = attendanceData?.class?.enrollments?.find((e: any) => e.id === enrollmentId);
      const existingRecord = enrollment?.attendanceRecords?.find((r: any) => r.classMeeting.id === meetingId);
      
      if (existingRecord) {
        await updateAttendance({
          variables: {
            enrollmentId,
            classMeetingId: meetingId,
            status: newStatus,
          },
        });
      } else {
        await createAttendance({
          variables: {
            data: {
              enrollment: { connect: { id: enrollmentId } },
              classMeeting: { connect: { id: meetingId } },
              status: newStatus,
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

  const getAttendanceStatus = (enrollment: any, meetingId: string) => {
    const record = enrollment.attendanceRecords?.find((r: any) => r.classMeeting.id === meetingId);
    return record?.status || 'absent';
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
    <div>
      <h1>Attendance Management</h1>
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
                    {attendanceData.class.meetings.map((meeting: any) => (
                      <th key={meeting.id} style={{ 
                        padding: '8px', 
                        textAlign: 'center', 
                        borderBottom: '2px solid #e5e7eb',
                        minWidth: '80px',
                        backgroundColor: meeting.isMidterm ? '#fef3c7' : meeting.isFinal ? '#fecaca' : 'white'
                      }}>
                        <div>{formatDate(meeting.scheduledDate)}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          {meeting.isMidterm && 'Midterm'}
                          {meeting.isFinal && 'Final'}
                        </div>
                      </th>
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
                      {attendanceData.class.meetings.map((meeting: any) => {
                        const status = getAttendanceStatus(enrollment, meeting.id);
                        return (
                          <td key={meeting.id} style={{ 
                            padding: '4px', 
                            borderBottom: '1px solid #e5e7eb',
                            textAlign: 'center'
                          }}>
                            <select
                              value={status}
                              onChange={(e) => handleAttendanceChange(enrollment.id, meeting.id, e.target.value)}
                              style={{
                                padding: '4px',
                                fontSize: '12px',
                                backgroundColor: getStatusColor(status),
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                width: '70px'
                              }}
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="excused">Excused</option>
                            </select>
                          </td>
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
    </div>
  );
}