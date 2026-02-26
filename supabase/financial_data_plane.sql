-- ============================================================
-- HC-GIS PLANE 3: FINANCIAL + DATA PLANE
-- The Money Rail + Data Monopoly Layer
-- ============================================================
-- "Revenue isn't a feature. It's a layer."
-- Every transaction, every subscription, every piece of data.
-- The infrastructure that makes money move + the intelligence
-- that makes the entire platform irreplaceable.
-- ============================================================

-- ============================================================
-- PART A: MONEY RAIL
-- ============================================================
-- Subscriptions, transactions, escrow, payouts, invoicing.
-- Feeds: S7, S8, S9, S10, S14, S15, S16, S18, S19

-- ============================================================
-- TABLE 1: SUBSCRIPTION (The Recurring Revenue Engine)
-- ============================================================
CREATE TABLE subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id),

    -- Tier
    tier TEXT NOT NULL,                               -- FREE, STARTER, PRO, COMMAND, BROKER_PRO, ENTERPRISE
    tier_name TEXT,                                    -- Display name

    -- Pricing
    monthly_price_cents BIGINT DEFAULT 0,
    annual_price_cents BIGINT DEFAULT 0,
    billing_cycle TEXT DEFAULT 'MONTHLY',             -- MONTHLY, ANNUAL
    discount_percent NUMERIC(5,2) DEFAULT 0,

    -- Access limits
    free_checks_remaining INTEGER DEFAULT 3,          -- Movement Decision AI free checks
    monthly_check_limit INTEGER,                       -- NULL = unlimited
    api_access BOOLEAN DEFAULT FALSE,
    marketplace_access BOOLEAN DEFAULT FALSE,
    escrow_access BOOLEAN DEFAULT FALSE,
    certificate_access BOOLEAN DEFAULT FALSE,

    -- Status
    status TEXT DEFAULT 'ACTIVE',                     -- ACTIVE, PAST_DUE, CANCELLED, PAUSED, TRIAL
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Payment method
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    payment_method_type TEXT,                          -- CARD, ACH, INVOICE

    -- Metadata
    features JSONB,                                    -- Feature flags for this tier
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier definitions (reference data)
CREATE TABLE subscription_tier (
    id TEXT PRIMARY KEY,                               -- FREE, STARTER, PRO, COMMAND, BROKER_PRO, ENTERPRISE
    name TEXT NOT NULL,
    description TEXT,
    monthly_price_cents BIGINT DEFAULT 0,
    annual_price_cents BIGINT DEFAULT 0,
    sort_order INTEGER,

    -- Limits
    monthly_check_limit INTEGER,                       -- NULL = unlimited
    api_access BOOLEAN DEFAULT FALSE,
    marketplace_access BOOLEAN DEFAULT FALSE,
    escrow_access BOOLEAN DEFAULT FALSE,
    certificate_access BOOLEAN DEFAULT FALSE,
    police_layer BOOLEAN DEFAULT FALSE,
    superload_layer BOOLEAN DEFAULT FALSE,
    utility_layer BOOLEAN DEFAULT FALSE,
    broker_tools BOOLEAN DEFAULT FALSE,
    custom_corridors BOOLEAN DEFAULT FALSE,

    -- Display
    badge_color TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    features_list JSONB,                              -- Array of feature strings for display

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed tier definitions
INSERT INTO subscription_tier (id, name, description, monthly_price_cents, annual_price_cents, sort_order, monthly_check_limit, api_access, marketplace_access, escrow_access, certificate_access, police_layer, superload_layer, utility_layer, broker_tools, custom_corridors, badge_color, is_popular, features_list) VALUES
('FREE',        'Free',           '3 movement checks per month. See what you''re missing.',
    0,        0,       1,  3,     FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, '#6B7280', FALSE,
    '["3 movement intelligence checks/mo", "Basic dimension lookup", "State permit directory"]'::jsonb),
('STARTER',     'Starter',        '50-state cheat sheet + basic intelligence access.',
    900,      9000,    2,  25,    FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, '#3B82F6', FALSE,
    '["25 movement intelligence checks/mo", "50-state regulatory cheat sheet (PDF)", "Email support", "Escort requirement lookup"]'::jsonb),
('PRO',         'Pro',            'Full Movement Intelligence. The industry edge.',
    1900,     19000,   3,  NULL,  FALSE, TRUE,  FALSE, TRUE,  FALSE, FALSE, FALSE, FALSE, FALSE, '#8B5CF6', TRUE,
    '["Unlimited movement intelligence", "Movement Approval Certificate™", "Escort marketplace access", "Real-time escort matching", "Priority support"]'::jsonb),
('COMMAND',     'Command',        'Police + Superload + Utility layers. Complete control.',
    3900,     39000,   4,  NULL,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, FALSE, '#F59E0B', FALSE,
    '["Everything in Pro", "Police coordination layer", "Superload analysis", "Utility crew scheduling", "Escrow payments", "API access", "Dedicated support"]'::jsonb),
('BROKER_PRO',  'Broker Pro',     'Broker + Carrier marketplace. Escrow + matching.',
    14900,    149000,  5,  NULL,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, '#EF4444', FALSE,
    '["Everything in Command", "Broker load board", "Carrier matching algorithm", "Escrow management", "Invoice generation", "Settlement reports", "White-label certificates"]'::jsonb),
('ENTERPRISE',  'Enterprise',     'Wind, Port, Custom corridors. Bespoke infrastructure.',
    0,        0,       6,  NULL,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  '#1F2937', FALSE,
    '["Everything in Broker Pro", "Custom corridor intelligence", "Wind farm / port logistics", "Dedicated account team", "Custom API integrations", "SLA guarantees", "Volume pricing"]'::jsonb);


-- ============================================================
-- TABLE 2: TRANSACTION LEDGER (Every Dollar Tracked)
-- ============================================================
CREATE TABLE transaction_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    payer_id UUID REFERENCES operator_profile(id),
    payee_id UUID REFERENCES operator_profile(id),

    -- What
    transaction_type TEXT NOT NULL,                   -- SUBSCRIPTION, ESCORT_PAYMENT, POLICE_FEE, PERMIT_FEE, PLATFORM_FEE, ESCROW_DEPOSIT, ESCROW_RELEASE, PAYOUT, FACTORING_FEE, REFERRAL_FEE, STORE_PURCHASE, INSURANCE_REFERRAL
    reference_type TEXT,                              -- LOAD, CONTRACT, SUBSCRIPTION, PERMIT, INVOICE
    reference_id UUID,                                -- FK to the related entity

    -- Money
    amount_cents BIGINT NOT NULL,
    currency TEXT DEFAULT 'USD',
    direction TEXT NOT NULL,                          -- CREDIT, DEBIT

    -- HC Revenue
    platform_fee_cents BIGINT DEFAULT 0,              -- What HC earns
    platform_fee_percent NUMERIC(5,2),

    -- Status
    status TEXT DEFAULT 'PENDING',                    -- PENDING, COMPLETED, FAILED, REFUNDED, DISPUTED
    processed_at TIMESTAMPTZ,
    failed_reason TEXT,

    -- Payment processing
    stripe_payment_id TEXT,
    stripe_transfer_id TEXT,
    payment_method TEXT,

    -- Metadata
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 3: ESCROW HOLD (Trust Layer)
-- ============================================================
-- Funds held until movement completion.
-- This is how you become the payment default.
CREATE TABLE escrow_hold (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES active_load(id),
    contract_id UUID REFERENCES load_contract(id),

    -- Parties
    depositor_id UUID NOT NULL REFERENCES operator_profile(id),  -- Who put money in
    beneficiary_id UUID NOT NULL REFERENCES operator_profile(id), -- Who gets paid

    -- Amount
    amount_cents BIGINT NOT NULL,
    platform_fee_cents BIGINT DEFAULT 0,
    net_payout_cents BIGINT,                          -- amount - platform_fee

    -- Status
    status TEXT DEFAULT 'HELD',                       -- HELD, RELEASED, DISPUTED, REFUNDED, PARTIAL_RELEASE
    held_at TIMESTAMPTZ DEFAULT NOW(),
    release_condition TEXT,                            -- DELIVERY_CONFIRMED, MANUAL_RELEASE, AUTO_48H
    released_at TIMESTAMPTZ,
    released_by UUID REFERENCES operator_profile(id),

    -- Auto-release
    auto_release_at TIMESTAMPTZ,                      -- 48hr after completion trigger
    auto_release_enabled BOOLEAN DEFAULT TRUE,

    -- Dispute
    disputed_at TIMESTAMPTZ,
    dispute_reason TEXT,
    dispute_resolution TEXT,
    resolved_at TIMESTAMPTZ,

    -- Payment
    payout_id UUID,                                   -- FK to payout when released
    stripe_payment_intent_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 4: FEE SCHEDULE (Compound Payments)
-- ============================================================
-- Every fee type in the system.
-- Police admin fee, utility fee, permit referral fee,
-- factoring fee, insurance referral fee.
CREATE TABLE fee_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_code TEXT UNIQUE NOT NULL,                    -- ESCORT_MATCH, POLICE_ADMIN, UTILITY_COORD, PERMIT_REFERRAL, FACTORING, INSURANCE_REFERRAL, STORE_COMMISSION, CERT_PROCESSING
    name TEXT NOT NULL,
    description TEXT,

    -- Fee structure
    fee_type TEXT NOT NULL,                           -- PERCENTAGE, FLAT, PER_UNIT, TIERED
    fee_percent NUMERIC(5,2),                         -- For percentage fees
    fee_flat_cents BIGINT,                            -- For flat fees
    fee_per_unit_cents BIGINT,                        -- For per-unit fees
    unit_type TEXT,                                    -- PER_MILE, PER_HOUR, PER_ESCORT, PER_PERMIT

    -- Tiered pricing (for volume discounts)
    tier_brackets JSONB,                              -- [{min: 0, max: 10, rate: 5.0}, {min: 11, max: 50, rate: 4.0}]

    -- Revenue stream mapping
    stream_id TEXT REFERENCES revenue_stream(stream_id),

    -- Limits
    minimum_fee_cents BIGINT DEFAULT 0,
    maximum_fee_cents BIGINT,
    cap_per_transaction BOOLEAN DEFAULT FALSE,

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed fee schedule
INSERT INTO fee_schedule (fee_code, name, description, fee_type, fee_percent, fee_flat_cents, stream_id) VALUES
('ESCORT_MATCH',      'Escort Match Fee',        'Platform fee on escort marketplace transactions',   'PERCENTAGE', 5.00, NULL,   'S2'),
('POLICE_ADMIN',      'Police Admin Fee',         'Administrative fee for police coordination',        'FLAT',       NULL, 2500,   'S3'),
('UTILITY_COORD',     'Utility Coordination Fee', 'Fee for arranging utility crew coordination',       'FLAT',       NULL, 5000,   'S4'),
('PERMIT_REFERRAL',   'Permit Referral Fee',      'Referral fee for permit processing services',       'PERCENTAGE', 8.00, NULL,   'S1'),
('FACTORING',         'Factoring Fee',            'Fee for same-day payment on completed loads',       'PERCENTAGE', 3.00, NULL,   'S10'),
('INSURANCE_REF',     'Insurance Referral Fee',   'Commission on insurance policy referrals',          'PERCENTAGE', 12.00, NULL,  'S9'),
('STORE_COMMISSION',  'Store Commission',         'Platform take on store product sales',              'PERCENTAGE', 15.00, NULL,  'S7'),
('CERT_PROCESSING',   'Certification Processing', 'Fee for third-party cert verification',             'FLAT',       NULL, 1500,   'S6'),
('API_OVERAGE',       'API Overage',              'Per-call fee above monthly API limit',              'PER_UNIT',   NULL, 10,     'S5'),
('SURVEY_PLATFORM',   'Survey Platform Fee',      'Platform fee on route survey assignments',          'PERCENTAGE', 10.00, NULL,  'S12');


-- ============================================================
-- TABLE 5: PAYOUT (Operator Payments)
-- ============================================================
CREATE TABLE payout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id),

    -- Amount
    gross_amount_cents BIGINT NOT NULL,
    platform_fees_cents BIGINT DEFAULT 0,
    factoring_fee_cents BIGINT DEFAULT 0,
    net_amount_cents BIGINT NOT NULL,

    -- Source
    source_type TEXT NOT NULL,                        -- ESCROW_RELEASE, DIRECT_PAYMENT, FACTORING
    source_ids UUID[],                                -- Related escrow/transaction IDs

    -- Payout method
    payout_method TEXT DEFAULT 'STANDARD',            -- STANDARD (3-5 days), INSTANT (same day), ACH
    payout_speed TEXT DEFAULT 'STANDARD',             -- STANDARD, NEXT_DAY, SAME_DAY, INSTANT

    -- Status
    status TEXT DEFAULT 'PENDING',                    -- PENDING, PROCESSING, COMPLETED, FAILED
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_reason TEXT,

    -- Stripe
    stripe_payout_id TEXT,
    stripe_transfer_id TEXT,

    -- Factoring (S10: Revenue stream)
    is_factored BOOLEAN DEFAULT FALSE,                -- Quick pay / factoring
    factoring_advance_percent NUMERIC(5,2),

    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 6: INVOICE (Enterprise Billing)
-- ============================================================
CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id),

    -- Invoice identity
    invoice_number TEXT UNIQUE NOT NULL,               -- HC-INV-2025-00001
    invoice_type TEXT DEFAULT 'STANDARD',              -- STANDARD, RECURRING, PRO_FORMA, CREDIT_NOTE

    -- Billing
    billed_to_name TEXT,
    billed_to_company TEXT,
    billed_to_email TEXT,
    billed_to_address JSONB,

    -- Line items
    line_items JSONB NOT NULL,                         -- [{description, qty, unit_price_cents, total_cents, stream_id}]
    subtotal_cents BIGINT NOT NULL,
    tax_cents BIGINT DEFAULT 0,
    discount_cents BIGINT DEFAULT 0,
    total_cents BIGINT NOT NULL,

    -- Payment
    status TEXT DEFAULT 'DRAFT',                       -- DRAFT, SENT, VIEWED, PAID, PARTIAL, OVERDUE, VOID
    due_date DATE,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    paid_amount_cents BIGINT DEFAULT 0,

    -- Payment method
    payment_method TEXT,
    stripe_invoice_id TEXT,

    -- PDF
    pdf_url TEXT,

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- PART B: DATA MONOPOLY LAYER
-- ============================================================
-- "Every action creates intelligence."
-- After 12-24 months: sell risk reports, insurance scoring API,
-- predictive delay modeling.
-- This is the long game. This is the moat.
-- Feeds: S11, S13, S17, S20

-- ============================================================
-- TABLE 7: EVENT LOG (Everything Timestamped)
-- ============================================================
-- Every significant action in the platform.
-- The raw material for intelligence.
CREATE TABLE event_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,                         -- PERMIT_CHECK, MOVEMENT_DECISION, ESCORT_MATCH, POLICE_SCHEDULE, LOAD_POST, DISPATCH, PAYMENT, LOGIN, SUBSCRIPTION_CHANGE, SCORE_UPDATE, CERT_UPLOAD, SEARCH, API_CALL

    -- Actor
    actor_id UUID REFERENCES operator_profile(id),
    actor_type TEXT,                                   -- OPERATOR, SYSTEM, API, WEBHOOK, VAPI
    actor_ip INET,

    -- Context
    resource_type TEXT,                                -- LOAD, ESCORT, PERMIT, DECISION, CONTRACT, INVOICE
    resource_id UUID,
    stream_id TEXT,                                    -- Which revenue stream this event relates to

    -- Data
    event_data JSONB,                                  -- Flexible payload

    -- Geography
    state_code TEXT,
    jurisdiction_id UUID,

    -- Performance
    duration_ms INTEGER,                               -- How long the action took

    -- Timestamp
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance at scale
-- (Commented — enable when volume justifies)
-- CREATE TABLE event_log_2025_01 PARTITION OF event_log
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');


-- ============================================================
-- TABLE 8: PERFORMANCE METRIC (Aggregated Intelligence)
-- ============================================================
-- Aggregated reliability, speed, compliance metrics.
-- Per operator, per jurisdiction, per corridor.
CREATE TABLE performance_metric (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Subject
    subject_type TEXT NOT NULL,                        -- OPERATOR, JURISDICTION, CORRIDOR, STATE, ESCORT, POLICE_UNIT
    subject_id UUID,                                   -- FK to the relevant entity
    subject_label TEXT,                                 -- Human-readable label

    -- Metric
    metric_name TEXT NOT NULL,                         -- AVG_RESPONSE_TIME, COMPLETION_RATE, ON_TIME_RATE, DISPUTE_RATE, AVG_POLICE_LEAD_TIME, PERMIT_PROCESSING_AVG, ESCORT_FILL_RATE, LOAD_CANCELLATION_RATE
    metric_value NUMERIC(12,4) NOT NULL,
    metric_unit TEXT,                                   -- HOURS, PERCENT, DAYS, MINUTES, SCORE

    -- Period
    period_type TEXT DEFAULT 'MONTHLY',                -- DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, ALL_TIME
    period_start DATE,
    period_end DATE,

    -- Sample size
    sample_count INTEGER,                              -- How many data points

    -- Trends
    previous_value NUMERIC(12,4),
    change_percent NUMERIC(6,2),
    trend TEXT,                                        -- IMPROVING, DECLINING, STABLE

    -- Calculated at
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 9: INTELLIGENCE REPORT (Packaged Data Products)
-- ============================================================
-- Generated reports for enterprise customers.
-- This is where data becomes revenue.
-- Feeds: S11 (Risk API), S13 (Insurance Risk), S17 (Data Licensing), S20 (Predictive)
CREATE TABLE intelligence_report (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Report identity
    report_type TEXT NOT NULL,                         -- RISK_ASSESSMENT, CORRIDOR_ANALYSIS, OPERATOR_SCORECARD, MARKET_INTELLIGENCE, INSURANCE_RISK, DELAY_PREDICTION, STATE_REGULATORY, COMPETITIVE_ANALYSIS
    report_name TEXT NOT NULL,
    report_description TEXT,

    -- Scope
    scope_type TEXT,                                   -- STATE, CORRIDOR, OPERATOR, INDUSTRY, NATIONAL
    scope_value TEXT,                                   -- FL, I-95_FL_GA, operator_id, WIND_ENERGY
    scope_states TEXT[],

    -- Content
    report_data JSONB NOT NULL,                        -- Structured report content
    executive_summary TEXT,
    key_findings TEXT[],
    recommendations TEXT[],

    -- Access control
    access_level TEXT DEFAULT 'ENTERPRISE',            -- FREE, PRO, COMMAND, ENTERPRISE, INTERNAL
    stream_id TEXT REFERENCES revenue_stream(stream_id),

    -- Pricing
    price_cents BIGINT DEFAULT 0,                      -- One-time purchase price
    subscription_tier_required TEXT,                    -- Minimum tier for access

    -- PDF
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Freshness
    data_as_of TIMESTAMPTZ,
    next_refresh_at TIMESTAMPTZ,
    auto_refresh BOOLEAN DEFAULT FALSE,

    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,

    -- Revenue stream this report was sold under
    sold_under_stream TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE 10: RISK PREDICTION (AI Layer)
-- ============================================================
-- Machine-predicted risk events.
-- Feeds: S13 (Insurance Risk Scoring), S20 (Predictive Corridor Intelligence)
CREATE TABLE risk_prediction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Subject
    prediction_type TEXT NOT NULL,                     -- PERMIT_DELAY, ESCORT_SHORTAGE, POLICE_UNAVAILABLE, WEATHER_IMPACT, CONSTRUCTION_BLOCK, REGULATORY_CHANGE, PRICE_SPIKE, EQUIPMENT_FAILURE
    subject_type TEXT,                                 -- STATE, CORRIDOR, OPERATOR, ROUTE
    subject_id UUID,
    subject_label TEXT,

    -- Prediction
    probability NUMERIC(5,4),                          -- 0.0000 to 1.0000
    confidence NUMERIC(3,2),                           -- 0.00 to 1.00
    severity TEXT,                                     -- LOW, MEDIUM, HIGH, CRITICAL
    predicted_impact TEXT,                              -- Description of impact

    -- Window
    predicted_start DATE,
    predicted_end DATE,
    predicted_duration_hours NUMERIC(6,1),

    -- Evidence
    evidence_data JSONB,                               -- What signals led to this prediction
    model_version TEXT DEFAULT 'v1',
    training_data_points INTEGER,

    -- Outcome tracking (did it happen?)
    actual_occurred BOOLEAN,
    actual_date DATE,
    accuracy_score NUMERIC(3,2),                       -- Post-hoc accuracy

    -- Geography
    state_code TEXT,
    corridor_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Subscriptions
CREATE INDEX idx_sub_operator ON subscription(operator_id);
CREATE INDEX idx_sub_tier ON subscription(tier);
CREATE INDEX idx_sub_status ON subscription(status);
CREATE INDEX idx_sub_stripe ON subscription(stripe_subscription_id);

-- Transaction ledger
CREATE INDEX idx_tl_payer ON transaction_ledger(payer_id);
CREATE INDEX idx_tl_payee ON transaction_ledger(payee_id);
CREATE INDEX idx_tl_type ON transaction_ledger(transaction_type);
CREATE INDEX idx_tl_status ON transaction_ledger(status);
CREATE INDEX idx_tl_ref ON transaction_ledger(reference_type, reference_id);
CREATE INDEX idx_tl_created ON transaction_ledger(created_at);
CREATE INDEX idx_tl_stripe ON transaction_ledger(stripe_payment_id);

-- Escrow
CREATE INDEX idx_esc_load ON escrow_hold(load_id);
CREATE INDEX idx_esc_depositor ON escrow_hold(depositor_id);
CREATE INDEX idx_esc_beneficiary ON escrow_hold(beneficiary_id);
CREATE INDEX idx_esc_status ON escrow_hold(status);
CREATE INDEX idx_esc_auto ON escrow_hold(auto_release_at) WHERE status = 'HELD' AND auto_release_enabled = TRUE;

-- Fee schedule
CREATE INDEX idx_fs_stream ON fee_schedule(stream_id);
CREATE INDEX idx_fs_active ON fee_schedule(active) WHERE active = TRUE;

-- Payouts
CREATE INDEX idx_pay_operator ON payout(operator_id);
CREATE INDEX idx_pay_status ON payout(status);
CREATE INDEX idx_pay_factored ON payout(is_factored) WHERE is_factored = TRUE;

-- Invoices
CREATE INDEX idx_inv_operator ON invoice(operator_id);
CREATE INDEX idx_inv_status ON invoice(status);
CREATE INDEX idx_inv_due ON invoice(due_date) WHERE status NOT IN ('PAID', 'VOID');

-- Event log
CREATE INDEX idx_el_type ON event_log(event_type);
CREATE INDEX idx_el_actor ON event_log(actor_id);
CREATE INDEX idx_el_resource ON event_log(resource_type, resource_id);
CREATE INDEX idx_el_stream ON event_log(stream_id);
CREATE INDEX idx_el_state ON event_log(state_code);
CREATE INDEX idx_el_time ON event_log(occurred_at);

-- Performance metrics
CREATE INDEX idx_pm_subject ON performance_metric(subject_type, subject_id);
CREATE INDEX idx_pm_metric ON performance_metric(metric_name);
CREATE INDEX idx_pm_period ON performance_metric(period_type, period_start);

-- Intelligence reports
CREATE INDEX idx_ir_type ON intelligence_report(report_type);
CREATE INDEX idx_ir_scope ON intelligence_report(scope_type, scope_value);
CREATE INDEX idx_ir_access ON intelligence_report(access_level);
CREATE INDEX idx_ir_stream ON intelligence_report(stream_id);

-- Risk predictions
CREATE INDEX idx_rp_type ON risk_prediction(prediction_type);
CREATE INDEX idx_rp_subject ON risk_prediction(subject_type, subject_id);
CREATE INDEX idx_rp_severity ON risk_prediction(severity);
CREATE INDEX idx_rp_window ON risk_prediction(predicted_start, predicted_end);
CREATE INDEX idx_rp_state ON risk_prediction(state_code);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_hold ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metric ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_prediction ENABLE ROW LEVEL SECURITY;

-- Subscriptions — owner only
CREATE POLICY sub_owner ON subscription
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Transactions — participants only
CREATE POLICY tl_participant ON transaction_ledger
    FOR SELECT USING (
        payer_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()) OR
        payee_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid())
    );

-- Escrow — parties only
CREATE POLICY esc_parties ON escrow_hold
    FOR SELECT USING (
        depositor_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()) OR
        beneficiary_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid())
    );

-- Fee schedule — public read (transparency)
CREATE POLICY fs_public ON fee_schedule FOR SELECT USING (TRUE);

-- Payouts — owner only
CREATE POLICY pay_owner ON payout
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Invoices — owner only
CREATE POLICY inv_owner ON invoice
    FOR ALL USING (operator_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Event log — own events only
CREATE POLICY el_owner ON event_log
    FOR SELECT USING (actor_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Performance metrics — public aggregates, private operator details
CREATE POLICY pm_public ON performance_metric
    FOR SELECT USING (subject_type IN ('JURISDICTION', 'CORRIDOR', 'STATE'));
CREATE POLICY pm_owner ON performance_metric
    FOR SELECT USING (subject_type = 'OPERATOR' AND subject_id IN (SELECT id FROM operator_profile WHERE auth_user_id = auth.uid()));

-- Intelligence reports — based on access level + subscription
CREATE POLICY ir_free ON intelligence_report
    FOR SELECT USING (access_level = 'FREE');
CREATE POLICY ir_paid ON intelligence_report
    FOR SELECT USING (
        access_level != 'INTERNAL' AND
        EXISTS (
            SELECT 1 FROM subscription s
            JOIN operator_profile op ON op.id = s.operator_id
            WHERE op.auth_user_id = auth.uid()
              AND s.status = 'ACTIVE'
        )
    );

-- Risk predictions — enterprise tier only
CREATE POLICY rp_enterprise ON risk_prediction
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM subscription s
            JOIN operator_profile op ON op.id = s.operator_id
            WHERE op.auth_user_id = auth.uid()
              AND s.status = 'ACTIVE'
              AND s.tier IN ('COMMAND', 'BROKER_PRO', 'ENTERPRISE')
        )
    );


-- ============================================================
-- VIEWS
-- ============================================================

-- Revenue dashboard (internal)
CREATE OR REPLACE VIEW v_revenue_dashboard AS
SELECT
    DATE_TRUNC('month', tl.created_at) AS month,
    tl.transaction_type,
    COUNT(*) AS transaction_count,
    SUM(tl.amount_cents) AS total_volume_cents,
    SUM(tl.platform_fee_cents) AS total_hc_revenue_cents,
    AVG(tl.amount_cents) AS avg_transaction_cents
FROM transaction_ledger tl
WHERE tl.status = 'COMPLETED'
GROUP BY DATE_TRUNC('month', tl.created_at), tl.transaction_type
ORDER BY month DESC, total_hc_revenue_cents DESC;

-- Subscription metrics (internal)
CREATE OR REPLACE VIEW v_subscription_metrics AS
SELECT
    tier,
    COUNT(*) AS total_subscribers,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_subscribers,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') AS churned,
    SUM(monthly_price_cents) FILTER (WHERE status = 'ACTIVE') AS monthly_mrr_cents,
    AVG(EXTRACT(EPOCH FROM (COALESCE(cancelled_at, NOW()) - created_at)) / 86400)::INTEGER AS avg_lifetime_days
FROM subscription
GROUP BY tier
ORDER BY monthly_mrr_cents DESC NULLS LAST;

-- Escrow health (internal)
CREATE OR REPLACE VIEW v_escrow_health AS
SELECT
    status,
    COUNT(*) AS total_holds,
    SUM(amount_cents) AS total_held_cents,
    AVG(EXTRACT(EPOCH FROM (COALESCE(released_at, NOW()) - held_at)) / 3600)::NUMERIC(8,1) AS avg_hold_hours,
    COUNT(*) FILTER (WHERE status = 'DISPUTED') AS disputed_count,
    SUM(platform_fee_cents) AS total_platform_fees_cents
FROM escrow_hold
GROUP BY status;

-- Platform event volume (internal)
CREATE OR REPLACE VIEW v_event_volume AS
SELECT
    DATE_TRUNC('day', occurred_at) AS day,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT actor_id) AS unique_actors,
    AVG(duration_ms) AS avg_duration_ms
FROM event_log
WHERE occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', occurred_at), event_type
ORDER BY day DESC, event_count DESC;


-- ============================================================
-- SUPPORT GRID: LODGING PARTNERSHIPS (Step 9)
-- ============================================================
-- Hotel partnerships with truck parking + corporate rates.
-- Commission-based revenue model for lodging referrals.
-- Enables Haul Command to monetize operator accommodations
-- while providing verified, truck-friendly lodging options.
-- ============================================================

CREATE TABLE lodging_partnership (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profile(id) ON DELETE CASCADE,
    hotel_brand TEXT,
    truck_parking_available BOOLEAN DEFAULT TRUE,
    oversize_parking_available BOOLEAN DEFAULT FALSE,
    corporate_rate_cents BIGINT,
    hc_commission_percent NUMERIC(5,2) DEFAULT 10.00,
    amenities TEXT[], -- WIFI, HOT_BREAKFAST, 24HR_CHECKIN, TRUCK_WASH
    verified_by_hc BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lodging_operator ON lodging_partnership(operator_id);
CREATE INDEX idx_lodging_verified ON lodging_partnership(verified_by_hc);

-- RLS for lodging_partnership
ALTER TABLE lodging_partnership ENABLE ROW LEVEL SECURITY;
CREATE POLICY lodging_public_read ON lodging_partnership FOR SELECT USING (true);

COMMENT ON TABLE lodging_partnership IS 'Support Grid Step 9: Hotel partnerships with truck parking, corporate rates, and commission tracking';
