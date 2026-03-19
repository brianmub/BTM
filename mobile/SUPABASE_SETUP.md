# Supabase Integration Setup Guide

This guide will help you connect your Mobile-Onboarding app to Supabase.

## Prerequisites

- A Supabase account (sign up at https://app.supabase.com)
- Node.js installed (v18 or higher recommended)

## Step 1: Set Up Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization and fill in:
   - **Name**: Mobile-Onboarding (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for setup to complete

## Step 2: Apply Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `server/db/schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the schema
6. Verify tables were created: Go to **Table Editor** → you should see all tables (users, programs, sessions, etc.)

## Step 3: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Find and copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure Environment Variables

1. In your project root, copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   PORT=5000
   EXPO_PUBLIC_DOMAIN=localhost:5000
   NODE_ENV=development
   ```

3. Replace `your-project-id` and `your-anon-key-here` with your actual values from Step 3

## Step 5: (Optional) Seed Test Data

To populate your database with sample data for testing:

```bash
npm install -g tsx  # If not already installed
tsx server/db/seed.ts
```

This will create:
- Sample users (participant, leader, facilitator, admin)
- Enrollments
- Cell groups
- Attendance records
- Payment records

## Step 6: Start the Backend Server

```bash
npm run server:dev
```

You should see:
```
express server serving on port 5000
```

## Step 7: Verify Connection

1. Open your browser and go to: `http://localhost:5000/api/health`
2. You should see a response like:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-02-03T...",
     "supabase": {
       "connected": true,
       "error": null
     }
   }
   ```

If `supabase.connected` is `false`, check:
- Your `.env` file has correct credentials
- The schema was applied successfully
- Your Supabase project is active

## Step 8: Start the Mobile App

In a new terminal:

```bash
npm run expo:dev
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

## Troubleshooting

### "Unable to connect to server" in the app

1. Make sure backend server is running (`npm run server:dev`)
2. Check `EXPO_PUBLIC_DOMAIN` in `.env`:
   - For physical device on same network: Use your computer's IP address (e.g., `192.168.1.100:5000`)
   - For emulator: Use `localhost:5000` or `10.0.2.2:5000` (Android)
3. Ensure firewall allows connections on port 5000

### Database connection errors in health check

1. Verify credentials in `.env` are correct
2. Check Supabase project is not paused (free tier pauses after inactivity)
3. Verify schema was applied: Check Supabase dashboard → Table Editor
4. Check Supabase logs: Dashboard → Logs

### "Row Level Security" errors

The schema includes RLS policies that allow all operations for development. In production, you should:
1. Review and update RLS policies in `server/db/schema.sql`
2. Implement proper authentication
3. Restrict policies based on user roles

## Using the Connection Status Component

The app now includes a `ConnectionStatus` component to help debug connectivity:

1. Import and add to any screen:
   ```tsx
   import { ConnectionStatus } from "@/components/ConnectionStatus";
   
   // In your screen component:
   <ConnectionStatus />
   ```

2. It will show:
   - Backend API status
   - Database connection status
   - Real-time health monitoring
   - Refresh button to check again

## Next Steps

Once connected:

1. **Test the app**: Navigate through all screens and verify data loads
2. **Create test users**: Use the onboarding flow
3. **Explore features**: Enrollment, attendance, assignments, etc.
4. **Monitor Supabase**: Check Table Editor to see data being created
5. **Review logs**: Use Supabase logs to debug any issues

## Production Deployment

When deploying to production:

1. Update RLS policies in `schema.sql` for proper security
2. Use environment-specific `.env` files
3. Never commit `.env` files to version control
4. Use Supabase organizations for team access
5. Set up proper backup strategies
6. Monitor usage and upgrade Supabase plan as needed

## Support

If you encounter issues:

1. Check the health endpoint: `http://localhost:5000/api/health`
2. Review backend server logs
3. Check Supabase dashboard logs
4. Verify all environment variables are set correctly
