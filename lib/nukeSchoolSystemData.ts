import { KeystoneContext } from '@keystone-6/core/types';

export async function nukeSchoolSystemData(
  source: any,
  { schoolSystemId }: { schoolSystemId: string },
  context: KeystoneContext
) {
  // Check if user is a superAdmin
  if (!context.session?.data?.roles?.includes('superAdmin')) {
    throw new Error('Only superAdmins can perform this operation');
  }

  try {
    console.log(`Starting data nuke for school system: ${schoolSystemId}`);

    // Use Prisma directly for more complex queries
    const prisma = context.prisma;

    // Wrap everything in a transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // First, let's clean up any orphaned data
      console.log('Cleaning up orphaned data...');
      
      // Delete orphaned attendance records (no valid enrollment)
      const orphanedAttendance = await tx.attendanceRecord.deleteMany({
        where: {
          OR: [
            { enrollmentId: null },
            { enrollment: null }
          ]
        }
      });
      if (orphanedAttendance.count > 0) {
        console.log(`Deleted ${orphanedAttendance.count} orphaned attendance records`);
      }

      // Delete orphaned enrollments (no valid class)
      const orphanedEnrollments = await tx.enrollment.deleteMany({
        where: {
          OR: [
            { classId: null },
            { class: null }
          ]
        }
      });
      if (orphanedEnrollments.count > 0) {
        console.log(`Deleted ${orphanedEnrollments.count} orphaned enrollments`);
      }

      // Delete orphaned class sessions (no valid class)
      const orphanedSessions = await tx.classSession.deleteMany({
        where: {
          OR: [
            { classId: null },
            { class: null }
          ]
        }
      });
      if (orphanedSessions.count > 0) {
        console.log(`Deleted ${orphanedSessions.count} orphaned class sessions`);
      }

      // Delete orphaned classes (no valid school)
      const orphanedClasses = await tx.class.deleteMany({
        where: {
          OR: [
            { schoolId: null },
            { school: null }
          ]
        }
      });
      if (orphanedClasses.count > 0) {
        console.log(`Deleted ${orphanedClasses.count} orphaned classes`);
      }

      // Now proceed with the main deletion
      console.log('Deleting data for school system...');
      
      // Delete in correct order to respect foreign key constraints
      
      // 1. Delete attendance records FIRST (references ClassSession and Enrollment)
      const attendanceCount = await tx.attendanceRecord.deleteMany({
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
      console.log(`Deleted ${attendanceCount.count} attendance records`);

      // 2. Delete enrollments (references Class and Student)
      const enrollmentCount = await tx.enrollment.deleteMany({
        where: {
          class: {
            school: {
              schoolSystemId: schoolSystemId
            }
          }
        }
      });
      console.log(`Deleted ${enrollmentCount.count} enrollments`);

      // 3. Delete class sessions (references Class)
      const sessionCount = await tx.classSession.deleteMany({
        where: {
          class: {
            school: {
              schoolSystemId: schoolSystemId
            }
          }
        }
      });
      console.log(`Deleted ${sessionCount.count} class sessions`);

      // 4. Delete classes LAST (after sessions and enrollments are gone)
      const classCount = await tx.class.deleteMany({
        where: {
          school: {
            schoolSystemId: schoolSystemId
          }
        }
      });
      console.log(`Deleted ${classCount.count} classes`);

      // 5. Delete students
      const studentCount = await tx.student.deleteMany({
        where: {
          schoolSystemId: schoolSystemId
        }
      });
      console.log(`Deleted ${studentCount.count} students`);

      // 6. Delete courses
      const courseCount = await tx.course.deleteMany({
        where: {
          schoolSystemId: schoolSystemId
        }
      });
      console.log(`Deleted ${courseCount.count} courses`);

      // 7. Delete holidays
      const holidayCount = await tx.holiday.deleteMany({
        where: {
          semester: {
            schoolSystemId: schoolSystemId
          }
        }
      });
      console.log(`Deleted ${holidayCount.count} holidays`);

      // 8. Delete semesters
      const semesterCount = await tx.semester.deleteMany({
        where: {
          schoolSystemId: schoolSystemId
        }
      });
      console.log(`Deleted ${semesterCount.count} semesters`);

      // 9. Delete schools
      const schoolCount = await tx.school.deleteMany({
        where: {
          schoolSystemId: schoolSystemId
        }
      });
      console.log(`Deleted ${schoolCount.count} schools`);

      // 10. Delete non-superAdmin users from this school system
      const userCount = await tx.user.deleteMany({
        where: {
          AND: [
            { schoolSystemId: schoolSystemId },
            { 
              NOT: {
                roles: 'superAdmin'
              }
            }
          ]
        }
      });
      console.log(`Deleted ${userCount.count} non-superAdmin users`);

      return {
        attendanceCount: attendanceCount.count,
        enrollmentCount: enrollmentCount.count,
        sessionCount: sessionCount.count,
        classCount: classCount.count,
        studentCount: studentCount.count,
        courseCount: courseCount.count,
        holidayCount: holidayCount.count,
        semesterCount: semesterCount.count,
        schoolCount: schoolCount.count,
        userCount: userCount.count
      };
    });

    console.log(`Data nuke completed for school system: ${schoolSystemId}`);
    console.log('Deletion summary:', result);

    return {
      success: true,
      message: 'All data successfully deleted for the selected school system'
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error during data nuke:', error);
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
}