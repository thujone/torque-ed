# Product Requirements Document (PRD)
# TorqueEd (Automotive Education CMS)

**Version:** 1.0  
**Date:** July 3, 2025  
**Author:** Rich Goldman (rich@comfypants.org)  
**Status:** In Development - Phase A

## 1. Executive Summary

TorqueEd is a comprehensive school management system designed specifically for automotive education programs at colleges. Phase A is currently in development and focuses on core administrative functions and attendance tracking through QR code scanning. The system will enable administrators to manage schools, courses, classes, and students while providing robust, real-time attendance tracking. The development includes implementing a clock-in/clock-out attendance system that tracks student presence time through smart QR scanning that automatically detects clock-in vs clock-out actions, with manual override capabilities for instructors. Phase B will introduce grading capabilities, and Phase C will add comprehensive coursework tracking.

## 2. Problem Statement

### Current Challenges
- Manual attendance tracking is time-consuming and error-prone
- No centralized system for managing multiple schools within a district
- Difficult to track students across multiple classes and semesters
- Limited visibility into attendance patterns and student engagement
- Manual creation and maintenance of attendance spreadsheets
- Need for tracking actual time spent in class (clock-in/clock-out)
- Complex requirements for midterm and final session identification

### Target Users
1. **Super Administrators** - Technology staff managing the entire system
2. **Administrators** - Department heads managing schools and courses
3. **Instructors** - Teachers managing their classes and tracking attendance
4. **Teaching Assistants** - TAs helping with attendance tracking
5. **Students** - (Future consideration for limited access)

## 3. Goals and Success Metrics

### Primary Goals
1. Reduce attendance tracking time by 80%
2. Eliminate manual spreadsheet creation and maintenance
3. Provide real-time attendance visibility across all classes
4. Enable efficient student roster management
5. Implement clock-in/clock-out tracking with session duration
6. Support manual override capabilities for teachers

### Success Metrics
- Time to mark attendance for a 30-student class: < 2 minutes
- System uptime: 99.9%
- User adoption rate: 100% within first semester
- Data accuracy: 100% for attendance records
- Administrator setup time for new semester: < 1 day
- Clock-in/out processing time: < 5 seconds per student

## 4. Feature Requirements

### 4.1 MVP Features (Phase A - In Development)

#### Hierarchy Management
- **School System Management**
  - Create and manage school systems (e.g., "Southern California State School District")
  - Multi-tenant architecture with strong data isolation
  
- **School Management**
  - Add/edit/delete schools within a system
  - Assign administrators to schools
  
- **Course Management**
  - Create courses (e.g., AUTO-302 "Transmission Repair")
  - Share courses across schools within a system
  - Set course metadata (description, prerequisites)
  
- **Class Management**
  - Create class instances for each semester (e.g., "AUTO-302 Morning II")
  - Set enrollment limits and manage waitlists
  - Define meeting schedules (days, times, rooms, building)
  - Generate complete list of class sessions for the semester
  - Support for midterm and final session identification
  - Holiday exclusion during session generation
  - Auto-populate course number and day-of-week for sessions

#### User Management
- **Role-Based Access Control**
  - Super Admin: Full system access
  - Admin: School and course management
  - Instructor: Class roster and attendance management
  - TA: Attendance tracking only
  - Support multiple roles per user (e.g., TA in one class, student in another)
  - Row-level security ensuring data isolation

- **Instructor Assignment**
  - Assign instructors and TAs to classes
  - Support teaching multiple classes across schools
  - Teaching assistants can mark and edit attendance records

#### Calendar and Scheduling
- **Semester Management**
  - Create academic semesters with start/end dates
  - Define holidays and breaks
  - Set midterm and final exam date ranges
  
- **Class Session Generation**
  - Automatically generate all class sessions based on schedule
  - Account for holidays and breaks
  - Support simple recurring patterns (MWF, TTh, etc.)
  - Only mark last session in midterm/final periods (not all sessions)
  - Auto-populate course number and day-of-week for each session
  - Allow individual session cancellations and time modifications
  - Auto-calculate end times when start time changes

#### Attendance System
- **QR Code Generation**
  - Generate unique QR codes for each student
  - QR codes persist across semesters
  - Visual QR code display in attendance spreadsheet
  
- **Clock-In/Clock-Out Tracking**
  - Smart scanner detection: First scan = Clock IN, Second scan = Clock OUT
  - Real-time feedback showing student check-in/out status
  - Automatic session duration calculation when both times recorded
  - Multi-class support: Automatically finds today's sessions for student
  - Support USB/Bluetooth QR scanners (keyboard input)
  - Manual override: Teachers can edit all fields (clock in, out, duration)
  - Track presence with precise timestamps and duration
  - Edit historical attendance records
  
- **Attendance Spreadsheet View**
  - Three columns per session: Clock In Time | Clock Out Time | Duration
  - Auto-generated grid with course numbers and day-of-week
  - Real-time duration display (e.g., "1h 30m", "45m")
  - Manual editing capability for all attendance fields
  - Visual session type indicators for midterm/final sessions
  - Smart scanner interface for QR code input
  - Datetime inputs for precise time entry
  - Cannot directly edit student roster (must use CMS)

#### Notifications
- Email notifications for:
  - Student roster changes (add/drop)
  - Class cancellations
  - System changes affecting instructors
- Email delivery service integration (SMTP/SendGrid/etc.)

### 4.2 Future Features (Phase 2+)

#### Grading System
- Grade entry and calculation
- Progress tracking through curriculum
- Grade spreadsheet generation

#### Coursework Tracking
- Integration with third-party curriculum systems
- Video submission for lab work
- Progress tracking through instructional content
- MongoDB storage for flexible curriculum data

#### Integration Capabilities
- Canvas LMS integration
- Student Information System (SIS) integration
- Single Sign-On (SSO) support

#### Student Portal
- View-only access to attendance records
- Course enrollment status
- Schedule viewing

#### Advanced Scheduling
- Complex recurring patterns
- Room conflict detection
- Instructor availability management

#### Programs and Certifications
- Track student progress toward certificates
- Program requirement management
- Completion tracking

## 5. User Stories

### Administrator Stories
1. As an administrator, I want to create a new semester and have all class sessions automatically generated so that I don't have to manually create each session.
2. As an administrator, I want to add holidays to the calendar so that class sessions are not scheduled on those days.
3. As an administrator, I want to set class enrollment limits so that classes don't exceed capacity.
4. As an administrator, I want to manage multiple schools within my system with complete data isolation.

### Instructor Stories
1. As an instructor, I want to quickly mark attendance using a QR scanner with clock-in/clock-out tracking so that I can focus on teaching rather than administrative tasks.
2. As an instructor, I want to add or drop students from my class with administrators being notified of changes.
3. As an instructor, I want to manually edit attendance times and durations when needed.
4. As an instructor, I want to cancel a single class session and have all affected parties notified.
5. As an instructor, I want to see how long each student was present in class.
6. As an instructor, I want real-time feedback when QR codes are scanned.

### TA Stories
1. As a TA, I want to mark attendance for students using smart QR scanning so that I can assist the instructor with administrative tasks.
2. As a TA, I want to correct attendance mistakes from previous classes so that records are accurate.
3. As a TA, I want to see session duration information for each student.
4. As a TA, I want to manually edit attendance fields when QR scanning isn't available.

## 6. Non-Functional Requirements

### Performance
- Page load time: < 2 seconds
- Spreadsheet generation: < 3 seconds for 50 students × 45 meetings
- Support 100+ concurrent users per instance

### Security
- FERPA compliance for student data protection
- Role-based access control with granular permissions
- Encrypted data transmission (HTTPS)
- Encrypted data at rest
- Audit logging for all data changes
- Multi-tenant data isolation

### Usability
- Intuitive interface requiring < 30 minutes training
- Mobile-responsive design for tablet use during attendance
- Accessible to users with disabilities (WCAG 2.1 AA compliance)
- Works with standard USB/Bluetooth QR scanners

### Reliability
- 99.9% uptime during school hours
- Automated backups every 6 hours
- Disaster recovery plan with < 4 hour RTO
- Offline attendance capability with sync

### Scalability
- Support 10,000+ students per school system
- Horizontal scaling capability
- Multi-tenant architecture supporting 50+ school systems

## 7. Technical Constraints

### Technology Stack
- **Backend**: Node.js with TypeScript
- **CMS**: KeystoneJS 6
- **Database**: PostgreSQL for structured data
- **Future**: MongoDB for curriculum/coursework data
- **Frontend**: React (via KeystoneJS admin UI)
- **Deployment**: AWS or DigitalOcean
- **Containerization**: Docker/Kubernetes ready

### Integration Requirements
- RESTful or GraphQL API
- Webhook support for notifications
- Standard authentication protocols (OAuth 2.0 ready)

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## 8. MVP Definition

The Minimum Viable Product must include:
1. Complete hierarchy management (System → School → Course → Class → Student)
2. User management with role-based permissions
3. Semester and calendar management with automatic session generation
4. QR-based clock-in/clock-out attendance tracking with session duration
5. Enhanced attendance spreadsheet view with three columns per session
6. Basic notification system for roster changes

### Enhanced MVP Features:
- Smart scanner logic that automatically detects clock-in vs clock-out
- Session duration tracking with real-time calculation and display
- Manual override capabilities for teachers to edit all attendance fields
- Visual session indicators for midterm/final sessions
- Course number integration auto-populated in session views
- Day-of-week display auto-calculated for every session
- Smart midterm/final logic that only marks the last session in each period

## 9. Launch Criteria

Before launch, the system must:
1. Successfully import sample data for one complete school
2. Process 1000 QR scans without errors (clock-in/clock-out functionality)
3. Generate accurate attendance spreadsheets with duration tracking
4. Pass security audit for student data protection
5. Complete user acceptance testing with 5 instructors
6. Have comprehensive documentation for administrators

### Success Indicators:
- All MVP features fully implemented and tested
- Clock-in/clock-out system with automatic duration calculation working reliably
- Smart scanner with immediate feedback operating correctly
- Multi-tenant architecture with proper data isolation
- Clean codebase with maintenance scripts
- Complete technical documentation

## 10. Future Considerations

### Phase B: Grading System
- Grade entry and calculation
- Progress tracking through curriculum  
- Grade spreadsheet generation
- Instructor grade entry workflows
- Student grade visibility

### Phase C: Coursework Tracking
- Integration with third-party curriculum systems
- Video submission for lab work
- Progress tracking through instructional content
- MongoDB storage for flexible curriculum data
- Competency-based progression tracking
- Lab completion verification

### Additional Future Enhancements
- Mobile application for attendance tracking
- Predictive analytics for at-risk students
- Integration with automotive equipment tracking
- Industry certification tracking
- Employer portal for student achievements
- Canvas LMS integration

