# CLAUDE.md - AI Assistant Instructions

## Quick Project Overview

TorqueEd is an automotive education CMS built with KeystoneJS 6 for managing schools, courses, and student attendance. The system uses QR code scanning for attendance tracking and provides spreadsheet-style views for instructors. This is Phase A of a three-phase project, focusing on core administration and attendance features.

**Tech Stack:** Node.js, TypeScript, KeystoneJS 6, PostgreSQL, React (via KeystoneJS Admin UI), GraphQL

## Current State

- **Implementation Complete:** Core KeystoneJS setup, database schema, attendance system
- **Fully Functional:** QR scanner, attendance spreadsheet, class session management
- **Ready for Production:** Multi-tenant setup, role-based access control
- **Key Documents:** 
  - `/docs/torque-ed-prd.md` - Full requirements (✅ Complete)
  - `/docs/torque-ed-tech-spec.md` - Technical implementation details (✅ Complete)
  - `/docs/CLAUDE.md` - This file - AI assistant instructions (✅ Complete)
  - `/docs/ARCHITECTURE.md` - Detailed system design and implementation patterns (✅ Complete)
  - `/docs/DOMAIN_MODEL.md` - Business logic, rules, and terminology (✅ Complete)
  - `/docs/API_SPEC.md` - Complete GraphQL/REST API documentation (✅ Complete)
  - `/docs/DEPLOYMENT.md` - Infrastructure and deployment procedures (✅ Complete)

## Key Architecture Decisions

1. **KeystoneJS as CMS** - Provides admin UI, GraphQL API, and database management
2. **Single App Architecture** - Attendance spreadsheets are custom pages within KeystoneJS admin (not a separate app)
3. **QR Scanner Integration** - USB/Bluetooth scanners work as keyboard input (no special drivers needed)
4. **Multi-tenant Design** - All school systems in one database with row-level isolation
5. **PostgreSQL Only** - MongoDB will be added in Phase C for curriculum tracking

## Development Setup

```bash
# Clone the repository
git clone [repository-url]
cd torque-ed

# Install dependencies (using npm)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with database credentials

# Start development server (handles migrations automatically)
npm run dev

# Available scripts:
npm run generate-sessions    # Generate class sessions for existing classes
npm run remove-sessions     # Remove all existing sessions
npm run update-dayofweek    # Update existing sessions with dayOfWeek field
```

## Project Structure

```
torque-ed/
├── docs/
│   ├── torque-ed-prd.md         # Product requirements
│   ├── torque-ed-tech-spec.md   # Technical specification
│   └── CLAUDE.md                # This file
├── schema/                       # KeystoneJS data models
│   ├── SchoolSystem.ts          # School district/system management
│   ├── School.ts                # Individual schools
│   ├── User.ts                  # Users with role-based access
│   ├── Course.ts                # Course catalog
│   ├── Class.ts                 # Class instances with auto-session generation
│   ├── ClassSession.ts          # Individual class meetings (renamed from ClassMeeting)
│   ├── Student.ts               # Student records with QR codes
│   ├── Enrollment.ts            # Student-class relationships
│   ├── AttendanceRecord.ts      # Clock-in/out records with duration
│   ├── Semester.ts              # Academic terms with midterm/final periods
│   └── Holiday.ts               # Holidays that block session generation
├── admin/
│   ├── components/              # Reusable React components
│   │   ├── QRCodeDisplay.tsx   # QR code rendering component
│   │   └── AttendanceScanner.tsx # Smart QR scanner with clock-in/out logic
│   └── pages/                   # Custom admin pages
│       └── attendance.tsx       # Attendance spreadsheet with 3 columns per session
├── lib/                         # Business logic utilities
│   └── generateClassSessions.ts # Session generation with holiday exclusion
├── scripts/                     # Database maintenance scripts
│   ├── generate-sessions.js     # Generate sessions for existing classes
│   ├── remove-sessions.js       # Remove all sessions
│   └── update-session-dayofweek.js # Backfill dayOfWeek data
├── keystone.ts                  # Main KeystoneJS config
├── package.json
└── README.md
```

## Common Development Tasks

### Adding a New Field to a Model
1. Edit the schema file in `/schema/[ModelName].ts`
2. Restart the dev server (migrations happen automatically)
3. For production: KeystoneJS generates migrations automatically

### Creating a Custom Admin Page
1. Create new React component in `/admin/pages/`
2. Register it in `keystone.ts` under `ui.navigation`
3. Use KeystoneJS's design system components

### Testing QR Scanner Integration
1. The scanner input is captured as keyboard events
2. Look for the attendance scanner component in `/admin/pages/attendance.tsx`
3. Scanner should type the QR code and press Enter automatically

### Working with Access Control
- Access rules are defined in each schema file
- Test with different user roles: superAdmin, admin, instructor, ta
- Use GraphQL playground at `http://localhost:3030/api/graphql` for testing

## Key Implementation Notes

### Attendance Clock-In/Clock-Out Flow
1. Instructor/TA navigates to attendance page for their class
2. Scanner shows QR scanner interface with green "Show Scanner" button
3. Scanner beeps and types student QR code + Enter
4. System automatically detects if this is clock-in or clock-out:
   - **First scan**: Clocks student IN (creates attendance record with clockInTime)
   - **Second scan**: Clocks student OUT (updates record with clockOutTime)
   - **Duration**: Automatically calculated when both times are present
5. Manual editing available for all three fields (clock in, clock out, duration)
6. UI updates immediately with real-time feedback

### Class Session Generation
- Happens when a class is created with a schedule
- Automatically excludes holidays from semester holiday list
- Marks ONLY the last session in midterm/final date ranges (not all sessions)
- Generates dayOfWeek and courseNumber fields automatically
- See `generateClassSessions()` function and scripts in `/scripts/`

### Multi-tenant Isolation
- Every model has a `schoolSystem` relationship
- Access control rules filter data by user's school system
- No cross-tenant data access possible

## Troubleshooting

### QR Scanner Not Working
- Check if scanner is in HID mode (acts as keyboard)
- Ensure the attendance page has keyboard focus
- Test scanner in a text editor first

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists: `createdb torque-ed`

### Permission Denied Errors
- Check user roles in the database
- Verify access control rules in schema files
- Super admin can access everything - use for testing

## External Resources

- [KeystoneJS Documentation](https://keystonejs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- QR Scanner Model: Tera D5100 (HID mode)

## Phase B & C Preparation

**Phase B (Grading):** Will add grade fields to Enrollment model and create gradebook views
**Phase C (Coursework):** Will integrate MongoDB for flexible curriculum data and video submissions

## Questions or Issues?

Primary contact: Rich Goldman (rich@comfypants.org)