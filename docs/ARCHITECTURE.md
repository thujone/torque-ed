# ARCHITECTURE.md - System Design & Implementation

## Overview

TorqueEd is built on KeystoneJS 6, leveraging its powerful GraphQL API generation, admin UI, and database management capabilities. The architecture prioritizes simplicity, maintainability, and the specific needs of automotive education programs.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                    KeystoneJS Application                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Admin UI (React)                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │ School Mgmt  │  │ Course Mgmt  │  │  Attendance  │ │   │
│  │  │   Pages      │  │    Pages     │  │  Spreadsheet │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────────┐   │
│  │                   GraphQL API Layer                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │   Queries    │  │  Mutations   │  │Subscriptions │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────────┐   │
│  │                  Business Logic Layer                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │Access Control│  │   Meeting    │  │  Attendance  │ │   │
│  │  │    Rules     │  │  Generator   │  │  Processor   │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────────┐   │
│  │              Data Access Layer (Prisma)                  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      PostgreSQL Database                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │   Schema     │  │   Indexes   │  │   Row-Level        │    │
│  │   Tables     │  │             │  │   Security         │    │
│  └─────────────┘  └─────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### Core Components

1. **KeystoneJS Core**
   - Handles HTTP server, GraphQL endpoint, and admin UI hosting
   - Manages database connections via Prisma
   - Provides authentication and session management

2. **Schema Layer** (`/schema/*`)
   - Defines data models with TypeScript
   - Implements field-level validation
   - Contains access control rules
   - Manages relationships between entities

3. **Custom Admin Pages** (`/admin/pages/*`)
   - React components for specialized UI needs
   - Attendance spreadsheet view
   - QR scanner integration
   - Bulk operations interfaces

4. **Business Logic** (`/lib/*`)
   - Meeting generation algorithms
   - Attendance processing logic
   - Notification services
   - Data export utilities

### Data Flow

#### Attendance Marking Flow

```
QR Scanner → Keyboard Input → React Component → GraphQL Mutation → 
Access Control Check → Database Update → UI Update → Notification Service
```

1. **Scanner Input**: QR scanner sends keystrokes to the browser
2. **React Handler**: Captures input and triggers GraphQL mutation
3. **GraphQL Layer**: Validates request and checks permissions
4. **Database**: Updates attendance record with transaction
5. **UI Update**: Optimistic update with error rollback
6. **Notifications**: Async job to send notifications if needed

#### Class Meeting Generation Flow

```
Create Class → Validate Schedule → Generate Meetings → 
Check Holidays → Save to Database → Update UI
```

### Security Architecture

#### Multi-Tenant Isolation

```typescript
// Every query is automatically filtered by school system
const accessFilter = {
  filter: {
    query: ({ session, context }) => {
      if (!session?.data?.schoolSystemId) return false;
      return { schoolSystem: { id: { equals: session.data.schoolSystemId } } };
    }
  }
};
```

#### Role-Based Access Control (RBAC)

```
Super Admin
    ├── Full system access
    └── Can manage all school systems

Admin
    ├── School-level management
    ├── Course creation/editing
    └── User management

Instructor
    ├── Class roster management
    ├── Attendance marking/editing
    └── Meeting cancellations

Teaching Assistant
    ├── Attendance marking
    └── View-only access to class data
```

### Database Architecture

#### Indexing Strategy

```sql
-- Performance-critical indexes
CREATE UNIQUE INDEX idx_student_qr_code ON "Student" (qr_code);
CREATE UNIQUE INDEX idx_student_id ON "Student" (student_id);
CREATE INDEX idx_enrollment_lookup ON "Enrollment" (class_id, student_id);
CREATE INDEX idx_attendance_lookup ON "AttendanceRecord" (class_meeting_id, enrollment_id);
CREATE INDEX idx_class_semester ON "Class" (semester_id, school_id);
```

#### Transaction Boundaries

- Enrollment changes (add/drop) are wrapped in transactions
- Attendance marking is atomic per student
- Meeting generation is batched in transactions of 100

### Caching Strategy

1. **GraphQL Query Caching**
   - DataLoader for N+1 query prevention
   - Request-level caching for repeated queries

2. **Static Asset Caching**
   - Admin UI assets served with long cache headers
   - QR code images cached in browser

3. **Database Connection Pooling**
   - PgBouncer for connection management
   - Pool size based on container resources

### Error Handling

#### Client-Side
```typescript
// Unified error boundary for admin pages
class AttendanceErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    // Show user-friendly error message
    // Offer recovery action (reload, go back)
  }
}
```

#### Server-Side
```typescript
// Global error handler in KeystoneJS
export const errorHandler = (error, req, res) => {
  logger.error({ error, req });
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: error.details 
    });
  }
  
  // Generic error response
  res.status(500).json({ 
    error: 'Internal server error' 
  });
};
```

### Performance Considerations

1. **Lazy Loading**
   - Admin UI routes are code-split
   - Large datasets paginated (50 items default)
   - Attendance grids virtualized for large classes

2. **Database Optimization**
   - Eager loading for related data
   - Projection queries for list views
   - Batch operations for bulk updates

3. **API Optimization**
   - GraphQL query complexity limits
   - Depth limiting to prevent abuse
   - Rate limiting per user role

### Scalability Path

#### Horizontal Scaling
```
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────┴─────┐      ┌────┴─────┐      ┌────┴─────┐
   │ Server 1 │      │ Server 2 │      │ Server 3 │
   └────┬─────┘      └────┬─────┘      └────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────┴──────┐
                    │  PostgreSQL │
                    │   Primary   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Read      │
                    │  Replicas   │
                    └─────────────┘
```

#### Future Microservices
- Notification service (Phase A+)
- Video processing service (Phase C)
- Analytics service (Future)

### Monitoring Architecture

1. **Application Metrics**
   - Request/response times
   - GraphQL query performance
   - Error rates by endpoint

2. **Infrastructure Metrics**
   - CPU/Memory usage
   - Database connection pool status
   - Disk I/O for file uploads

3. **Business Metrics**
   - Daily active users by role
   - Attendance marking velocity
   - System usage by school

### Development Patterns

#### Code Organization
```
torque-ed/
├── schema/                 # Data models
│   ├── fields/            # Reusable field definitions
│   ├── access/            # Reusable access control rules
│   └── hooks/             # Model lifecycle hooks
├── lib/
│   ├── auth/              # Authentication utilities
│   ├── attendance/        # Attendance business logic
│   ├── scheduling/        # Meeting generation logic
│   └── notifications/     # Email/webhook services
├── admin/
│   ├── components/        # Reusable React components
│   ├── pages/            # Custom admin pages
│   └── hooks/            # Custom React hooks
└── api/                   # Custom REST endpoints
```

#### Testing Patterns
- Unit tests for business logic
- Integration tests for GraphQL API
- E2E tests for critical user flows
- Snapshot tests for React components

### Deployment Architecture

#### Container Structure
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
# Build stage...

FROM node:20-alpine AS runtime
# Runtime stage with minimal footprint
```

#### Health Checks
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: await checkDatabase(),
    redis: await checkRedis()
  };
  
  const healthy = Object.values(checks).every(status => status === 'ok');
  res.status(healthy ? 200 : 503).json(checks);
});
```

### Migration Strategy

#### Database Migrations
1. Forward-only migrations
2. Backward compatibility for 1 version
3. Blue-green deployments for zero downtime

#### API Versioning
- GraphQL schema evolution
- Deprecated field warnings
- Gradual client migration

This architecture provides a solid foundation for Phase A while maintaining flexibility for future phases.