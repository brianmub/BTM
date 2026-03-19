-- BTM Database Schema for Supabase
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
  marital_status TEXT CHECK (marital_status IN ('married', 'unmarried')) NOT NULL,
  role TEXT CHECK (role IN ('participant', 'leader', 'facilitator', 'admin', 'sysadmin')) NOT NULL,
  leader_status TEXT CHECK (leader_status IN ('pending', 'approved', 'rejected')),
  cell_id UUID,
  is_approved BOOLEAN DEFAULT FALSE,
  is_onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  enrollment_start_date TIMESTAMPTZ,
  enrollment_end_date TIMESTAMPTZ,
  program_start_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  min_cell_size INTEGER DEFAULT 5,
  max_cell_size INTEGER DEFAULT 12
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  overview TEXT,
  topics TEXT[] DEFAULT '{}',
  assignment_id UUID
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('enrolled', 'assigned', 'graduated', 'incomplete')) DEFAULT 'enrolled',
  cell_id UUID,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  sessions_attended INTEGER DEFAULT 0,
  assignments_completed INTEGER DEFAULT 0,
  UNIQUE(program_id, user_id)
);

-- Cell Groups table
CREATE TABLE IF NOT EXISTS cell_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES users(id)
);

-- Cell Members junction table
CREATE TABLE IF NOT EXISTS cell_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cell_id UUID REFERENCES cell_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(cell_id, user_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  submission_type TEXT CHECK (submission_type IN ('text', 'file')) DEFAULT 'text'
);

-- Assignment Submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_late BOOLEAN DEFAULT FALSE,
  is_confirmed BOOLEAN DEFAULT FALSE,
  UNIQUE(assignment_id, user_id)
);

-- File Attachments table for assignment submissions
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  confirmed_by_leader BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  UNIQUE(session_id, user_id)
);

-- Payment Records table (session-based payment tracking)
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'unpaid')),
  unpaid_reason TEXT,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(session_id, user_id)
);

-- Migration: Add new columns to existing payment_records if needed
-- ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'unpaid'));
-- ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS unpaid_reason TEXT;
-- ALTER TABLE payment_records ALTER COLUMN amount SET DEFAULT 0;
-- ALTER TABLE payment_records ALTER COLUMN amount DROP NOT NULL;

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  target_cell_id UUID,
  program_id UUID REFERENCES programs(id),
  session_id UUID,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_program ON sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development - adjust for production)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on programs" ON programs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on enrollments" ON enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cell_groups" ON cell_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cell_members" ON cell_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on assignment_submissions" ON assignment_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on attendance_records" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on payment_records" ON payment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Insert sample program data
INSERT INTO programs (id, name, description, enrollment_start_date, enrollment_end_date, program_start_date, is_active, min_cell_size, max_cell_size)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'BeThatMan', 'An 8-session program designed for men to develop authentic manhood through biblical principles covering fathering, courage, faithfulness, and more.', '2026-01-01', '2026-02-15', '2026-02-28', true, 5, 12),
  ('22222222-2222-2222-2222-222222222222', 'Foundations of Faith', 'An 8-week journey through core Christian beliefs and practices for new believers.', '2026-01-15', '2026-02-28', '2026-03-01', true, 5, 10),
  ('33333333-3333-3333-3333-333333333333', 'Leadership Development', 'A 6-week intensive program focused on developing servant leadership skills.', '2026-02-01', '2026-03-15', '2026-03-22', true, 4, 8)
ON CONFLICT DO NOTHING;

-- Insert sample sessions for BeThatMan program
INSERT INTO sessions (id, program_id, session_number, date, title, overview, topics)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1, '2026-02-28 09:00:00+00', 'Real Man Runway Overview', 'Introduction to authentic manhood and the journey ahead.', ARRAY['Understanding the Call', 'The Real Man Framework', 'Setting Personal Goals']),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 2, '2026-03-07 09:00:00+00', 'A Real Man and His Father', 'Exploring the impact of fatherhood and healing past wounds.', ARRAY['Father Wounds', 'Forgiveness Journey', 'Breaking Cycles']),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 3, '2026-03-14 09:00:00+00', 'A Real Man and His Courage', 'Developing biblical courage in daily life decisions.', ARRAY['Fear vs Courage', 'Standing for Truth', 'Practical Courage']),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 4, '2026-03-21 09:00:00+00', 'A Real Man and His Faith', 'Deepening spiritual foundations and relationship with God.', ARRAY['Daily Devotion', 'Prayer Life', 'Scripture Study']),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 5, '2026-03-28 09:00:00+00', 'A Real Man and His Family', 'Building strong family relationships and leading at home.', ARRAY['Husband Role', 'Fathering Well', 'Family Priorities'])
ON CONFLICT DO NOTHING;
