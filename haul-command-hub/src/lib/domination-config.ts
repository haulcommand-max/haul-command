/**
 * HAUL COMMAND DOMINATION SYSTEM CONFIGURATION
 * Version 3.0 - The Global Infrastructure Layer
 * 
 * This file acts as the single source of truth for Claude (the UI layer).
 * It strictly enforces the exact psychological triggers, AdGrid pricing, 
 * tool routes, and habit loops that convert traffic into revenue. 
 */

export const DOMINATION_CONFIG = {
  // =========================================================================
  // 1. BEHAVIORAL SECRETS: The 15 Conversion Triggers (96% Target)
  // Used in the Claim Machine funnel (profile claims, onboarding)
  // =========================================================================
  CLAIM_MACHINE_SCRIPTS: {
    IDENTITY: [
      { trigger: "removing_friction", copy: "You already have a profile on Haul Command." },
      { trigger: "ego", copy: "You are ranked #{rank} in your area." },
      { trigger: "pain", copy: "You are currently invisible to brokers." }
    ],
    MONEY_PAIN: [
      { trigger: "revenue_loss", copy: "You missed ${missed_revenue} in jobs this week." },
      { trigger: "realtime_fomo", copy: "{searches} brokers searched for you but couldn't find you." },
      { trigger: "context_fomo", copy: "This load could have been yours." }
    ],
    URGENCY_SCARCITY: [
      { trigger: "scarcity", copy: "Only {count} operators showing in your area." },
      { trigger: "ownership", copy: "Your territory is unclaimed." },
      { trigger: "competition", copy: "Someone else may claim your position." }
    ],
    STATUS_GAMIFICATION: [
      { trigger: "leaderboard", copy: "Claim to lock in your leaderboard position." },
      { trigger: "trust_preview", copy: "You could be a top-rated operator." },
      { trigger: "badges", copy: "Unlock your Verification Badges to boost trust." }
    ],
    FOLLOW_UP: [
      { method: "sms", copy: "Still unclaimed - you're missing visibility." },
      { method: "push", copy: "Jobs are coming through your area now." },
      { action: "instant_reward", copy: "Instant unlock after claim." }
    ]
  },

  // =========================================================================
  // 2. ADGRID MONETIZATION (The Exact ROI Structure)
  // Used for checkout forms, upgrade Modals, and API validations
  // =========================================================================
  ADGRID_PRICING: {
    ENTRY_TIER: [
      { id: "featured_listing", label: "Featured Listing", price_usd: 29.00, billing: "monthly" },
      { id: "city_boost", label: "City Boost", price_usd: 49.00, billing: "monthly" },
      { id: "near_me_boost", label: "Near Me Boost", price_usd: 19.00, billing: "monthly" }
    ],
    MID_TIER: [
      { id: "corridor_sponsorship", label: "Corridor Sponsorship", price_usd: 199.00, billing: "monthly" },
      { id: "category_sponsorship", label: "Category Sponsorship", price_usd: 149.00, billing: "monthly" },
      { id: "tool_sponsorship", label: "Tool Sponsorship", price_usd: 99.00, billing: "monthly" }
    ],
    HIGH_TIER: [
      { id: "state_sponsorship", label: "State Sponsorship", price_usd: 499.00, billing: "monthly" },
      { id: "country_sponsorship", label: "Country Sponsorship", price_usd: 999.00, billing: "monthly" },
      { id: "global_placement", label: "Global Placement", price_usd: 2500.00, billing: "monthly" }
    ],
    PERFORMANCE: [
      { id: "pay_per_lead", label: "Pay-Per-Lead", range_min: 5, range_max: 25 },
      { id: "pay_per_call", label: "Pay-Per-Call", range_min: 10, range_max: 50 },
      { id: "pay_per_job", label: "Pay-Per-Job Match", range_min: 25, range_max: 100 }
    ],
    DATA_PRODUCTS: [
      { id: "api_access", label: "API Access", price_min: 49, price_max: 499, billing: "monthly" },
      { id: "market_reports", label: "Market Intelligence Reports", price_min: 99, price_max: 999, billing: "one_time" }
    ]
  },

  // =========================================================================
  // 3. DAILY HABIT LOOPS (Addiction Engine)
  // Feeds into the LiveKit Voice Bot, Novu Push Notifications, and SMS Engine
  // =========================================================================
  HABIT_ENGINES: {
    OPERATOR_LOOPS: [
      "New jobs near you",
      "You missed {x} opportunities",
      "Your rank changed",
      "You were viewed {x} times",
      "Your trust score updated"
    ],
    MONEY_LOOPS: [
      "You could have earned ${x} today",
      "Top operators made ${x} this week",
      "You're underpriced vs market",
      "New high-paying route detected",
      "Demand spike in your area"
    ],
    URGENCY_LOOPS: [
      "Jobs happening right now",
      "Only {x} operators available",
      "Critical shortage area",
      "Last chance to claim territory"
    ]
  },

  // =========================================================================
  // 4. THE 50 SEO TOOLS (Intent Routing Engine)
  // Claude will use this array to dynamically generate the `/tools` sitemap and index
  // =========================================================================
  TOOLS_DIRECTORY: [
    // CORE OPERATIONS
    { slug: "escort-calculator", title: "Escort Requirement Calculator", intent: "high", monetization: "lead" },
    { slug: "pilot-cost", title: "Pilot Car Cost Calculator", intent: "high", monetization: "paid_insights" },
    { slug: "permit-estimator", title: "Oversize Load Permit Estimator", intent: "high", monetization: "gated_data" },
    { slug: "route-risk", title: "Route Risk Analyzer", intent: "high", monetization: "subscription" },
    { slug: "height-clearance", title: "Height Clearance Checker", intent: "high", monetization: "premium_unlock" },
    { slug: "multi-state-permit", title: "Multi-State Permit Planner", intent: "high", monetization: "lead" },
    // FINANCIAL
    { slug: "profit-calculator", title: "Load Profit Calculator", intent: "money", monetization: "lead" },
    { slug: "deadhead-cost", title: "Deadhead Cost Calculator", intent: "money", monetization: "tool_sponsor" },
    { slug: "margin-estimator", title: "Broker Margin Estimator", intent: "money", monetization: "subscription" },
    { slug: "rate-benchmark", title: "Escort Rate Benchmark Tool", intent: "money", monetization: "paid_insights" },
    // COMPLIANCE
    { slug: "country-permit", title: "Country Permit Checker", intent: "seo", monetization: "gated_data" },
    { slug: "state-regulations", title: "State Regulation Lookup Tool", intent: "seo", monetization: "sponsor" },
    { slug: "hazmat-rules", title: "HAZMAT Requirement Tool", intent: "seo", monetization: "premium_content" },
    { slug: "night-travel", title: "Night Travel Restriction Tool", intent: "seo", monetization: "premium_content" },
    // ROUTING
    { slug: "smart-route", title: "Smart Route Planner (OSOW)", intent: "utility", monetization: "subscription" },
    { slug: "low-bridge", title: "Low Bridge Avoidance Tool", intent: "utility", monetization: "premium_unlock" },
    { slug: "fuel-stop", title: "Fuel Stop Planner", intent: "utility", monetization: "adgrid" },
    { slug: "parking-locator", title: "Safe Parking Locator", intent: "utility", monetization: "adgrid" },
    // AI / AUTONOMY
    { slug: "ai-dispatch", title: "AI Dispatch Assistant", intent: "future", monetization: "ai_fees" },
    { slug: "drone-survey", title: "Drone Route Survey Planner", intent: "future", monetization: "survey_services" }
    // ... Rest dynamically extrapolated in DB
  ],

  // =========================================================================
  // 5. DEFAULT SETTING PSYCHOLOGY
  // Strict UI enforcement rules for the frontend components
  // =========================================================================
  DEFAULT_UX_RULES: {
    AUTO_SELECTION: "System pre-selects best operator. User defaults to first match.",
    SINGLE_CTA: "Every screen must have exactly ONE dominant Call To Action.",
    NO_DEAD_ENDS: "Every page leads to: Claim, Tool, Operator, or Monetization.",
    TRUST_FIRST: "Always display Trust Score, Badges, or Rank before details.",
    NEAR_ME_DEFAULT: "Searches must default to user's local geofence."
  },

  // =========================================================================
  // 6. COUNTRY DOMINATION ROLLOUT (120 Countries)
  // Exact Tier framework for expansion, routing, and SEO indexation
  // =========================================================================
  GLOBAL_EXPANSION_TIERS: {
    TIER_A_GOLD: {
      tags: ["active", "highest_roi", "core"],
      countries: [
        "US", "CA", "AU", "GB", "NZ", "ZA", "DE", "NL", "AE", "BR"
      ]
    },
    TIER_B_BLUE: {
      tags: ["seeding", "high_efficiency", "easy_wins"],
      countries: [
        "IE", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "ES", "FR", 
        "IT", "PT", "SA", "QA", "MX", "IN", "ID", "TH"
      ]
    },
    TIER_C_SILVER: {
      tags: ["pending_scale", "volume_capture"],
      countries: [
        "PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", 
        "BG", "GR", "TR", "KW", "OM", "BH", "SG", "MY", "JP", "KR", 
        "CL", "AR", "CO", "PE", "VN", "PH"
      ]
    },
    TIER_D_SLATE: {
      tags: ["programmatic", "automated_seo"],
      countries: [
        "UY", "PA", "CR", "IL", "NG", "EG", "KE", "MA", "RS", "UA", 
        "KZ", "TW", "PK", "BD", "MN", "TT", "JO", "GH", "TZ", "GE", 
        "AZ", "CY", "IS", "LU", "EC"
      ]
    },
    TIER_E_COPPER: {
      tags: ["low_density_control", "first_mover_advantage"],
      countries: [
        "BO", "PY", "GT", "DO", "HN", "SV", "NI", "JM", "GY", "SR", 
        "BA", "ME", "MK", "AL", "MD", "IQ", "NA", "AO", "MZ", "ET", 
        "CI", "SN", "BW", "ZM", "UG", "CM", "KH", "LK", "UZ", "LA", 
        "NP", "DZ", "TN", "MT", "BN", "RW", "MG", "PG", "TM", "KG", 
        "MW"
      ]
    }
  }
};
