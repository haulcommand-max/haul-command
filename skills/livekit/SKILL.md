---
name: LiveKit Voice Brain
description: Manages LiveKit AI voice assistant configuration, outbound calling, compliance enforcement, offer sequencing, and eligibility scoring for 57-country operations. Replaces all VAPI functionality with LiveKit's Agents framework.
---

# LiveKit Voice Brain Skill

## Overview

The LiveKit Voice Brain powers ALL AI-assisted voice interactions in Haul Command — from outbound claim calls to inbound availability checks to offer sequencing. **This replaces the deprecated VAPI skill entirely.**

## Migration Status

| Component | VAPI (Deprecated) | LiveKit (Active) |
|---|---|---|
| Personas | `skills/vapi/personas/` | `skills/livekit/personas/` |
| Scripts | `skills/vapi/scripts/` | `skills/livekit/scripts/` |
| Compliance | `skills/vapi/compliance/` | `skills/livekit/compliance/` |
| Objections | `skills/vapi/objections/` | `skills/livekit/objections/` |
| Tools | `skills/vapi/tools/` | `skills/livekit/tools/` |

## Architecture

```
skills/livekit/
├── SKILL.md                  ← this file
├── compliance/               ← Country compliance rules for calling (57 countries)
├── objections/               ← Objection handling scripts
├── personas/                 ← Voice persona configs
├── scripts/                  ← Call scripts and flows
└── tools/                    ← Tool schemas for LiveKit function calling
```

## Key Libraries

| File | Purpose |
|------|--------|
| `lib/livekit/compliance-enforcer.ts` | Fail-closed 57-country compliance gate — every outbound action must pass |
| `lib/livekit/eligibility.ts` | Scores entities for outbound call eligibility |
| `lib/livekit/offer-sequencer.ts` | Multi-touch offer escalation logic |
| `lib/livekit/pipeline.ts` | Orchestrates dial-next flow via LiveKit Agents |
| `lib/livekit/agent-dispatcher.ts` | LiveKit Agents framework — STT/LLM/TTS pipeline |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/livekit/dial-next` | POST | Selects next eligible entity to call |
| `/api/livekit/outbound` | POST | Initiates an outbound LiveKit call |
| `/api/webhooks/livekit` | POST | Receives LiveKit webhook callbacks |
| `/api/livekit/token` | POST | Generates LiveKit room tokens |

## Key Tables

- `livekit_call_ledger` — Call history and outcomes (migrated from vapi_call_ledger)
- `livekit_offer_log` — Offer sequencing and cooldowns (migrated from vapi_offer_log)
- `livekit_dial_queue` — Entities queued for outbound calls (migrated from vapi_dial_queue)

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

- `LIVEKIT_URL` — LiveKit server URL
- `LIVEKIT_API_KEY` — LiveKit API key
- `LIVEKIT_API_SECRET` — LiveKit API secret
- `ELEVENLABS_API_KEY` — ElevenLabs API key for TTS (paired with LiveKit STT/LLM)

## LiveKit Agents Framework

LiveKit Agents replaces VAPI's hosted assistant with a self-hosted pipeline:

```
STT (Deepgram/Whisper) → LLM (Gemini 2.5 Pro / Claude 3.5 Sonnet) → TTS (ElevenLabs)
```

### Advantages Over VAPI
- **Self-hosted**: No per-minute VAPI charges
- **Custom STT**: Choose Deepgram or Whisper per language
- **Dual LLM**: Route to Gemini for data-heavy, Claude for EQ-heavy calls
- **ElevenLabs TTS**: Superior voice quality, multi-language
- **57-country**: Native multi-language support
- **Video**: LiveKit rooms support video verification calls

## Call Flow

1. **Cron triggers** `dial-next` → selects eligible entity
2. **Eligibility gate** → checks traffic proof, cooldown, compliance
3. **Compliance gate** → fail-closed 57-country check
4. **LiveKit Agent** → creates room, connects agent with persona/script/tools
5. **Webhook callback** → outcome logged, offers tracked
6. **Sequencer** → escalation/cooldown/follow-up scheduled

## Personas

Voice personas are configured per-country with LiveKit's multi-language TTS:
- English markets: ElevenLabs Nathaniel/Stokes voices
- Spanish markets: ElevenLabs Spanish voices
- Portuguese markets: ElevenLabs Portuguese voices
- German/French/Other: ElevenLabs multilingual v2
