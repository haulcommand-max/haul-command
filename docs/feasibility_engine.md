# Feasibility Engine: The Pre-Load Goldmine

This document defines the technical logic for verifying load feasibility **before** a broker accepts freight or a carrier commits to a route.

## 1. The Core Logic (A-F Risk Grade)

The engine returns a combined risk score based on three data inputs:

| Input | Logic | Data Source |
|---|---|---|
| **Permit Feasibility** | Historical approval speed + current state backlog + dimension limits. | `permits` (Supabase) + State Portals |
| **Route Feasibility** | 3D bridge clearance + curfew windows + construction. | HERE API + `routes` (Supabase) |
| **Constraint Density** | Auto-calculated count of escorts, police, and pilot cars required. | Regulatory Knowledge Graph |

## 2. API Endpoints

-   `GET /feasibility/score?dims={W,H,L,G}`: Returns 0.0-1.0 score and estimated compliance cost.
-   `POST /feasibility/route-check`: Validates a specific route against active restrictions.

## 3. Monetization (The Moat)
- **Broker License**: $500–$5,000/mo.
- **Transactional Fee**: $5 per check for non-subscribers.
- **Insurance Integration**: Pinging this API to determine premium adjustments for extreme loads.

---
**Status**: PLANNING
**Goal**: Remove "Cargo Blindness" from the freight industry.
