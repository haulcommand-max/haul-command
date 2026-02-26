/**
 * lib/maps/hc-overlays.ts
 *
 * Haul Command Intelligence Overlay Layer (The Real Moat)
 *
 * Defines overlay types, config, and rendering rules for HC-proprietary
 * intelligence drawn on top of base map providers (HERE, etc.).
 *
 * Overlays:
 *   corridor_liquidity_heat    — supply vs demand heat across corridors
 *   escort_density_radar       — live operator presence rings
 *   hard_fill_alert_zones      — red pulse where loads can't fill
 *   broker_urgency_zones       — heat from urgency_score model
 *   permit_complexity_zones    — state-level permit friction overlay
 *   historical_delay_hotspots  — past delay patterns for route planning
 *
 * Rendering: WebGL layers, mobile-optimized, graceful degradation.
 */

// ── Overlay IDs ────────────────────────────────────────────────────────────────

export type HCOverlayId =
    | "corridor_liquidity_heat"
    | "escort_density_radar"
    | "hard_fill_alert_zones"
    | "broker_urgency_zones"
    | "permit_complexity_zones"
    | "historical_delay_hotspots";

// ── Overlay config entry ───────────────────────────────────────────────────────

export interface OverlayConfig {
    id: HCOverlayId;
    label: string;
    description: string;
    /** Whether to render using WebGL for performance */
    useWebGL: boolean;
    /** Minimum zoom level to display (declutter on zoom-out) */
    minZoom: number;
    /** Default on/off state */
    defaultEnabled: boolean;
    /** Mobile: show even on small screens? False = desktop-only */
    mobileEnabled: boolean;
    /** Data source for live feed */
    dataSource: "supply_move_recommendations" | "geo_supply_pressure" | "corridor_supply_metrics" | "static";
    /** Refresh interval in seconds (0 = static) */
    refreshIntervalSec: number;
    /** Color ramp for the overlay */
    colorRamp: { low: string; mid: string; high: string };
}

// ── Overlay definitions ────────────────────────────────────────────────────────

export const HC_OVERLAYS: Record<HCOverlayId, OverlayConfig> = {
    corridor_liquidity_heat: {
        id: "corridor_liquidity_heat",
        label: "Corridor Liquidity",
        description: "Supply vs. demand heat across every lane. Red = shortage, green = healthy.",
        useWebGL: true,
        minZoom: 5,
        defaultEnabled: true,
        mobileEnabled: true,
        dataSource: "corridor_supply_metrics",
        refreshIntervalSec: 600,  // matches compute-supply-radar cadence
        colorRamp: { low: "#ef4444", mid: "#F1A91B", high: "#22c55e" },
    },

    escort_density_radar: {
        id: "escort_density_radar",
        label: "Escort Density Radar",
        description: "Live operator presence rings showing escort concentration per zone.",
        useWebGL: true,
        minZoom: 7,
        defaultEnabled: true,
        mobileEnabled: true,
        dataSource: "geo_supply_pressure",
        refreshIntervalSec: 120,  // near-real-time
        colorRamp: { low: "#1e3a5f", mid: "#2563eb", high: "#60a5fa" },
    },

    hard_fill_alert_zones: {
        id: "hard_fill_alert_zones",
        label: "Hard-Fill Alert Zones",
        description: "Pulsing red zones where loads historically fail to fill.",
        useWebGL: true,
        minZoom: 6,
        defaultEnabled: false,  // opt-in — high visual noise
        mobileEnabled: false,   // desktop-only to avoid clutter
        dataSource: "corridor_supply_metrics",
        refreshIntervalSec: 600,
        colorRamp: { low: "#7f1d1d", mid: "#b91c1c", high: "#ef4444" },
    },

    broker_urgency_zones: {
        id: "broker_urgency_zones",
        label: "Broker Urgency Heat",
        description: "Urgency score overlay — where brokers are posting under time pressure.",
        useWebGL: true,
        minZoom: 6,
        defaultEnabled: false,  // broker-facing feature (role-gate later)
        mobileEnabled: true,
        dataSource: "geo_supply_pressure",
        refreshIntervalSec: 300,
        colorRamp: { low: "#0f172a", mid: "#f97316", high: "#ef4444" },
    },

    permit_complexity_zones: {
        id: "permit_complexity_zones",
        label: "Permit Complexity",
        description: "State-level permit friction score — darker = more complex permitting required.",
        useWebGL: false,  // polygon layer — standard canvas
        minZoom: 4,
        defaultEnabled: false,
        mobileEnabled: false,
        dataSource: "static",
        refreshIntervalSec: 0,
        colorRamp: { low: "#1e293b", mid: "#7c3aed", high: "#a855f7" },
    },

    historical_delay_hotspots: {
        id: "historical_delay_hotspots",
        label: "Delay Hotspots",
        description: "Historical delay patterns to help plan route timing.",
        useWebGL: false,
        minZoom: 7,
        defaultEnabled: false,
        mobileEnabled: false,
        dataSource: "static",
        refreshIntervalSec: 0,
        colorRamp: { low: "#1e293b", mid: "#ca8a04", high: "#fbbf24" },
    },
};

// ── Rendering rule constants ───────────────────────────────────────────────────

/** Max overlays that can be active simultaneously before performance degrades */
export const MAX_CONCURRENT_OVERLAYS = 3;

/** Mobile: max overlays before auto-collapse to reduce battery impact */
export const MAX_MOBILE_OVERLAYS = 2;

/**
 * Ordered list of overlays to enable by default on first map load.
 * Only includes overlays with defaultEnabled: true above.
 */
export const DEFAULT_OVERLAY_SET: HCOverlayId[] = [
    "corridor_liquidity_heat",
    "escort_density_radar",
];

// ── Helper: get overlay config safely ─────────────────────────────────────────
export function getOverlay(id: HCOverlayId): OverlayConfig {
    return HC_OVERLAYS[id];
}

export function getEnabledOverlays(): OverlayConfig[] {
    return Object.values(HC_OVERLAYS).filter(o => o.defaultEnabled);
}

export function getMobileOverlays(): OverlayConfig[] {
    return Object.values(HC_OVERLAYS).filter(o => o.mobileEnabled && o.defaultEnabled);
}
