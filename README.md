# TorqueEd - Automotive Education CMS

A comprehensive school management system designed specifically for automotive education programs, featuring QR-based attendance tracking and automated course management.

## Features

### Phase A (Current)
- 🏫 **Multi-School Management** - Manage multiple schools within a district
- 📚 **Course & Class Organization** - Create courses and schedule class sections
- 👥 **Role-Based Access** - Super admins, administrators, instructors, and teaching assistants
- 📊 **Automated Scheduling** - Generate class meetings with holiday awareness
- 📱 **QR Attendance Tracking** - Quick student check-in with handheld scanners
- 📈 **Attendance Spreadsheets** - Real-time attendance grids for instructors

### Coming Soon
- **Phase B:** Grade tracking and gradebook management
- **Phase C:** Coursework tracking with video submissions

## Tech Stack

- **Framework:** [KeystoneJS 6](https://keystonejs.com/)
- **Database:** PostgreSQL
- **Language:** TypeScript
- **Runtime:** Node.js 20.x LTS
- **Package Manager:** Yarn
- **API:** GraphQL (auto-generated)
- **Frontend:** React (KeystoneJS Admin UI)

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 15+
- Yarn package manager
- USB/Bluetooth QR scanner (optional, for testing)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd torque-ed

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
yarn keystone prisma migrate dev

# Seed sample data (optional)
yarn seed

# Start the development server
yarn dev
```

The admin UI will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file with:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/torque-ed
SESSION_SECRET=your-session-secret-min-32-chars
```

## Project Structure

```
torque-ed/
├── docs/                 # Project documentation
├── schema/              # Data model definitions
├── admin/               # Custom admin UI components
│   └── pages/          # Custom admin pages
├── lib/                 # Utility functions
├── public/              # Static assets
└── keystone.ts          # Main configuration
```

## Usage

### For Administrators

1. Log in to the admin panel
2. Create your school system and schools
3. Set up courses and instructors
4. Create semesters with holidays
5. Generate classes with meeting schedules

### For Instructors

1. Access your class attendance sheets
2. Use QR scanner to mark attendance
3. Manage class rosters (add/drop students)
4. View attendance history and patterns

### QR Scanner Setup

The system supports any USB/Bluetooth QR scanner that operates in HID (keyboard) mode. Recommended model: [Tera D5100](https://tera-digital.com/products/2d-barcode-scanner-d5100).

## Development

```bash
# Run in development mode
yarn dev

# Run tests
yarn test

# Lint code
yarn lint

# Build for production
yarn build

# Start production server
yarn start
```

## Documentation

- [Product Requirements Document](./docs/torque-ed-prd.md)
- [Technical Specification](./docs/torque-ed-tech-spec.md)
- [AI Assistant Guide](./docs/CLAUDE.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Contact

**Author:** Rich Goldman  
**Email:** rich@comfypants.org

## Acknowledgments

- Built with [KeystoneJS](https://keystonejs.com/)
- QR code generation using [qrcode](https://www.npmjs.com/package/qrcode)
- Date handling with [date-fns](https://date-fns.org/)