# Mobile Onboarding App - Supabase Integration

This is a React Native/Expo mobile application with a complete Supabase backend integration for managing church programs, cell groups, attendance, and more.

## Architecture Overview

```
Mobile App (React Native/Expo)
    ↓ HTTP Requests
Backend Server (Express.js)
    ↓ Supabase Client
Supabase (PostgreSQL Database)
```

### Key Components

- **Client** (`client/`): React Native mobile app using Expo
- **Backend** (`server/`): Express.js API server
- **Database**: Supabase (PostgreSQL with REST API)

## Prerequisites

- Node.js 18+ installed
- Expo CLI (installed automatically when running `npm run expo:dev`)
- A Supabase account and project (free tier works fine)
- Physical device or emulator for testing

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

Follow the comprehensive guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

**Quick version**:
1. Create a Supabase project at [app.supabase.com](https://app.supabase.com)
2. Execute `server/db/schema.sql` in Supabase SQL Editor
3. Copy `.env.example` to `.env` and add your credentials
4. (Optional) Run `tsx server/db/seed.ts` to add test data

### 3. Start the Backend Server

```bash
npm run server:dev
```

The server should start on port 5000. Verify by visiting `http://localhost:5000/api/health`

### 4. Start the Mobile App

In a new terminal:

```bash
npm run expo:dev
```

Scan the QR code with your phone (iOS Camera app or Android Expo Go app).

## Project Structure

```
Mobile-Onboarding/
├── client/                 # React Native mobile app
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Notifications)
│   ├── screens/           # App screens
│   ├── lib/               # Utilities
│   │   ├── storage.ts    # API client layer
│   │   └── query-client.ts
│   └── navigation/        # Navigation configuration
│
├── server/                 # Express.js backend
│   ├── lib/
│   │   └── supabase.ts   # Supabase client config
│   ├── db/
│   │   ├── schema.sql    # Database schema
│   │   └── seed.ts       # Seed data script
│   ├── storage.ts        # Database operations
│   ├── routes.ts         # API endpoints
│   └── index.ts          # Server entry point
│
├── .env.example           # Environment template
├── SUPABASE_SETUP.md     # Detailed setup guide
└── package.json
```

## Features

- **User Management**: Participants, leaders, facilitators, admins
- **Program Enrollment**: Enroll users in programs
- **Cell Group Management**: Automatic and manual cell assignments
- **Session Attendance**: QR code-based check-in system
- **Payment Tracking**: Session-based payment recording
- **Assignments**: Create and submit assignments
- **Audit Logging**: Track all critical actions

## API Endpoints

All endpoints are prefixed with `/api`:

### Health Check
- `GET /api/health` - Check server and database connectivity

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Programs
- `GET /api/programs` - Get all programs
- `GET /api/programs/:id` - Get program by ID
- `POST /api/programs` - Create program
- `PUT /api/programs/:id` - Update program

### Sessions
- `GET /api/sessions` - Get all sessions
- `GET /api/programs/:programId/sessions` - Get sessions for a program
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Enrollments
- `GET /api/enrollments` - Get all enrollments
- `GET /api/users/:userId/enrollments` - Get user enrollments
- `POST /api/enrollments` - Create enrollment

### Cell Groups
- `GET /api/cell-groups` - Get all cell groups
- `GET /api/programs/:programId/cell-groups` - Get cell groups for program
- `POST /api/cell-groups` - Create cell group
- `POST /api/programs/:programId/auto-assign-cells` - Auto-create and assign cells

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/users/:userId/attendance` - Get user attendance
- `GET /api/sessions/:sessionId/attendance` - Get session attendance
- `POST /api/attendance/check-in` - Check in to session
- `POST /api/attendance/check-out` - Check out of session
- `POST /api/attendance/:id/confirm` - Confirm attendance

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/users/:userId/payments` - Get user payments
- `GET /api/sessions/:sessionId/payments` - Get session payments
- `PUT /api/payments/:id/confirm` - Confirm payment
- `PUT /api/payments/:id/unpaid` - Mark payment as unpaid
- `PUT /api/payments/:id/waive` - Waive payment

*(See `server/routes.ts` for complete API documentation)*

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run check:types
```

### Linting

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Formatting

```bash
npm run check:format
npm run format  # Auto-format code
```

## Debugging

### Connection Issues

1. **Check backend server is running**: `npm run server:dev`
2. **Verify health endpoint**: Visit `http://localhost:5000/api/health`
3. **Check `.env` file**: Ensure all variables are set correctly
4. **Network issues**: 
   - For physical devices, use your computer's IP instead of `localhost`
   - Ensure device and computer are on same network
   - Check firewall settings

### Database Issues

1. **Verify schema applied**: Check Supabase Dashboard → Table Editor
2. **Check credentials**: Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
3. **Check Supabase status**: Ensure project is not paused
4. **Review logs**: Supabase Dashboard → Logs

### Using Connection Status Component

Add to any screen for real-time debugging:

```tsx
import { ConnectionStatus } from "@/components/ConnectionStatus";

// In your screen:
<ConnectionStatus />
```

## Environment Variables

See `.env.example` for all required variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PORT`: Backend server port (default: 5000)
- `EXPO_PUBLIC_DOMAIN`: API domain for client (e.g., localhost:5000)
- `NODE_ENV`: Environment (development/production)

## Database Schema

The database schema is defined in `server/db/schema.sql` and includes:

- **users**: User accounts with roles
- **programs**: Training programs
- **sessions**: Program sessions
- **enrollments**: User program enrollments
- **cell_groups**: Small group assignments
- **cell_members**: Cell group membership
- **assignments**: Session assignments
- **assignment_submissions**: Assignment submissions
- **attendance_records**: Session attendance
- **payment_records**: Session payments
- **audit_logs**: System audit trail

## Production Deployment

1. **Database**: Review and update RLS policies in `schema.sql`
2. **Environment**: Use production environment variables
3. **Security**: 
   - Never commit `.env` files
   - Use strong Supabase passwords
   - Implement proper authentication
4. **Monitoring**: Set up logging and monitoring
5. **Backups**: Configure Supabase backups

## Troubleshooting

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed troubleshooting steps.

## Support

For issues or questions:
1. Check health endpoint: `http://localhost:5000/api/health`
2. Review backend server logs
3. Check Supabase dashboard logs
4. Review this README and SUPABASE_SETUP.md

## License

[Your License Here]
