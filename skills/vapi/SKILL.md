---
name: Vapi Voice Brain
description: Manages Vapi AI voice assistant configuration, outbound calling, compliance enforcement, offer sequencing, and eligibility scoring for 25-country operations.
---

# Vapi Voice Brain Skill

## Overview

The Vapi Voice Brain powers all AI-assisted voice interactions in Haul Command — from outbound claim calls to inbound availability checks to offer sequencing.

## Architecture

```
skills/vapi/
├── SKILL.md                  ← this file
├── compliance/               ← Country compliance rules for calling
├── objections/               ← Objection handling scripts
├── personas/                 ← Voice persona configs
├── scripts/                  ← Call scripts and flows
└── tools/                    ← Tool schemas for Vapi function calling
```

## Key Libraries

| File | Purpose |
|------|---------|
| `lib/vapi/compliance-enforcer.ts` | Fail-closed country compliance gate — every outbound action must pass |
| `lib/vapi/eligibility.ts` | Scores entities for outbound call eligibility |
| `lib/vapi/offer-sequencer.ts` | Multi-touch offer escalation logic |
| `lib/vapi/pipeline.ts` | Orchestrates dial-next flow |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/vapi/dial-next` | POST | Selects next eligible entity to call |
| `/api/vapi/outbound` | POST | Initiates an outbound Vapi call |
| `/api/webhooks/vapi` | POST | Receives Vapi webhook callbacks |

## Key Tables

- `vapi_call_ledger` — Call history and outcomes
- `vapi_offer_log` — Offer sequencing and cooldowns
- `vapi_dial_queue` — Entities queued for outbound calls

## Safety Rules

> [!CAUTION]
> **All outbound calling is OFF by default globally.**
> 
> To enable outbound for a country:
> 1. Set `country_compliance.verification_status = 'verified'` for that country
> 2. Set `country_compliance.outbound_allowed = true`
> 3. Ensure `opt_out_handling_tested = true`
> 4. Confirm calling hours are correct for the timezone

The `compliance-enforcer.ts` implements **fail-closed** gating:
- If country not found → BLOCKED
- If `verification_status != 'verified'` → BLOCKED
- If `outbound_allowed != true` → BLOCKED
- If outside calling hours → BLOCKED
- If in quiet hours → BLOCKED

## Required Environment Variables

- `VAPI_PRIVATE_KEY` — **Owner must provide**. Without this, no calls can be made.

## Compliance Matrix

Use `getComplianceMatrix()` from `compliance-enforcer.ts` to get the status of all 25 countries.

## Call Flow

1. **Cron triggers** `dial-next` → selects eligible entity
2. **Eligibility gate** → checks traffic proof, cooldown, compliance
3. **Compliance gate** → fail-closed country check
4. **Vapi call** → persona, script, tools attached
5. **Webhook callback** → outcome logged, offers tracked
6. **Sequencer** → escalation/cooldown/follow-up scheduled

## Personas

Voice personas are configured per-country in `lib/localization/pipeline.ts` via the `vapiPersona` field. English markets use `en_us`/`en_ca`/`en_au`/`en_uk`. Non-English markets use `future_*` placeholders until localized voices are set up.
