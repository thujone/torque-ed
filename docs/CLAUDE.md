# CLAUDE.md - AI Assistant Instructions

## Quick Project Overview

TorqueEd is an automotive education CMS built with KeystoneJS 6 for managing schools, courses, and student attendance. The system uses QR code scanning for attendance tracking and provides spreadsheet-style views for instructors. This is Phase A of a three-phase project, focusing on core administration and attendance features.

**Tech Stack:** Node.js, TypeScript, KeystoneJS 6, PostgreSQL, React (via KeystoneJS Admin UI), GraphQL

## Current State

- **Planning Phase:** PRD and Tech Spec completed
- **Not Yet Started:** KeystoneJS implementation, database setup, custom components
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

# Install dependencies (using yarn, not npm)
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with database credentials

# Run database migrations
yarn keystone prisma migrate dev

# Start development server
yarn dev
```

## Project Structure

```
torque-ed/
├── docs/
│   ├── torque-ed-prd.md         # Product requirements
│   ├── torque-ed-tech-spec.md   # Technical specification
│   └── CLAUDE.md                # This file
├── schema/                       # KeystoneJS data models
│   ├── SchoolSystem.ts
│   ├── School.ts
│   ├── User.ts
│   ├── Course.ts
│   ├── Class.ts
│   ├── Student.ts
│   └── ... other models
├── admin/
│   └── pages/                   # Custom admin pages
│       └── attendance.tsx       # Attendance spreadsheet view
├── keystone.ts                  # Main KeystoneJS config
├── package.json
└── README.md
```

## Common Development Tasks

### Adding a New Field to a Model
1. Edit the schema file in `/schema/[ModelName].ts`
2. Run `yarn keystone prisma migrate dev` to update database
3. Restart the dev server

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

### Attendance Marking Flow
1. Instructor/TA navigates to attendance page for their class
2. Today's column is highlighted in the spreadsheet
3. Scanner beeps and types student QR code + Enter
4. System finds student and marks them present
5. UI updates immediately

### Class Meeting Generation
- Happens when a class is created with a schedule
- Automatically excludes holidays
- Marks midterm/final meetings based on semester date ranges
- See `generateClassMeetings()` function in tech spec

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