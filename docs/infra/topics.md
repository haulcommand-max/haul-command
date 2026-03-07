# Haul Command — Event Topics (Redpanda)

All topics are prefixed with `hc.` and grouped by domain.

## Core Topics

| Topic | Domain | Description |
|---|---|---|
| `hc.events.all` | Fan-out | All events (analytics, replication) |
| `hc.events.broker` | Broker | `broker.load_posted`, `broker.risk_signal_added` |
| `hc.events.risk` | Risk | Risk signals, compliance events |
| `hc.events.operator` | Operator | `operator.location_pinged`, presence |
| `hc.events.dispatch` | Dispatch | `dispatch.offer_sent`, `dispatch.offer_accepted` |
| `hc.events.payments` | Payments | `pay.escrow_locked`, `pay.escrow_released` |
| `hc.readmodels.updates` | Internal | Read model change notifications |
| `hc.decisions.logged` | Audit | Decision logs mirrored to stream |

## Partitioning Strategy
- `hc.events.broker`: partition by `context.country_code`
- `hc.events.operator`: partition by `context.region_code`
- `hc.events.dispatch`: partition by `payload.load_id`

## Retention
- Default: 7 days
- `hc.decisions.logged`: 30 days
- `hc.events.all`: 3 days (analytics only)

## Auto-creation
Topics are created by `make topics` in the `infra/oss-marketplace-stack` directory.
