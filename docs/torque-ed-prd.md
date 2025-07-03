# Product Requirements Document (PRD)
# TorqueEd (Automotive Education CMS)

**Version:** 1.0  
**Date:** July 3, 2025  
**Author:** Rich Goldman (rich@comfypants.org)  
**Status:** Draft

## 1. Executive Summary

TorqueEd is a comprehensive school management system designed specifically for automotive education programs at colleges. This document outlines Phase A of the project, which focuses on core administrative functions and attendance tracking through QR code scanning. The system enables administrators to manage schools, courses, classes, and students while providing robust, real-time attendance tracking. Phase B will introduce grading capabilities, and Phase C will add comprehensive coursework tracking. The primary goal of Phase A is to streamline administrative tasks and provide accurate, real-time attendance tracking for automotive education programs.

## 2. Problem Statement

### Current Challenges
- Manual attendance tracking is time-consuming and error-prone
- No centralized system for managing multiple schools within a district
- Difficult to track students across multiple classes and semesters
- Limited visibility into attendance patterns and student engagement
- Manual creation and maintenance of attendance spreadsheets

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

### Success Metrics
- Time to mark attendance for a 30-student class: < 2 minutes
- System uptime: 99.9%
- User adoption rate: 100% within first semester
- Data accuracy: 100% for attendance records
- Administrator setup time for new semester: < 1 day

## 4. Feature Requirements

### 4.1 MVP Features (Phase 1)

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
  - Define meeting schedules (days, times, rooms)
  - Generate complete list of class meetings for the semester

#### User Management
- **Role-Based Access Control**
  - Super Admin: Full system access
  - Admin: School and course management
  - Instructor: Class roster and attendance management
  - TA: Attendance tracking only
  - Support multiple roles per user (e.g., TA in one class, student in another)

- **Instructor Assignment**
  - Assign instructors and TAs to classes
  - Support teaching multiple classes across schools

#### Calendar and Scheduling
- **Semester Management**
  - Create academic semesters with start/end dates
  - Define holidays and breaks
  - Set midterm and final exam date ranges
  
- **Class Meeting Generation**
  - Automatically generate all class meetings based on schedule
  - Account for holidays and breaks
  - Support simple recurring patterns (MWF, TTh, etc.)
  - Allow individual meeting cancellations

#### Attendance System
- **QR Code Generation**
  - Generate unique QR codes for each student
  - QR codes persist across semesters
  
- **Attendance Tracking**
  - Support USB/Bluetooth QR scanners (keyboard input)
  - Real-time attendance marking
  - Manual attendance entry as backup
  - Track: Present, Absent, Excused
  - Edit historical attendance records
  
- **Attendance Spreadsheet View**
  - Auto-generated grid view (students × class dates)
  - Today's date highlighted
  - Cannot directly edit student roster (must use CMS)
  - Visual indicators for attendance status
  - Printable/exportable format

#### Notifications
- Email notifications for:
  - Student roster changes (add/drop)
  - Class cancellations
  - System changes affecting instructors

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
1. As an administrator, I want to create a new semester and have all class meetings automatically generated so that I don't have to manually create each meeting.
2. As an administrator, I want to add holidays to the calendar so that class meetings are not scheduled on those days.
3. As an administrator, I want to set class enrollment limits so that classes don't exceed capacity.

### Instructor Stories
1. As an instructor, I want to quickly mark attendance using a QR scanner so that I can focus on teaching rather than administrative tasks.
2. As an instructor, I want to add or drop students from my class with administrators being notified of changes.
3. As an instructor, I want to mark a student's absence as excused so that it's properly reflected in records.
4. As an instructor, I want to cancel a single class meeting and have all affected parties notified.

### TA Stories
1. As a TA, I want to mark attendance for students so that I can assist the instructor with administrative tasks.
2. As a TA, I want to correct attendance mistakes from previous classes so that records are accurate.

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
- Backend: Node.js with TypeScript
- CMS: KeystoneJS (or similar)
- Database: PostgreSQL for structured data
- Future: MongoDB for curriculum/coursework data
- Frontend: React (via KeystoneJS admin UI)
- Deployment: AWS or DigitalOcean
- Containerization: Docker/Kubernetes ready

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
3. Semester and calendar management with automatic meeting generation
4. QR-based attendance tracking with manual backup
5. Attendance spreadsheet view within CMS
6. Basic notification system for roster changes

## 9. Launch Criteria

Before launch, the system must:
1. Successfully import sample data for one complete school
2. Process 1000 QR scans without errors
3. Generate accurate attendance spreadsheets
4. Pass security audit for student data protection
5. Complete user acceptance testing with 5 instructors
6. Have comprehensive documentation for administrators

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