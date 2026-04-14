-- ============================================
-- ChurchPrograms Pro - Database Schema (FINAL STABLE VERSION)
-- ============================================

-- Force search path to public
SET search_path TO public, extensions;

-- CLEANUP: Drop all existing Views and Tables in public schema
DO $$ DECLARE
    r RECORD;
BEGIN
    -- Drop views first
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    -- Drop tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Fix roles search path (CRITICAL for Supabase API to find your tables)
ALTER ROLE anon SET search_path = public, extensions;
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE postgres SET search_path = public, extensions;
ALTER ROLE service_role SET search_path = public, extensions;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Fix roles to have default access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PLATFORM MANAGEMENT TABLES
-- ============================================

-- Subscription plans configuration
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- starter, professional, enterprise
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    price_monthly_usd DECIMAL(10,2) NOT NULL,
    price_yearly_usd DECIMAL(10,2) NOT NULL,
    price_monthly_local DECIMAL(10,2), -- Local currency (e.g., ZWL)
    price_yearly_local DECIMAL(10,2),
    currency_local VARCHAR(3), -- ZWL, ZAR, etc.
    
    -- Limits
    max_participants INTEGER NOT NULL,
    max_programs INTEGER NOT NULL,
    max_admins INTEGER DEFAULT 5,
    storage_gb INTEGER DEFAULT 10,
    
    -- Features (JSONB for flexibility)
    features JSONB NOT NULL DEFAULT '{
        "assignments": true,
        "certificates": true,
        "badges": true,
        "custom_domain": false,
        "api_access": false,
        "white_label_apps": false,
        "priority_support": false,
        "custom_reports": false,
        "sso": false
    }'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true, -- Show on pricing page
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly_usd, price_yearly_usd, max_participants, max_programs, features) VALUES
('starter', 'Starter', 'Perfect for small groups', 15.00, 150.00, 50, 1, '{"assignments": false, "certificates": true, "badges": true}'::jsonb),
('professional', 'Professional', 'For growing churches', 40.00, 400.00, 200, 999, '{"assignments": true, "certificates": true, "badges": true, "custom_reports": true}'::jsonb),
('enterprise', 'Enterprise', 'Unlimited scale', 100.00, 1000.00, 999999, 999, '{"assignments": true, "certificates": true, "badges": true, "custom_domain": true, "api_access": true, "white_label_apps": true, "priority_support": true, "custom_reports": true}'::jsonb);

-- Platform super administrators (Etechzim team)
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'support', -- superadmin, support, sales
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_platform_role CHECK (role IN ('superadmin', 'support', 'sales'))
);

-- Platform-wide settings
CREATE TABLE platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES platform_admins(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORGANIZATION (TENANT) TABLES
-- ============================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE, -- for subdomain
    description TEXT,
    
    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#4F46E5',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    favicon_url TEXT,
    custom_domain VARCHAR(255) UNIQUE, -- premium feature
    
    -- Contact
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'Africa/Harare',
    
    -- Configuration
    default_currency VARCHAR(3) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    
    -- Features enabled for this org (from subscription)
    features_enabled JSONB DEFAULT '{}'::jsonb,
    
    -- Settings
    settings JSONB DEFAULT '{
        "require_email_verification": true,
        "allow_self_enrollment": true,
        "enable_rsvp": true,
        "enable_location_check": false,
        "payment_methods": ["ecocash", "paynow", "cash"],
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        }
    }'::jsonb,
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1, -- Current onboarding step
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspended_reason TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    
    -- Mobile App Registration
    join_code VARCHAR(10) UNIQUE,
    
    -- Metadata
    created_by UUID, -- Platform admin who created (if not self-signup)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_organizations_join_code ON organizations(join_code);

-- Organization subscriptions
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription details
    status VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, past_due, cancelled, expired
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, yearly
    
    -- Pricing (captured at subscription time, may differ from current plan)
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Trial
    trial_starts_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Billing period
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Cancellation
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancel_at_period_end BOOLEAN DEFAULT false,
    
    -- Payment
    last_payment_at TIMESTAMP WITH TIME ZONE,
    last_payment_amount DECIMAL(10,2),
    next_payment_due TIMESTAMP WITH TIME ZONE,
    
    -- External references (Stripe, PayPal, etc.)
    external_subscription_id VARCHAR(255),
    external_customer_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_subscription_status CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX idx_org_subs_organization ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subs_status ON organization_subscriptions(status);

-- ============================================
-- USER MANAGEMENT
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash TEXT, -- Optional when using external auth like Supabase
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Password reset
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Role
    role VARCHAR(50) NOT NULL DEFAULT 'participant',
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    title VARCHAR(20), -- Mr, Mrs, Dr, Pastor, Rev, etc.
    preferred_name VARCHAR(100),
    
    -- Additional Info
    dob DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    church_name VARCHAR(255),
    
    -- Contact
    phone_number VARCHAR(50),
    whatsapp_number VARCHAR(50),
    residential_address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Profile
    profile_photo_url TEXT,
    bio TEXT,
    
    -- Preferences
    notification_preferences JSONB DEFAULT '{
        "email_enabled": true,
        "push_enabled": true,
        "sms_enabled": false,
        "session_reminders": true,
        "assignment_reminders": true,
        "badge_notifications": true,
        "newsletter": true
    }'::jsonb,
    
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspended_reason TEXT,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_role CHECK (role IN ('system_admin', 'program_admin', 'facilitator', 'participant')),
    CONSTRAINT unique_email_per_org UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('program_admin', 'facilitator')),
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_active_invite UNIQUE(organization_id, email)
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_org ON invitations(organization_id);

-- ============================================
-- PROGRAM STRUCTURE
-- ============================================

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- discipleship, membership, leadership, etc.
    
    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Pricing
    enrollment_fee DECIMAL(10,2) DEFAULT 0.00,
    session_fee DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Capacity
    max_participants INTEGER,
    min_participants INTEGER,
    
    -- Requirements
    attendance_required_pct INTEGER DEFAULT 80, -- % needed for certificate
    assignment_completion_required_pct INTEGER DEFAULT 0,
    
    -- Features enabled for this program
    features JSONB DEFAULT '{
        "assignments_enabled": true,
        "certificates_enabled": true,
        "badges_enabled": true,
        "qr_checkin_required": true,
        "payment_required": true,
        "rsvp_enabled": true,
        "approval_required": false
    }'::jsonb,
    
    -- Program image/banner
    image_url TEXT,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, completed, archived
    is_visible BOOLEAN DEFAULT true, -- Show on enrollment page
    
    -- Template reference (if created from template)
    template_id UUID,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_program_status CHECK (status IN ('draft', 'active', 'completed', 'archived'))
);

CREATE INDEX idx_programs_organization ON programs(organization_id);
CREATE INDEX idx_programs_status ON programs(status);

-- Sessions within programs
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    session_number INTEGER, -- e.g., Session 1, 2, 3
    
    -- Schedule
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Location
    location_type VARCHAR(20) DEFAULT 'physical', -- physical, virtual, hybrid
    location VARCHAR(255),
    virtual_link TEXT, -- Zoom, Teams, Google Meet link
    
    -- QR Code
    qr_code_data TEXT UNIQUE NOT NULL,
    qr_code_url TEXT, -- URL to QR code image
    
    -- Check-in rules
    checkin_starts_minutes_before INTEGER DEFAULT 30,
    checkin_ends_minutes_after INTEGER DEFAULT 60,
    checkout_enabled_from TIME DEFAULT '11:00:00',
    late_arrival_cutoff_minutes INTEGER DEFAULT 15,
    
    -- Geofencing (optional)
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    geofence_radius_meters INTEGER DEFAULT 100,
    
    -- Facilitator
    facilitator_id UUID REFERENCES users(id),
    co_facilitators UUID[], -- Array of user IDs
    
    -- Capacity
    max_capacity INTEGER,
    
    -- Materials
    materials JSONB, -- [{name, url, type}]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_cancelled BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_location_type CHECK (location_type IN ('physical', 'virtual', 'hybrid'))
);

CREATE INDEX idx_sessions_organization ON sessions(organization_id);
CREATE INDEX idx_sessions_program ON sessions(program_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_facilitator ON sessions(facilitator_id);

-- ============================================
-- ENROLLMENT & PAYMENTS
-- ============================================

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Enrollment details
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    enrollment_source VARCHAR(100), -- website, mobile_app, admin, import
    field_of_contact VARCHAR(255), -- How they heard about program
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, refunded
    amount_due DECIMAL(10,2) DEFAULT 0.00,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    
    -- QR Code (unique per enrollment)
    qr_code_data TEXT UNIQUE NOT NULL,
    qr_code_url TEXT,
    
    -- Approval (if program requires it)
    approval_status VARCHAR(50) DEFAULT 'approved', -- pending, approved, rejected
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, withdrawn, completed, expelled
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    withdrawal_reason TEXT,
    completion_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_enrollment UNIQUE(user_id, program_id),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT valid_enrollment_status CHECK (status IN ('active', 'pending', 'withdrawn', 'completed', 'expelled'))
);

CREATE INDEX idx_enrollments_organization ON enrollments(organization_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_program ON enrollments(program_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Session-specific enrollments (if sessions have individual fees)
CREATE TABLE session_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    payment_status VARCHAR(50) DEFAULT 'pending',
    amount_due DECIMAL(10,2) DEFAULT 0.00,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_session_enrollment UNIQUE(enrollment_id, session_id)
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    session_enrollment_id UUID REFERENCES session_enrollments(id) ON DELETE SET NULL,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment method
    payment_method VARCHAR(50) NOT NULL, -- ecocash, paynow, paypal, stripe, cash, bank_transfer
    payment_gateway VARCHAR(50), -- ecocash, paynow, etc.
    
    -- Receipt
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    
    -- External references
    transaction_reference VARCHAR(255), -- Gateway transaction ID
    external_id VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    
    -- Payment timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional info
    payer_name VARCHAR(255),
    payer_email VARCHAR(255),
    payer_phone VARCHAR(50),
    
    -- Failure/refund details
    failure_reason TEXT,
    refund_reason TEXT,
    refund_amount DECIMAL(10,2),
    
    -- Notes
    notes TEXT,
    metadata JSONB, -- Store gateway-specific data
    
    -- Admin who processed (if manual)
    processed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'))
);

CREATE INDEX idx_payments_organization ON payments(organization_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);

-- ============================================
-- ATTENDANCE TRACKING
-- ============================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    
    -- Check-in
    checked_in BOOLEAN DEFAULT false,
    checkin_time TIMESTAMP WITH TIME ZONE,
    checkin_method VARCHAR(20), -- qr, manual, code
    checkin_location_lat DECIMAL(10, 8),
    checkin_location_lng DECIMAL(11, 8),
    checkin_device_info TEXT,
    
    -- Check-out
    checked_out BOOLEAN DEFAULT false,
    checkout_time TIMESTAMP WITH TIME ZONE,
    checkout_method VARCHAR(20),
    checkout_location_lat DECIMAL(10, 8),
    checkout_location_lng DECIMAL(11, 8),
    
    -- Calculated fields
    duration_minutes INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'absent', -- present, absent, late, excused
    
    -- Notes
    notes TEXT,
    excused_reason TEXT,
    excused_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_attendance UNIQUE(user_id, session_id),
    CONSTRAINT valid_attendance_status CHECK (status IN ('present', 'absent', 'late', 'excused'))
);

CREATE INDEX idx_attendance_organization ON attendance(organization_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ============================================
-- ASSIGNMENTS
-- ============================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Timing
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    allow_late_submission BOOLEAN DEFAULT false,
    late_submission_penalty_pct INTEGER DEFAULT 0,
    
    -- Grading
    max_score INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    
    -- Files
    assignment_file_url TEXT,
    
    -- Status
    is_required BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_organization ON assignments(organization_id);
CREATE INDEX idx_assignments_session ON assignments(session_id);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Submission
    submission_text TEXT,
    submission_files JSONB, -- [{name, url, size, type}]
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT false,
    
    -- Grading
    score INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'submitted', -- draft, submitted, graded, returned
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_submission UNIQUE(assignment_id, user_id),
    CONSTRAINT valid_submission_status CHECK (status IN ('draft', 'submitted', 'graded', 'returned'))
);

CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_user ON assignment_submissions(user_id);

-- ============================================
-- GAMIFICATION
-- ============================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    -- Badge type
    badge_type VARCHAR(50), -- attendance, assignment, engagement, custom
    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
    
    -- Criteria (JSONB for flexibility)
    criteria JSONB, -- {type: 'attendance_count', value: 5}
    
    -- Display
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_organization ON badges(organization_id);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    
    -- Context
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id UUID REFERENCES sessions(id),
    assignment_id UUID REFERENCES assignments(id),
    
    -- Display
    is_featured BOOLEAN DEFAULT false, -- Show on profile
    
    CONSTRAINT unique_user_badge UNIQUE(user_id, badge_id, session_id, assignment_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Certificate details
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    certificate_type VARCHAR(50), -- completion, excellence, participation
    
    -- Verification
    verification_code VARCHAR(50) NOT NULL UNIQUE,
    verification_url TEXT,
    qr_code_url TEXT,
    
    -- Issue
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    issued_by UUID REFERENCES users(id),
    
    -- PDF
    certificate_url TEXT, -- URL to generated PDF
    template_id UUID, -- Reference to certificate template used
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_program ON certificates(program_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_verification ON certificates(verification_code);

-- ============================================
-- COMMUNICATION
-- ============================================

CREATE TABLE news_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- Media
    featured_image_url TEXT,
    
    -- Targeting
    program_id UUID REFERENCES programs(id), -- NULL = all programs
    target_roles TEXT[], -- ['participant', 'facilitator'] or NULL = all
    
    -- Publishing
    author_id UUID REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    
    -- Engagement
    views_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_organization ON news_posts(organization_id);
CREATE INDEX idx_news_program ON news_posts(program_id);
CREATE INDEX idx_news_published ON news_posts(is_published, published_at);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Type
    notification_type VARCHAR(50) NOT NULL, -- session_reminder, assignment_due, badge_earned, etc.
    
    -- Related entities
    related_entity_type VARCHAR(50), -- session, assignment, enrollment, etc.
    related_entity_id UUID,
    
    -- Action
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Delivery
    channels TEXT[] DEFAULT ARRAY['push'], -- push, email, sms
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_sent BOOLEAN DEFAULT false,
    push_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

CREATE TABLE rsvp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Response
    response VARCHAR(50) NOT NULL, -- attending, maybe, not_attending
    
    -- Timestamps
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_rsvp UNIQUE(user_id, session_id),
    CONSTRAINT valid_rsvp_response CHECK (response IN ('attending', 'maybe', 'not_attending'))
);

CREATE INDEX idx_rsvp_session ON rsvp(session_id);
CREATE INDEX idx_rsvp_user ON rsvp(user_id);

-- ============================================
-- FEEDBACK
-- ============================================

CREATE TABLE feedback_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id), -- NULL = organization-wide
    
    -- Form details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feedback_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    
    -- Question
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'likert', -- likert, text, rating, multiple_choice
    
    -- Options (for multiple choice)
    options TEXT[], -- ['Option 1', 'Option 2']
    
    -- Validation
    is_required BOOLEAN DEFAULT true,
    min_length INTEGER,
    max_length INTEGER,
    
    -- Display
    question_order INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_questions_form ON feedback_questions(form_id);

CREATE TABLE feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES feedback_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if anonymous
    
    -- Response
    response_value VARCHAR(50), -- strongly_agree, agree, neutral, disagree, strongly_disagree
    response_text TEXT,
    response_number INTEGER,
    
    -- Metadata
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_responses_form ON feedback_responses(form_id);
CREATE INDEX idx_feedback_responses_user ON feedback_responses(user_id);

-- ============================================
-- AUDIT & LOGGING
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, etc.
    entity_type VARCHAR(100), -- program, session, enrollment, etc.
    entity_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Request info
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_organization ON audit_log(organization_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- ANALYTICS & TRACKING
-- ============================================

CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity
    activity_type VARCHAR(100) NOT NULL, -- page_view, feature_use, etc.
    page_url TEXT,
    feature_name VARCHAR(100),
    
    -- Session
    session_id VARCHAR(100),
    
    -- Device
    device_type VARCHAR(50), -- mobile, tablet, desktop
    os VARCHAR(50),
    browser VARCHAR(50),
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_activity_organization ON user_activity(organization_id);
CREATE INDEX idx_user_activity_user ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created ON user_activity(created_at);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate attendance duration
CREATE OR REPLACE FUNCTION calculate_attendance_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.checkout_time IS NOT NULL AND NEW.checkin_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.checkout_time - NEW.checkin_time)) / 60;
        IF NEW.status = 'absent' THEN
            NEW.status = 'present';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_attendance_duration
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_attendance_duration();

-- Update enrollment payment status based on payments
CREATE OR REPLACE FUNCTION update_enrollment_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10,2);
    amount_due DECIMAL(10,2);
BEGIN
    IF NEW.status = 'completed' AND NEW.enrollment_id IS NOT NULL THEN
        -- Calculate total paid for this enrollment
        SELECT COALESCE(SUM(amount), 0) INTO total_paid
        FROM payments
        WHERE enrollment_id = NEW.enrollment_id AND status = 'completed';
        
        -- Get amount due
        SELECT enrollments.amount_due INTO amount_due
        FROM enrollments
        WHERE id = NEW.enrollment_id;
        
        -- Update payment status
        UPDATE enrollments
        SET 
            amount_paid = total_paid,
            payment_status = CASE
                WHEN total_paid >= amount_due THEN 'paid'
                WHEN total_paid > 0 THEN 'partial'
                ELSE 'pending'
            END
        WHERE id = NEW.enrollment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_enrollment_payment
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_payment_status();

-- ============================================
-- SECURITY FUNCTIONS (To prevent RLS recursion)
-- ============================================

CREATE OR REPLACE FUNCTION current_user_org_id() 
RETURNS UUID AS $$
    SELECT organization_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_role() 
RETURNS VARCHAR AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - DISABLED FOR DEMO
-- ============================================

-- We don't need ALTER TABLE ... DISABLE RLS if we never enable it.
-- But we ensure it's off just in case.
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Participant dashboard summary view
CREATE VIEW participant_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.organization_id,
    u.first_name,
    u.surname,
    COUNT(DISTINCT e.id) as programs_enrolled,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'present') as sessions_attended,
    COUNT(DISTINCT s.id) as total_sessions_available,
    COUNT(DISTINCT ub.id) as badges_earned,
    COUNT(DISTINCT c.id) as certificates_earned,
    COUNT(DISTINCT asub.id) as assignments_submitted,
    COUNT(DISTINCT asg.id) as total_assignments,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT s.id) > 0 
            THEN (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'present')::DECIMAL / COUNT(DISTINCT s.id)) * 100
            ELSE 0
        END, 2
    ) as attendance_percentage
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'active'
LEFT JOIN programs p ON e.program_id = p.id
LEFT JOIN sessions s ON p.id = s.program_id
LEFT JOIN attendance a ON u.id = a.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN certificates c ON u.id = c.user_id
LEFT JOIN assignment_submissions asub ON u.id = asub.user_id
LEFT JOIN assignments asg ON asub.assignment_id = asg.id
WHERE u.role = 'participant'
GROUP BY u.id, u.organization_id, u.first_name, u.surname;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_attendance_user_session ON attendance(user_id, session_id);
CREATE INDEX idx_attendance_org_session ON attendance(organization_id, session_id);
CREATE INDEX idx_enrollments_user_program ON enrollments(user_id, program_id);
CREATE INDEX idx_payments_org_status ON payments(organization_id, status);
CREATE INDEX idx_sessions_program_date ON sessions(program_id, session_date);

-- Full-text search indexes (if using PostgreSQL full-text search)
CREATE INDEX idx_programs_name_search ON programs USING gin(to_tsvector('english', name));
CREATE INDEX idx_users_name_search ON users USING gin(to_tsvector('english', first_name || ' ' || surname));

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert a demo organization
INSERT INTO organizations (name, slug, contact_email, primary_color, secondary_color)
VALUES ('Demo Church', 'demo', 'admin@demo.org', '#4F46E5', '#10B981');

-- ============================================
-- GRANTS - Fix for permissions and API access
-- ============================================

-- Grant schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Grant table access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;

-- Grant sequence access (for IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;

-- Grant function access
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, anon, authenticated;

-- FORCE POSTGREST SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

-- ============================================
-- DATABASE SCHEMA COMPLETE
-- ============================================
