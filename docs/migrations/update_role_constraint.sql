-- Migration: Allow platform_admin role
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE users ADD CONSTRAINT valid_role CHECK (role IN ('platform_admin', 'system_admin', 'program_admin', 'facilitator', 'participant'));

-- Verify current roles in the system
SELECT email, role FROM users;
