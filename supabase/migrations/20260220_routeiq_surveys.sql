-- Migration: RouteIQ Digital Surveys (Phase 4 SaaS Extension)

-- 1. SaaS Subscriptions
CREATE TABLE public.subscription_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price_cents INT NOT NULL,              -- e.g., 4900 for $49.00
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    features JSONB,
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.subscription_tiers (name, price_cents, features)
VALUES (
    'Pro Pilot (RouteIQ)', 4900, 
    '["Unlimited Digital Surveys", "DOT PDF Export", "Offline Mode", "Priority Directory Listing"]'::jsonb
);

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_user_subs_active ON public.user_subscriptions(user_id) WHERE status = 'active';

-- 2. Digital Surveys Core
CREATE TABLE public.digital_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,                   -- e.g., "I-10 E Houston to Beaumont"
    start_lat NUMERIC(10, 7),
    start_lng NUMERIC(10, 7),
    end_lat NUMERIC(10, 7),
    end_lng NUMERIC(10, 7),
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'exported')),
    pdf_url TEXT,                         -- Generated DOT report
    exported_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Survey Waypoints (Obstacles / Pin Drops)
CREATE TABLE public.digital_survey_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES public.digital_surveys(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    
    obstacle_type TEXT NOT NULL CHECK (obstacle_type IN ('bridge', 'lines', 'turn', 'railroad', 'construction', 'other')),
    measured_height_inches INT,           -- The height pole trigger
    measured_width_inches INT,

    notes TEXT,
    photo_url TEXT,                       -- Evidence of the obstacle
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ds_waypoints_survey ON public.digital_survey_waypoints(survey_id);

-- RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_survey_waypoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription Tiers viewable by all Auth"
    ON public.subscription_tiers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own subscriptions"
    ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own digital surveys"
    ON public.digital_surveys 
    FOR ALL TO authenticated USING (auth.uid() = operator_id);

CREATE POLICY "Users can manage their own waypoints via survey join"
    ON public.digital_survey_waypoints
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.digital_surveys 
            WHERE id = digital_survey_waypoints.survey_id AND operator_id = auth.uid()
        )
    );
