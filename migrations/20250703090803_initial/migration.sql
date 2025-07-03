-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('superAdmin', 'admin', 'instructor', 'ta');

-- CreateEnum
CREATE TYPE "EnrollmentStatusType" AS ENUM ('enrolled', 'waitlisted', 'dropped');

-- CreateEnum
CREATE TYPE "ClassMeetingStatusType" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttendanceRecordStatusType" AS ENUM ('present', 'absent', 'excused');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "roles" "UserRoleType" DEFAULT 'instructor',
    "schoolSystem" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "subdomain" TEXT NOT NULL DEFAULT '',
    "settings" JSONB DEFAULT '{"attendanceGracePeriod":30,"defaultClassDuration":90,"minimumAttendancePercentage":70}',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "SchoolSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "schoolSystem" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "prerequisites" TEXT NOT NULL DEFAULT '',
    "schoolSystem" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "midtermStartDate" DATE,
    "midtermEndDate" DATE,
    "finalStartDate" DATE,
    "finalEndDate" DATE,
    "schoolSystem" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "semester" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT '',
    "maxEnrollment" INTEGER NOT NULL DEFAULT 30,
    "room" TEXT NOT NULL DEFAULT '',
    "schedule" JSONB DEFAULT '{"days":["M","W","F"],"startTime":"08:00","endTime":"09:30"}',
    "course" TEXT,
    "semester" TEXT,
    "school" TEXT,
    "instructor" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL DEFAULT '',
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "qrCode" TEXT NOT NULL DEFAULT '',
    "schoolSystem" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "status" "EnrollmentStatusType" NOT NULL DEFAULT 'enrolled',
    "waitlistPosition" INTEGER,
    "enrolledAt" TIMESTAMP(3),
    "droppedAt" TIMESTAMP(3),
    "student" TEXT,
    "class" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassMeeting" (
    "id" TEXT NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "scheduledStartTime" TEXT NOT NULL DEFAULT '',
    "scheduledEndTime" TEXT NOT NULL DEFAULT '',
    "actualDate" DATE,
    "status" "ClassMeetingStatusType" NOT NULL DEFAULT 'scheduled',
    "isMidterm" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "room" TEXT NOT NULL DEFAULT '',
    "class" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ClassMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "status" "AttendanceRecordStatusType" NOT NULL DEFAULT 'present',
    "markedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL DEFAULT '',
    "enrollment" TEXT,
    "classMeeting" TEXT,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_School_administrators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Class_teachingAssistants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_schoolSystem_idx" ON "User"("schoolSystem");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSystem_name_key" ON "SchoolSystem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSystem_subdomain_key" ON "SchoolSystem"("subdomain");

-- CreateIndex
CREATE INDEX "School_schoolSystem_idx" ON "School"("schoolSystem");

-- CreateIndex
CREATE INDEX "Course_schoolSystem_idx" ON "Course"("schoolSystem");

-- CreateIndex
CREATE INDEX "Semester_schoolSystem_idx" ON "Semester"("schoolSystem");

-- CreateIndex
CREATE INDEX "Holiday_semester_idx" ON "Holiday"("semester");

-- CreateIndex
CREATE INDEX "Class_course_idx" ON "Class"("course");

-- CreateIndex
CREATE INDEX "Class_semester_idx" ON "Class"("semester");

-- CreateIndex
CREATE INDEX "Class_school_idx" ON "Class"("school");

-- CreateIndex
CREATE INDEX "Class_instructor_idx" ON "Class"("instructor");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_qrCode_key" ON "Student"("qrCode");

-- CreateIndex
CREATE INDEX "Student_schoolSystem_idx" ON "Student"("schoolSystem");

-- CreateIndex
CREATE INDEX "Enrollment_student_idx" ON "Enrollment"("student");

-- CreateIndex
CREATE INDEX "Enrollment_class_idx" ON "Enrollment"("class");

-- CreateIndex
CREATE INDEX "ClassMeeting_class_idx" ON "ClassMeeting"("class");

-- CreateIndex
CREATE INDEX "AttendanceRecord_enrollment_idx" ON "AttendanceRecord"("enrollment");

-- CreateIndex
CREATE INDEX "AttendanceRecord_classMeeting_idx" ON "AttendanceRecord"("classMeeting");

-- CreateIndex
CREATE INDEX "AttendanceRecord_markedBy_idx" ON "AttendanceRecord"("markedBy");

-- CreateIndex
CREATE UNIQUE INDEX "_School_administrators_AB_unique" ON "_School_administrators"("A", "B");

-- CreateIndex
CREATE INDEX "_School_administrators_B_index" ON "_School_administrators"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Class_teachingAssistants_AB_unique" ON "_Class_teachingAssistants"("A", "B");

-- CreateIndex
CREATE INDEX "_Class_teachingAssistants_B_index" ON "_Class_teachingAssistants"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolSystem_fkey" FOREIGN KEY ("schoolSystem") REFERENCES "SchoolSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_schoolSystem_fkey" FOREIGN KEY ("schoolSystem") REFERENCES "SchoolSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolSystem_fkey" FOREIGN KEY ("schoolSystem") REFERENCES "SchoolSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_schoolSystem_fkey" FOREIGN KEY ("schoolSystem") REFERENCES "SchoolSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_semester_fkey" FOREIGN KEY ("semester") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_course_fkey" FOREIGN KEY ("course") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_semester_fkey" FOREIGN KEY ("semester") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_school_fkey" FOREIGN KEY ("school") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_instructor_fkey" FOREIGN KEY ("instructor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolSystem_fkey" FOREIGN KEY ("schoolSystem") REFERENCES "SchoolSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_student_fkey" FOREIGN KEY ("student") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_class_fkey" FOREIGN KEY ("class") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMeeting" ADD CONSTRAINT "ClassMeeting_class_fkey" FOREIGN KEY ("class") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_enrollment_fkey" FOREIGN KEY ("enrollment") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_classMeeting_fkey" FOREIGN KEY ("classMeeting") REFERENCES "ClassMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_School_administrators" ADD CONSTRAINT "_School_administrators_A_fkey" FOREIGN KEY ("A") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_School_administrators" ADD CONSTRAINT "_School_administrators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Class_teachingAssistants" ADD CONSTRAINT "_Class_teachingAssistants_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Class_teachingAssistants" ADD CONSTRAINT "_Class_teachingAssistants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
