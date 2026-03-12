# Haul Command Comms — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship internet push-to-talk convoy comms with LiveKit audio + Supabase signaling.

**Architecture:** LiveKit WebRTC media for audio, Supabase Realtime for control plane (presence, quick-calls, channel state). Server-minted LiveKit tokens. Custom PTT UI. 5 lean DB tables.

**Tech Stack:** Next.js 16, Supabase (Realtime + Postgres), LiveKit (`livekit-client` web SDK, `livekit-server-sdk` for tokens), Stripe (paid tier), PostHog (analytics)

**Design Doc:** `docs/plans/2026-03-12-haul-command-comms-design.md`

---

### Task 1: Types & Constants

**Files:**
- Create: `lib/comms/types.ts`
- Create: `lib/comms/constants.ts`

**Step 1: Create type definitions**

```typescript
// lib/comms/types.ts
export type CommsChannelType = 'job_channel' | 'convoy_channel' | 'lead_rear_private' | 'escort_only' | 'emergency';
export type CommsRole = 'lead' | 'rear' | 'escort' | 'driver' | 'observer';
export type CommsPlan = 'road_ready' | 'fast_lane';
export type CommsStatus = 'online' | 'nearby_only' | 'no_comms'; // ephemeral, never persisted
export type QuickCallType = 'stop' | 'hold' | 'clear' | 'low_wire' | 'breakdown' | 'lane_move' | 'permit_issue';
export type PTTState = 'idle' | 'requesting' | 'talking' | 'blocked';
export type DeviceRoute = 'speaker' | 'earpiece' | 'wired_headset';
export type CommsEventType = 'ptt_started' | 'ptt_stopped' | 'channel_joined' | 'channel_left' | 'quick_call_sent' | 'emergency_broadcast_sent';

export interface CommsChannel {
  id: string;
  channel_type: CommsChannelType;
  source_id: string; // job/load FK
  display_name: string;
  livekit_room_name: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface CommsMember {
  channel_id: string;
  user_id: string;
  display_name: string;
  role: CommsRole;
  is_muted: boolean;
  joined_at: string;
}

export interface QuickCall {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  call_type: QuickCallType;
  sent_at: string;
}

export interface CommsPreferences {
  user_id: string;
  plan: CommsPlan;
  auto_join_job_channel: boolean;
  device_route: DeviceRoute;
  favorite_channel_ids: string[];
}

// Transport abstraction
export interface ICommsTransport {
  connect(roomName: string, token: string): Promise<void>;
  disconnect(): Promise<void>;
  startTransmit(): Promise<void>;
  stopTransmit(): Promise<void>;
  isSpeaking(): boolean;
  onRemoteAudio(cb: (userId: string, speaking: boolean) => void): void;
  onConnectionStateChange(cb: (state: 'connected' | 'reconnecting' | 'disconnected') => void): void;
}
```

**Step 2: Create constants**

```typescript
// lib/comms/constants.ts
import type { QuickCallType } from './types';

export const QUICK_CALLS: Record<QuickCallType, { label: string; emoji: string; color: string }> = {
  stop: { label: 'STOP', emoji: '🛑', color: '#ef4444' },
  hold: { label: 'HOLD', emoji: '✋', color: '#f59e0b' },
  clear: { label: 'CLEAR', emoji: '✅', color: '#22c55e' },
  low_wire: { label: 'LOW WIRE', emoji: '⚡', color: '#f97316' },
  breakdown: { label: 'BREAKDOWN', emoji: '🔧', color: '#ef4444' },
  lane_move: { label: 'LANE MOVE', emoji: '↔️', color: '#3b82f6' },
  permit_issue: { label: 'PERMIT ISSUE', emoji: '📋', color: '#a855f7' },
};

export const COMMS_FEATURE_FLAGS = {
  comms_enabled: 'comms_enabled',
  nearby_mode_enabled: 'nearby_mode_enabled',
  bluetooth_ptt_enabled: 'bluetooth_ptt_enabled',
  transcript_enabled: 'transcript_enabled',
  replay_enabled: 'replay_enabled',
  route_voice_notes_enabled: 'route_voice_notes_enabled',
  hardware_bridge_enabled: 'hardware_bridge_enabled',
} as const;

export const PTT_TIMEOUT_MS = 60_000; // max continuous transmit
export const CHANNEL_EXPIRE_HOURS = 72;
export const TOKEN_EXPIRY_SECONDS = 3600;
export const SUPABASE_COMMS_CHANNEL_PREFIX = 'comms:';
export const GUARDRAIL_COPY = 'Supplemental communication feature. Always follow permit and state communication requirements.';
```

**Step 3: Commit**
```bash
git add lib/comms/types.ts lib/comms/constants.ts
git commit -m "feat(comms): add type definitions and constants"
```

---

### Task 2: Database Migration (5 Lean Tables)

**Files:**
- Create: `supabase/migrations/20260312_comms_phase1.sql`

**Step 1: Write migration**

```sql
-- Haul Command Comms — Phase 1 Schema (Lean)
-- 5 tables: channels, members, quick_calls, events, preferences
-- NO voice_notes, transcripts, replay, or route-pin tables yet.

-- Enums
CREATE TYPE comms_channel_type AS ENUM (
  'job_channel', 'convoy_channel', 'lead_rear_private',
  'escort_only', 'emergency'
);
CREATE TYPE comms_role AS ENUM ('lead', 'rear', 'escort', 'driver', 'observer');
CREATE TYPE comms_plan AS ENUM ('road_ready', 'fast_lane');
CREATE TYPE quick_call_type AS ENUM (
  'stop', 'hold', 'clear', 'low_wire',
  'breakdown', 'lane_move', 'permit_issue'
);
CREATE TYPE comms_event_type AS ENUM (
  'ptt_started', 'ptt_stopped', 'channel_joined', 'channel_left',
  'quick_call_sent', 'emergency_broadcast_sent'
);

-- 1. Channels
CREATE TABLE comms_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type comms_channel_type NOT NULL DEFAULT 'job_channel',
  source_id uuid, -- FK to jobs/loads (nullable for emergency/test)
  display_name text NOT NULL,
  livekit_room_name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX idx_comms_channels_source ON comms_channels(source_id) WHERE is_active;
CREATE INDEX idx_comms_channels_active ON comms_channels(is_active) WHERE is_active;

-- 2. Members
CREATE TABLE comms_members (
  channel_id uuid NOT NULL REFERENCES comms_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL DEFAULT 'Unknown',
  role comms_role NOT NULL DEFAULT 'escort',
  is_muted boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (channel_id, user_id)
);
CREATE INDEX idx_comms_members_user ON comms_members(user_id) WHERE left_at IS NULL;

-- 3. Quick Calls
CREATE TABLE comms_quick_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES comms_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT 'Unknown',
  call_type quick_call_type NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quick_calls_channel ON comms_quick_calls(channel_id, sent_at DESC);

-- 4. Events (analytics pipeline)
CREATE TABLE comms_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type comms_event_type NOT NULL,
  channel_id uuid REFERENCES comms_channels(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comms_events_type ON comms_events(event_type, created_at DESC);
CREATE INDEX idx_comms_events_user ON comms_events(user_id, created_at DESC);

-- 5. Preferences
CREATE TABLE comms_preferences (
  user_id uuid PRIMARY KEY,
  plan comms_plan NOT NULL DEFAULT 'road_ready',
  auto_join_job_channel boolean NOT NULL DEFAULT true,
  device_route text NOT NULL DEFAULT 'speaker',
  favorite_channel_ids uuid[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE comms_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_quick_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_preferences ENABLE ROW LEVEL SECURITY;

-- Channels: members can read, server creates
CREATE POLICY "Members can view active channels" ON comms_channels
  FOR SELECT USING (
    is_active AND EXISTS (
      SELECT 1 FROM comms_members
      WHERE comms_members.channel_id = comms_channels.id
        AND comms_members.user_id = auth.uid()
        AND comms_members.left_at IS NULL
    )
  );

-- Members: can see co-members in their channels
CREATE POLICY "Members can view channel members" ON comms_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comms_members m2
      WHERE m2.channel_id = comms_members.channel_id
        AND m2.user_id = auth.uid()
        AND m2.left_at IS NULL
    )
  );

-- Quick calls: members can insert and read
CREATE POLICY "Members can send quick calls" ON comms_quick_calls
  FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Members can view quick calls" ON comms_quick_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comms_members
      WHERE comms_members.channel_id = comms_quick_calls.channel_id
        AND comms_members.user_id = auth.uid()
        AND comms_members.left_at IS NULL
    )
  );

-- Events: users can insert their own, read their own
CREATE POLICY "Users can log own events" ON comms_events
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read own events" ON comms_events
  FOR SELECT USING (user_id = auth.uid());

-- Preferences: own row only
CREATE POLICY "Users manage own preferences" ON comms_preferences
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Step 2: Commit**
```bash
git add supabase/migrations/20260312_comms_phase1.sql
git commit -m "feat(comms): add Phase 1 database schema (5 tables)"
```

---

### Task 3: LiveKit Token Server

**Files:**
- Create: `app/api/comms/token/route.ts`
- Create: `lib/comms/token-server.ts`

**Step 1: Install LiveKit server SDK**
```bash
npm install livekit-server-sdk
```

**Step 2: Token minting logic**
```typescript
// lib/comms/token-server.ts
import { AccessToken } from 'livekit-server-sdk';
import { TOKEN_EXPIRY_SECONDS } from './constants';

export function mintRoomToken(
  roomName: string,
  userId: string,
  displayName: string,
): string {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: displayName,
    ttl: TOKEN_EXPIRY_SECONDS,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}
```

**Step 3: API route**
```typescript
// app/api/comms/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mintRoomToken } from '@/lib/comms/token-server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { channel_id } = await req.json();
  if (!channel_id) return NextResponse.json({ error: 'channel_id required' }, { status: 400 });

  // Verify membership
  const { data: member } = await supabase
    .from('comms_members')
    .select('channel_id, display_name')
    .eq('channel_id', channel_id)
    .eq('user_id', user.id)
    .is('left_at', null)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a channel member' }, { status: 403 });

  // Get channel's LiveKit room name
  const { data: channel } = await supabase
    .from('comms_channels')
    .select('livekit_room_name, is_active')
    .eq('id', channel_id)
    .single();

  if (!channel?.is_active) return NextResponse.json({ error: 'Channel inactive' }, { status: 404 });

  const token = await mintRoomToken(channel.livekit_room_name, user.id, member.display_name);

  return NextResponse.json({ token, room: channel.livekit_room_name, wsUrl: process.env.LIVEKIT_WS_URL });
}
```

**Step 4: Commit**
```bash
git add lib/comms/token-server.ts app/api/comms/token/route.ts package.json package-lock.json
git commit -m "feat(comms): add LiveKit token server and API route"
```

---

### Task 4: LiveKit Audio Transport

**Files:**
- Create: `lib/comms/transport.ts` (abstract interface — already in types)
- Create: `lib/comms/livekit-transport.ts`

**Step 1: Install LiveKit client SDK**
```bash
npm install livekit-client
```

**Step 2: LiveKit transport implementation**
```typescript
// lib/comms/livekit-transport.ts
import {
  Room, RoomEvent, Track, ConnectionState,
  LocalAudioTrack, createLocalAudioTrack,
} from 'livekit-client';
import type { ICommsTransport } from './types';
import { PTT_TIMEOUT_MS } from './constants';

export class LiveKitTransport implements ICommsTransport {
  private room: Room;
  private localAudioTrack: LocalAudioTrack | null = null;
  private transmitTimeout: ReturnType<typeof setTimeout> | null = null;
  private remoteAudioCb: ((userId: string, speaking: boolean) => void) | null = null;
  private connectionCb: ((state: 'connected' | 'reconnecting' | 'disconnected') => void) | null = null;

  constructor() {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });

    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      const mapped = state === ConnectionState.Connected ? 'connected'
        : state === ConnectionState.Reconnecting ? 'reconnecting' : 'disconnected';
      this.connectionCb?.(mapped);
    });

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      if (!this.remoteAudioCb) return;
      const speakingIds = new Set(speakers.map(s => s.identity));
      for (const p of this.room.remoteParticipants.values()) {
        this.remoteAudioCb(p.identity, speakingIds.has(p.identity));
      }
    });
  }

  async connect(roomName: string, token: string): Promise<void> {
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!;
    await this.room.connect(wsUrl, token);
    // Pre-create audio track but keep it muted until transmit
    this.localAudioTrack = await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true });
    await this.room.localParticipant.publishTrack(this.localAudioTrack);
    await this.localAudioTrack.mute();
  }

  async disconnect(): Promise<void> {
    if (this.transmitTimeout) clearTimeout(this.transmitTimeout);
    this.localAudioTrack?.stop();
    await this.room.disconnect();
  }

  async startTransmit(): Promise<void> {
    if (!this.localAudioTrack) return;
    await this.localAudioTrack.unmute();
    // Safety: auto-stop after PTT_TIMEOUT_MS
    this.transmitTimeout = setTimeout(() => this.stopTransmit(), PTT_TIMEOUT_MS);
  }

  async stopTransmit(): Promise<void> {
    if (this.transmitTimeout) { clearTimeout(this.transmitTimeout); this.transmitTimeout = null; }
    if (!this.localAudioTrack) return;
    await this.localAudioTrack.mute();
  }

  isSpeaking(): boolean {
    return this.localAudioTrack ? !this.localAudioTrack.isMuted : false;
  }

  onRemoteAudio(cb: (userId: string, speaking: boolean) => void): void {
    this.remoteAudioCb = cb;
  }

  onConnectionStateChange(cb: (state: 'connected' | 'reconnecting' | 'disconnected') => void): void {
    this.connectionCb = cb;
  }
}
```

**Step 3: Commit**
```bash
git add lib/comms/livekit-transport.ts package.json package-lock.json
git commit -m "feat(comms): add LiveKit audio transport implementation"
```

---

### Task 5: Supabase Signaling (Control Plane)

**Files:**
- Create: `lib/comms/supabase-signaling.ts`

**Step 1: Supabase control plane**

```typescript
// lib/comms/supabase-signaling.ts
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { QuickCall, QuickCallType, CommsEventType } from './types';
import { SUPABASE_COMMS_CHANNEL_PREFIX } from './constants';

type SupabaseClient = ReturnType<typeof import('@/utils/supabase/client').createClient>;

export class SupabaseSignaling {
  private channel: RealtimeChannel | null = null;
  private supabase: SupabaseClient;
  private channelId: string;
  private userId: string;
  private displayName: string;

  constructor(supabase: SupabaseClient, channelId: string, userId: string, displayName: string) {
    this.supabase = supabase;
    this.channelId = channelId;
    this.userId = userId;
    this.displayName = displayName;
  }

  async join(callbacks: {
    onQuickCall?: (qc: QuickCall) => void;
    onTalkingChanged?: (userId: string, talking: boolean) => void;
    onEmergency?: (senderId: string, senderName: string) => void;
    onPresenceSync?: (members: Array<{ user_id: string; display_name: string; talking: boolean }>) => void;
  }): Promise<void> {
    const name = `${SUPABASE_COMMS_CHANNEL_PREFIX}${this.channelId}`;

    this.channel = this.supabase.channel(name, { config: { presence: { key: this.userId } } });

    this.channel
      .on('broadcast', { event: 'quick_call' }, ({ payload }) => callbacks.onQuickCall?.(payload as QuickCall))
      .on('broadcast', { event: 'talking' }, ({ payload }) => callbacks.onTalkingChanged?.(payload.user_id, payload.talking))
      .on('broadcast', { event: 'emergency' }, ({ payload }) => callbacks.onEmergency?.(payload.sender_id, payload.sender_name))
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel) return;
        const state = this.channel.presenceState();
        const members: Array<{ user_id: string; display_name: string; talking: boolean }> = [];
        for (const entries of Object.values(state)) {
          for (const e of entries as any[]) {
            members.push({ user_id: e.user_id, display_name: e.display_name, talking: e.talking ?? false });
          }
        }
        callbacks.onPresenceSync?.(members);
      });

    await this.channel.subscribe();
    await this.channel.track({ user_id: this.userId, display_name: this.displayName, talking: false });
  }

  async broadcastTalking(talking: boolean): Promise<void> {
    await this.channel?.send({ type: 'broadcast', event: 'talking', payload: { user_id: this.userId, talking } });
    await this.channel?.track({ user_id: this.userId, display_name: this.displayName, talking });
  }

  async sendQuickCall(callType: QuickCallType): Promise<void> {
    const qc: Partial<QuickCall> = {
      channel_id: this.channelId, sender_id: this.userId,
      sender_name: this.displayName, call_type: callType, sent_at: new Date().toISOString(),
    };
    // Broadcast for real-time delivery
    await this.channel?.send({ type: 'broadcast', event: 'quick_call', payload: qc });
    // Persist for replay
    await this.supabase.from('comms_quick_calls').insert(qc);
  }

  async sendEmergency(): Promise<void> {
    await this.channel?.send({
      type: 'broadcast', event: 'emergency',
      payload: { sender_id: this.userId, sender_name: this.displayName, sent_at: new Date().toISOString() },
    });
    await this.logEvent('emergency_broadcast_sent');
  }

  async logEvent(eventType: CommsEventType, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.supabase.from('comms_events').insert({
      event_type: eventType, channel_id: this.channelId, user_id: this.userId, metadata,
    });
  }

  async leave(): Promise<void> {
    await this.channel?.untrack();
    await this.channel?.unsubscribe();
    this.channel = null;
  }
}
```

**Step 2: Commit**
```bash
git add lib/comms/supabase-signaling.ts
git commit -m "feat(comms): add Supabase signaling control plane"
```

---

### Task 6: Channel Management API

**Files:**
- Create: `app/api/comms/channel/route.ts`

**Step 1: Channel CRUD API**

```typescript
// app/api/comms/channel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CHANNEL_EXPIRE_HOURS } from '@/lib/comms/constants';

// POST: create channel from active job
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { source_id, display_name, channel_type = 'job_channel' } = await req.json();

  const livekit_room_name = `hc_${channel_type}_${source_id ?? crypto.randomUUID()}`;

  // Check if channel already exists for this source
  if (source_id) {
    const { data: existing } = await supabase
      .from('comms_channels').select('id')
      .eq('source_id', source_id).eq('is_active', true).single();
    if (existing) {
      // Auto-join existing
      await supabase.from('comms_members').upsert({
        channel_id: existing.id, user_id: user.id,
        display_name: display_name ?? 'Operator', left_at: null,
      }, { onConflict: 'channel_id,user_id' });
      return NextResponse.json({ channel_id: existing.id, created: false });
    }
  }

  const expires_at = new Date(Date.now() + CHANNEL_EXPIRE_HOURS * 3600_000).toISOString();

  const { data: channel, error } = await supabase.from('comms_channels').insert({
    channel_type, source_id, display_name: display_name ?? 'Job Channel',
    livekit_room_name, expires_at,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-add creator as member
  await supabase.from('comms_members').insert({
    channel_id: channel.id, user_id: user.id,
    display_name: display_name ?? 'Operator', role: 'lead',
  });

  return NextResponse.json({ channel_id: channel.id, created: true }, { status: 201 });
}

// GET: list user's active channels
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('comms_members')
    .select('channel_id, role, comms_channels(id, display_name, channel_type, is_active, created_at)')
    .eq('user_id', user.id)
    .is('left_at', null);

  const channels = (data ?? []).filter((m: any) => m.comms_channels?.is_active);
  return NextResponse.json({ channels });
}
```

**Step 2: Commit**
```bash
git add app/api/comms/channel/route.ts
git commit -m "feat(comms): add channel management API"
```

---

### Task 7: React Hooks (usePTT, useChannel, useCommsStatus)

**Files:**
- Create: `components/comms/hooks/usePTT.ts`
- Create: `components/comms/hooks/useChannel.ts`
- Create: `components/comms/hooks/useCommsStatus.ts`
- Create: `components/comms/hooks/useQuickCalls.ts`
- Create: `components/comms/hooks/useAudioDevice.ts`

These hooks compose the LiveKit transport + Supabase signaling. Full implementations reference the types from Task 1 and transports from Tasks 4-5. Each hook is a focused single-responsibility unit:

- `usePTT`: State machine (IDLE→REQUESTING→TALKING→IDLE), coordinates LiveKit mute/unmute + Supabase talking broadcast
- `useChannel`: Join/leave/list channels, fetch token, connect transport
- `useCommsStatus`: Computed from transport connection state (online/nearby/no_comms), never persisted
- `useQuickCalls`: Send/receive quick-calls via Supabase Broadcast, persist to DB
- `useAudioDevice`: Web Audio API output routing (speaker/earpiece/wired)

**Step 1: Create all 5 hook files with implementations**

**Step 2: Commit**
```bash
git add components/comms/hooks/
git commit -m "feat(comms): add React hooks for PTT, channel, status, quick-calls, audio device"
```

---

### Task 8: UI Components (TalkButton, QuickCallBar, StatusBanner, ChannelHeader, MemberList, EmergencyBroadcast, CommsFAB)

**Files:**
- Create: `components/comms/TalkButton.tsx` — BIG glove-friendly button (min 80×80px touch target)
- Create: `components/comms/QuickCallBar.tsx` — 7 quick-call buttons in scrollable row
- Create: `components/comms/StatusBanner.tsx` — Online/nearby/no-comms computed banner
- Create: `components/comms/ChannelHeader.tsx` — Channel name + member count + guardrail copy
- Create: `components/comms/MemberList.tsx` — Who's in channel + speaking indicator
- Create: `components/comms/EmergencyBroadcast.tsx` — Red button with 2-step confirmation
- Create: `components/comms/CommsFAB.tsx` — Floating action button on active job pages

All components use Dark Future Industrial aesthetic (HC brand). TalkButton uses press-and-hold with visual feedback (pulsing ring while talking, red flash on blocked).

**Step 1: Create all component files**

**Step 2: Commit**
```bash
git add components/comms/*.tsx
git commit -m "feat(comms): add PTT UI components"
```

---

### Task 9: CommsProvider (Context)

**Files:**
- Create: `components/comms/CommsProvider.tsx`
- Create: `components/comms/index.ts`

CommsProvider wraps the transport layer + signaling + hooks into a single React context that any page can consume. Initializes LiveKitTransport and SupabaseSignaling, manages active channel state, and provides PTT controls to children.

**Step 1: Create provider and barrel export**

**Step 2: Commit**
```bash
git add components/comms/CommsProvider.tsx components/comms/index.ts
git commit -m "feat(comms): add CommsProvider context and barrel exports"
```

---

### Task 10: Integration & Feature Flag Gate

**Files:**
- Modify: active job page to render CommsFAB when `comms_enabled` flag is true
- Create: `app/api/comms/emergency/route.ts`

Wire CommsFAB into the active job view. Gate all comms UI behind `comms_enabled` feature flag. Emergency API route broadcasts to all channel members.

**Step 1: Create emergency API route**

**Step 2: Add CommsFAB to active job page layout**

**Step 3: Final typecheck**
```bash
npx tsc --noEmit
```

**Step 4: Commit and push**
```bash
git add -A
git commit -m "feat(comms): integrate Phase 1 comms into active job pages"
git push
```

---

### Task 11: Environment Variables

Add to `.env.local` and Vercel environment:
```
LIVEKIT_API_KEY=<your-key>
LIVEKIT_API_SECRET=<your-secret>
LIVEKIT_WS_URL=wss://<your-livekit-host>
NEXT_PUBLIC_LIVEKIT_WS_URL=wss://<your-livekit-host>
```

LiveKit Cloud free tier: 50 monthly participants, good for proving usage before self-hosting.

---

## Execution Order

| # | Task | Depends On | Est. |
|---|------|------------|------|
| 1 | Types & Constants | — | 5 min |
| 2 | Database Migration | — | 10 min |
| 3 | LiveKit Token Server | 1 | 10 min |
| 4 | LiveKit Audio Transport | 1 | 15 min |
| 5 | Supabase Signaling | 1 | 15 min |
| 6 | Channel Management API | 1, 2 | 10 min |
| 7 | React Hooks | 1, 4, 5 | 20 min |
| 8 | UI Components | 1, 7 | 25 min |
| 9 | CommsProvider | 7, 8 | 10 min |
| 10 | Integration & Flag Gate | 9 | 10 min |
| 11 | Environment Variables | 3 | 5 min |

**Total estimated: ~2.5 hours of focused implementation**
