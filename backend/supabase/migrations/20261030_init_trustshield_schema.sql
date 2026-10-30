-- Migration: 20261030_init_trustshield_schema
-- Description: Creates initial users and analyses tables with RLS and indexes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'security_officer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (LOWER(email));

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

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_threat_score ON public.analyses(threat_score);
CREATE INDEX IF NOT EXISTS idx_analyses_threat_type ON public.analyses(threat_type);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on users"
    ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on analyses"
    ON public.analyses FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can view own analyses"
    ON public.analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
    ON public.analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

