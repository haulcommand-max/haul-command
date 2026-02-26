-- ══════════════════════════════════════════
-- HEAVY HAUL INDEX (AUTHORITY MAGNET)
-- Creates the citation-worthy dataset to attract high-DR backlinks.
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.haul_index_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_month DATE NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    national_demand_score DECIMAL(5,2) DEFAULT 0.0,
    avg_rate_per_mile DECIMAL(10,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.corridor_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID REFERENCES public.haul_index_snapshots(snapshot_id) ON DELETE CASCADE,
    corridor_name VARCHAR(100) NOT NULL,
    demand_score DECIMAL(5,2) DEFAULT 0.0,
    avg_rate DECIMAL(10,2) DEFAULT 0.0,
    load_velocity DECIMAL(5,2) DEFAULT 0.0,
    congestion_factor DECIMAL(5,2) DEFAULT 1.0,
    UNIQUE(snapshot_id, corridor_name)
);

CREATE TABLE IF NOT EXISTS public.state_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID REFERENCES public.haul_index_snapshots(snapshot_id) ON DELETE CASCADE,
    state_or_province VARCHAR(50) NOT NULL,
    supply_gap_score DECIMAL(5,2) DEFAULT 0.0,
    avg_rate_per_mile DECIMAL(10,2) DEFAULT 0.0,
    active_driver_estimate INTEGER DEFAULT 0,
    UNIQUE(snapshot_id, state_or_province)
);

CREATE TABLE IF NOT EXISTS public.port_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID REFERENCES public.haul_index_snapshots(snapshot_id) ON DELETE CASCADE,
    port_name VARCHAR(100) NOT NULL,
    activity_score DECIMAL(5,2) DEFAULT 0.0,
    heavy_haul_events_est INTEGER DEFAULT 0,
    escort_demand_score DECIMAL(5,2) DEFAULT 0.0,
    UNIQUE(snapshot_id, port_name)
);

-- Enable RLS
ALTER TABLE public.haul_index_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.port_metrics ENABLE ROW LEVEL SECURITY;

-- Public Read Access
CREATE POLICY "Public Read Access for Snapshots" ON public.haul_index_snapshots FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Corridor Metrics" ON public.corridor_metrics FOR SELECT USING (true);
CREATE POLICY "Public Read Access for State Metrics" ON public.state_metrics FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Port Metrics" ON public.port_metrics FOR SELECT USING (true);

-- Indexes for fast querying
CREATE INDEX idx_snapshot_month ON public.haul_index_snapshots(snapshot_month DESC);
CREATE INDEX idx_corridor_metrics_snapshot ON public.corridor_metrics(snapshot_id);
CREATE INDEX idx_state_metrics_snapshot ON public.state_metrics(snapshot_id);
CREATE INDEX idx_port_metrics_snapshot ON public.port_metrics(snapshot_id);
