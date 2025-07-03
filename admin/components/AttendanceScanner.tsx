import React, { useState, useRef, useEffect } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

const GET_STUDENT_BY_QR = gql`
  query GetStudentByQR($qrCode: String!) {
    students(where: { qrCode: { equals: $qrCode } }) {
      id
      studentId
      firstName
      lastName
      enrollments {
        id
        class {
          id
          course {
            code
          }
          sessions(where: { status: { equals: scheduled } }, orderBy: { scheduledDate: asc }) {
            id
            scheduledDate
            scheduledStartTime
            scheduledEndTime
          }
        }
        attendanceRecords {
          id
          clockInTime
          clockOutTime
          classSession {
            id
          }
        }
      }
    }
  }
`;

const UPDATE_ATTENDANCE_CLOCK = gql`
  mutation UpdateAttendanceClock($enrollmentId: ID!, $classSessionId: ID!, $data: AttendanceRecordUpdateInput!) {
    updateAttendanceRecord(
      where: { enrollment: { id: { equals: $enrollmentId } }, classSession: { id: { equals: $classSessionId } } }
      data: $data
    ) {
      id
      clockInTime
      clockOutTime
      sessionDuration
    }
  }
`;

const CREATE_ATTENDANCE_CLOCK = gql`
  mutation CreateAttendanceClock($data: AttendanceRecordCreateInput!) {
    createAttendanceRecord(data: $data) {
      id
      clockInTime
      clockOutTime
      sessionDuration
    }
  }
`;

interface AttendanceScannerProps {
  onScanResult?: (result: string) => void;
}

export const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ onScanResult }) => {
  const [scannedCode, setScannedCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: studentData, loading } = useQuery(GET_STUDENT_BY_QR, {
    variables: { qrCode: scannedCode },
    skip: !scannedCode,
  });

  const [updateAttendance] = useMutation(UPDATE_ATTENDANCE_CLOCK);
  const [createAttendance] = useMutation(CREATE_ATTENDANCE_CLOCK);

  const handleScan = async (qrCode: string) => {
    if (!qrCode || isProcessing) return;
    
    setIsProcessing(true);
    setScannedCode(qrCode);
    
    try {
      // The query will automatically fetch student data when scannedCode changes
      // We'll process the attendance in useEffect when data arrives
    } catch (error) {
      console.error('Error processing scan:', error);
      setLastResult('Error processing scan');
    }
  };

  useEffect(() => {
    if (studentData?.students?.[0] && !loading && scannedCode) {
      processAttendance();
    }
  }, [studentData, loading, scannedCode]);

  const processAttendance = async () => {
    const student = studentData.students[0];
    if (!student) {
      setLastResult('Student not found');
      setIsProcessing(false);
      return;
    }

    // Find today's sessions for all enrolled classes
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let processedAny = false;

    for (const enrollment of student.enrollments) {
      const todaysSession = enrollment.class.sessions.find((session: any) => 
        session.scheduledDate === todayStr
      );

      if (todaysSession) {
        // Check if there's an existing attendance record
        const existingRecord = enrollment.attendanceRecords.find((record: any) => 
          record.classSession.id === todaysSession.id
        );

        const now = new Date().toISOString();

        if (existingRecord) {
          // If clock-in exists but no clock-out, clock them out
          if (existingRecord.clockInTime && !existingRecord.clockOutTime) {
            await updateAttendance({
              variables: {
                enrollmentId: enrollment.id,
                classSessionId: todaysSession.id,
                data: { clockOutTime: now }
              }
            });
            setLastResult(`${student.firstName} ${student.lastName} clocked OUT of ${enrollment.class.course.code}`);
            processedAny = true;
          } else if (existingRecord.clockInTime && existingRecord.clockOutTime) {
            // Already clocked in and out
            setLastResult(`${student.firstName} ${student.lastName} already completed attendance for ${enrollment.class.course.code}`);
            processedAny = true;
          }
        } else {
          // No record exists, clock them in
          await createAttendance({
            variables: {
              data: {
                enrollment: { connect: { id: enrollment.id } },
                classSession: { connect: { id: todaysSession.id } },
                status: 'present',
                clockInTime: now
              }
            }
          });
          setLastResult(`${student.firstName} ${student.lastName} clocked IN to ${enrollment.class.course.code}`);
          processedAny = true;
        }
      }
    }

    if (!processedAny) {
      setLastResult(`No scheduled sessions today for ${student.firstName} ${student.lastName}`);
    }

    setIsProcessing(false);
    setScannedCode('');
    
    // Clear the input and focus it for next scan
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }

    if (onScanResult) {
      onScanResult(lastResult);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const value = (e.target as HTMLInputElement).value.trim();
      if (value) {
        handleScan(value);
      }
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #3b82f6', 
      borderRadius: '8px', 
      backgroundColor: '#f8fafc' 
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Attendance Scanner</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Scan QR code or enter student ID"
          onKeyPress={handleKeyPress}
          autoFocus
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #d1d5db',
            borderRadius: '6px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ 
        minHeight: '50px', 
        padding: '12px', 
        backgroundColor: lastResult.includes('Error') ? '#fef2f2' : '#f0f9ff',
        borderRadius: '6px',
        border: `1px solid ${lastResult.includes('Error') ? '#fca5a5' : '#93c5fd'}`
      }}>
        {isProcessing ? (
          <div style={{ color: '#6b7280' }}>Processing...</div>
        ) : (
          <div style={{ 
            color: lastResult.includes('Error') ? '#dc2626' : '#1f2937',
            fontWeight: '500'
          }}>
            {lastResult || 'Ready to scan...'}
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
        <strong>Instructions:</strong>
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          <li>First scan clocks student IN</li>
          <li>Second scan clocks student OUT</li>
          <li>Session duration is automatically calculated</li>
        </ul>
      </div>
    </div>
  );
};