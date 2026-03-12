# Haul Command Comms — Approved Design

> **Status:** APPROVED with edits (2026-03-12)
> **Decision:** Ship Phase 1 — Internet PTT + Supabase signaling/control
> **Positioning:** "Tap. Talk. Move." — Push-to-talk convoy comms inside Haul Command

---

## Transport Architecture (Final, Corrected)

```
signaling_control  = supabase_realtime        (presence, channel state, quick-calls, who's talking)
internet_audio     = livekit_webrtc_media      (room model, audio tracks, Opus codec, reconnect)
nearby_audio       = native_nearby_transport   (Android Nearby Connections, Apple Multipeer Connectivity)
iphone_background  = apple_push_to_talk_fwk   (APNs-based background wake for networked PTT on iPhone)
future_hardware    = reserved
```

### Critical Corrections Applied

1. **Supabase Realtime = control plane ONLY.** Never stream audio over Broadcast.
   - 50 msgs/sec per talker × fan-out = blows past Pro-tier 500 msgs/sec limit
   - Use for: join/leave, who's talking, quick-calls, channel metadata, presence

2. **LiveKit = internet audio, NOT `@livekit/components-react` for mobile.**
   - Web: `livekit-client` (vanilla JS SDK)
   - React Native: `@livekit/react-native` + `@livekit/react-native-webrtc`
   - Build custom PTT UI on top of SDK, not LiveKit's React component library

3. **Apple Push to Talk ≠ nearby transport.**
   - Apple PushToTalk framework uses APNs tokens for background wake → networked lane
   - For nearby Apple↔Apple: Multipeer Connectivity
   - For nearby Android↔Android: Nearby Connections (supports STREAM payloads with mic audio)

4. **`comms_status` is ephemeral session state, NOT a durable DB column.**
   - online / nearby_only / no_comms is computed from transport health + Supabase Presence
   - Never persist transient audio reachability in Postgres as canonical truth

5. **Room tokens are server-issued only.**
   - LiveKit token server mints short-lived tokens tied to channel membership
   - No client-side room creation or self-issued tokens

---

## Phase 1 Scope (What We Build Now)

### Ship
- Internet PTT via LiveKit WebRTC media
- Supabase Realtime for signaling/presence/control
- Job auto-channel creation (channel spawns when job starts)
- Big glove-friendly talk button with PTT state machine
- 7 quick-call types: stop, hold, clear, low wire, breakdown, lane move, permit issue
- Speaker / earpiece / wired headset routing
- Status banner: online / nearby only / no comms (computed, not stored)
- Who-is-talking labels
- Emergency broadcast to current job members
- LiveKit token server (Next.js API route)
- Comms events pipeline (analytics)

### Do NOT Ship
- Nearby offline mode (Phase 2)
- Bluetooth PTT button (Phase 2)
- Transcripts (Phase 3)
- Route-pin voice notes (Phase 3)
- Multi-channel listen (Phase 3)
- AI summaries (Phase 3+)
- Device presets beyond basic routing (Phase 2)
- Replay library (Phase 2 paid)
- `comms_voice_notes` table (Phase 3)
- Heavy enterprise dispatch console (never in v1)

---

## Phase 1 Database (Lean)

5 tables only:

| Table | Purpose |
|-------|---------|
| `comms_channels` | Auto-created from active jobs. Links to LiveKit room. |
| `comms_members` | Channel membership with role (lead/rear/escort/driver) |
| `comms_quick_calls` | Persisted quick-call events (broadcast via Supabase RT) |
| `comms_events` | Analytics pipeline (PTT started/stopped, joins, etc.) |
| `comms_preferences` | User's auto-join preference, audio routing, plan tier |

NOT shipping: `comms_voice_notes`, replay tables, transcript tables, route-pin tables.

---

## Phase 1 Component Architecture

```
components/comms/
├── CommsProvider.tsx          — Context: transport state, active channel, PTT state
├── CommsFAB.tsx               — Floating action button (persistent during active job)
├── TalkButton.tsx             — BIG glove-friendly PTT button
├── QuickCallBar.tsx           — 7 canned quick-call buttons
├── ChannelHeader.tsx          — Channel name, member count, connection status
├── MemberList.tsx             — Who's in channel + who's talking indicator
├── StatusBanner.tsx           — Computed: online / nearby only / no comms
├── EmergencyBroadcast.tsx     — Emergency button with confirmation gate
└── hooks/
    ├── useCommsTransport.ts   — Transport abstraction hook
    ├── useChannel.ts          — Channel join/leave/state via Supabase RT
    ├── usePTT.ts              — PTT state machine (IDLE→REQUESTING→TALKING→IDLE)
    ├── useQuickCalls.ts       — Quick-call send/receive via Supabase Broadcast
    ├── useAudioDevice.ts      — Speaker/earpiece/wired routing
    └── useCommsStatus.ts      — Computed online/nearby/no-comms from transport health

lib/comms/
├── types.ts                   — All comms type definitions
├── transport.ts               — ICommsTransport interface
├── livekit-transport.ts       — LiveKit WebRTC media implementation
├── supabase-signaling.ts      — Supabase Realtime control plane
├── token-server.ts            — Server-side LiveKit token minting
└── constants.ts               — Quick-call types, channel defaults, timeouts

app/api/comms/
├── token/route.ts             — POST: mint LiveKit room token (authenticated)
├── channel/route.ts           — POST: create channel, GET: list user's channels
└── emergency/route.ts         — POST: emergency broadcast
```

---

## Pricing (Phase 1 Paid Bundle — Trimmed)

**Road Ready (Free):**
- 1 active channel at a time
- Internet PTT
- Quick-calls (all 7)
- Basic audio routing (speaker/earpiece/wired)
- Who's talking labels
- Emergency broadcast
- Status banner

**Fast Lane Comms ($4.99/mo, $49/yr):**
Phase 1 paid tier ships with ONLY:
- Replay recent messages
- Favorite channels
- Quick rejoin last job

Deferred to later paid updates:
- Advanced device presets
- Transcripts
- Multi-channel listen
- Priority reconnect
- Route-pin voice notes
- Tap-to-repeat

---

## 5-Layer HCOS Alignment

| Layer | Integration |
|-------|-------------|
| L1: Identity Spine | Channel membership requires verified identity. Token server checks Trust Tier. |
| L2: Compliance | Guardrail copy on every screen: "Supplemental communication feature. Always follow permit and state communication requirements." |
| L3: Corridor Intelligence | Quick-call pattern data (breakdown hotspots) feeds risk heatmaps. |
| L4: Financial Rail | Fast Lane Comms subscription via Stripe. Accessory affiliate revenue tracked. |
| L5: Command Index | Quick-call acknowledgment speed feeds Trust Score. Emergency broadcast usage logged. |

---

## Kill/Scale Logic (90-day evaluation)

**Keep and expand if:**
- ≥20% of active operators use comms ≥1x/month
- ≥8% use it on ≥3 separate days/month
- ≥3% convert to Fast Lane Comms or bundles tied to comms

**De-prioritize if:**
- Usage is novelty-only (test presses, no repeat)
- Support burden high, retention impact low
