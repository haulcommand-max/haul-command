-- ============================================================
-- Anti-Gravity Execute Migration
-- FCM Push Tokens, PR Automation, UGC Safeguards, i18n
-- ============================================================

-- 1) i18n: Add locale_preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale_preference text DEFAULT 'en-US';

-- 2) FCM Push Tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token text NOT NULL,
    platform text NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    locale text DEFAULT 'en-US',
    region text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON public.push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_push_tokens_region ON public.push_tokens(region);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens" ON public.push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- 3) PR Automation: Requests (inbound HARO/Connectively queries)
CREATE TABLE IF NOT EXISTS public.pr_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source text NOT NULL DEFAULT 'connectively',  -- connectively, haro, manual
    external_id text,
    subject text NOT NULL,
    body text,
    journalist_name text,
    journalist_email text,
    outlet_name text,
    deadline timestamptz,
    topics text[] DEFAULT '{}',
    geo_scope text[] DEFAULT '{US,CA}',
    relevance_score numeric(4,2) DEFAULT 0,
    status text DEFAULT 'new' CHECK (status IN ('new', 'relevant', 'irrelevant', 'drafted', 'submitted', 'won', 'expired')),
    ingested_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_requests_status ON public.pr_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_requests_relevance ON public.pr_requests(relevance_score DESC);

ALTER TABLE public.pr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage PR requests" ON public.pr_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    );

-- 4) PR Automation: Drafts
CREATE TABLE IF NOT EXISTS public.pr_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid REFERENCES public.pr_requests(id) ON DELETE CASCADE,
    draft_body text NOT NULL,
    confidence numeric(4,2) DEFAULT 0,
    auto_generated boolean DEFAULT true,
    approved boolean DEFAULT false,
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_drafts_request ON public.pr_drafts(request_id);

ALTER TABLE public.pr_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage PR drafts" ON public.pr_drafts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    );

-- 5) PR Automation: Submissions
CREATE TABLE IF NOT EXISTS public.pr_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid REFERENCES public.pr_requests(id) ON DELETE CASCADE,
    draft_id uuid REFERENCES public.pr_drafts(id),
    submitted_at timestamptz DEFAULT now(),
    method text DEFAULT 'email',  -- email, form, api
    status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'published', 'rejected', 'no_response')),
    backlink_url text,
    outlet_name text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pr_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage PR submissions" ON public.pr_submissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    );

-- 6) UGC Safeguards: Content Reports
CREATE TABLE IF NOT EXISTS public.content_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid REFERENCES auth.users(id),
    reported_entity_type text NOT NULL CHECK (reported_entity_type IN ('profile', 'load', 'review', 'message', 'comment')),
    reported_entity_id uuid NOT NULL,
    reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'fraud', 'inappropriate', 'illegal', 'impersonation', 'other')),
    details text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamptz,
    action_taken text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_entity ON public.content_reports(reported_entity_type, reported_entity_id);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Staff can manage reports" ON public.content_reports
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    );

-- 7) UGC Safeguards: User Blocks
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blocks" ON public.user_blocks
    FOR ALL USING (auth.uid() = blocker_id);

-- 8) UGC Safeguards: Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 9) UGC: Terms acceptance tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS content_policy_accepted_at timestamptz;
