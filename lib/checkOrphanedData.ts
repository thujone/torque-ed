import { KeystoneContext } from '@keystone-6/core/types';

export async function checkOrphanedData(
  schoolSystemId: string,
  context: KeystoneContext
) {
  const prisma = context.prisma;
  
  // Check for classes without schools
  const orphanedClasses = await prisma.class.findMany({
    where: {
      OR: [
        { schoolId: null },
        { school: null }
      ]
    },
    select: {
      id: true,
      section: true,
      schoolId: true
    }
  });

  // Check for class sessions without valid class relationships
  const orphanedSessions = await prisma.classSession.findMany({
    where: {
      OR: [
        { classId: null },
        { class: null }
      ]
    },
    select: {
      id: true,
      scheduledDate: true,
      classId: true
    }
  });

  // Check for enrollments without valid class relationships
  const orphanedEnrollments = await prisma.enrollment.findMany({
    where: {
      OR: [
        { classId: null },
        { class: null }
      ]
    },
    select: {
      id: true,
      classId: true,
      studentId: true
    }
  });

  // Check for attendance records without valid enrollment relationships
  const orphanedAttendance = await prisma.attendanceRecord.findMany({
    where: {
      OR: [
        { enrollmentId: null },
        { enrollment: null }
      ]
    },
    select: {
      id: true,
      enrollmentId: true,
      classSessionId: true
    }
  });

  // Also check for data that should have been deleted but wasn't
  // Classes that belong to schools in the target school system
  const classesInSystem = await prisma.class.count({
    where: {
      school: {
        schoolSystemId: schoolSystemId
      }
    }
  });

  // Sessions that belong to classes in the target school system
  const sessionsInSystem = await prisma.classSession.count({
    where: {
      class: {
        school: {
          schoolSystemId: schoolSystemId
        }
      }
    }
  });

  // Enrollments in classes that belong to the target school system
  const enrollmentsInSystem = await prisma.enrollment.count({
    where: {
      class: {
        school: {
          schoolSystemId: schoolSystemId
        }
      }
    }
  });

  // Attendance records for enrollments in the target school system
  const attendanceInSystem = await prisma.attendanceRecord.count({
    where: {
      enrollment: {
        class: {
          school: {
            schoolSystemId: schoolSystemId
          }
        }
      }
    }
  });

  return {
    orphaned: {
      classes: orphanedClasses,
      sessions: orphanedSessions,
      enrollments: orphanedEnrollments,
      attendance: orphanedAttendance
    },
    remainingInSystem: {
      classes: classesInSystem,
      sessions: sessionsInSystem,
      enrollments: enrollmentsInSystem,
      attendance: attendanceInSystem
    }
  };
}