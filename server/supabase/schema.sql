-- ==============================================================================
-- TrustShield AI - Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================
-- Theme: AI Security, Privacy & Trust
-- Privacy Compliance: Strict Zero-Retention Protocol
-- NOTE: Raw input texts and redacted contents are analyzed in ephemeral RAM and 
-- NEVER persisted to database tables. Only anonymized metrics are logged.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'security_officer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Case-insensitive unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (LOWER(email));

-- ------------------------------------------------------------------------------
-- 2. Analyses Table (Metadata & Telemetry ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    original_length INTEGER NOT NULL CHECK (original_length >= 0),
    threat_score INTEGER NOT NULL CHECK (threat_score >= 0 AND threat_score <= 100),
    threat_type VARCHAR(100) NOT NULL,
    pii_entities_count INTEGER DEFAULT 0 CHECK (pii_entities_count >= 0),
    processing_time_ms INTEGER DEFAULT 0 CHECK (processing_time_ms >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance and query indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_threat_score ON public.analyses(threat_score);
CREATE INDEX IF NOT EXISTS idx_analyses_threat_type ON public.analyses(threat_type);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Allow Service Role key full administrative access (Backend Express API)
CREATE POLICY "Service role full access on users"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on analyses"
    ON public.analyses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to view only their own user data
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow authenticated users to view only their own analysis telemetry
CREATE POLICY "Users can view own analyses"
    ON public.analyses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert analysis records linked to their id
CREATE POLICY "Users can insert own analyses"
    ON public.analyses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Initial Seed Data (Optional Test Analyst)
-- ------------------------------------------------------------------------------
-- Seed default demo analyst (Password: TrustShield2026!)
-- Hash generated via bcrypt (10 rounds)
INSERT INTO public.users (name, email, password_hash, role)
VALUES (
    'Demo Security Analyst',
    'demo.analyst@trustshield.io',
    '$2a$10$iI8G6U4qU.yA379/1aD3Z.5g7P4w2QfTzG7bL9aC4yV8sN3b1u0Ze',
    'security_officer'
)
ON CONFLICT (email) DO NOTHING;
