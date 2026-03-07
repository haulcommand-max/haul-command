# HAUL COMMAND — OSS Marketplace Stack

Self-hosted infrastructure for the Logistics Intelligence Operating System.

## Components

| Service | Port | Purpose |
|---------|------|---------|
| **Redpanda** | 9092 | Kafka-compatible event stream backbone |
| **Redis** | 6379 | Online feature cache (low-latency serving) |
| **GrowthBook** | 3100 | Feature flags + A/B testing |

## Usage

```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Check status
make ps
```

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- At least 4GB RAM available for containers

## Architecture

```
App / Edge Functions
    │
    ├── publish events ──► Redpanda (topics: loads, risk, ops, payments, telemetry)
    │                           │
    │                           ├── consumer: update Market Pulse read model
    │                           ├── consumer: update Corridor Intelligence
    │                           └── consumer: update AdGrid targeting
    │
    ├── read features ──► Redis (cached corridor_liquidity, broker_risk, etc.)
    │
    └── check flags ──► GrowthBook (experiments, rollout %, guardrails)
```

## Event Topics

| Topic | Events |
|-------|--------|
| `loads` | broker_load_posted, broker_load_updated, load_matched |
| `risk` | risk_signal_added, broker_flagged, trust_score_changed |
| `ops` | operator_location_pinged, dispatch_offer_sent, dispatch_offer_accepted |
| `payments` | escrow_locked, escrow_released, payment_completed |
| `telemetry` | corridor_viewed, ad_impression, ad_click, search_performed |

## Safety

- All self-hosted, zero vendor lock-in
- Low resource footprint (~2GB total)
- `make down` stops everything instantly
- Does not change app behavior until explicitly wired
