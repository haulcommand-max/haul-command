/**
 * Haul Command — SQLite Offline Engine
 *
 * Manages the local SQLite database for offline-first operation.
 * Handles: schema init, outbox queue, cache reads/writes, sync state.
 *
 * Uses @capacitor-community/sqlite for native SQLite access.
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { safeUUID } from '@/lib/identity/uid';

// ─── Types ────────────────────────────────────────────────
export interface OutboxEvent {
    id: string;
    type: string;
    payload: string; // JSON string
    created_at: string;
    tries: number;
    last_error?: string;
    next_retry_at?: string;
}

export interface SyncState {
    resource: string;
    last_synced_at: string | null;
    last_cursor: string | null;
    updated_at: string;
}

// ─── Constants ────────────────────────────────────────────
const DB_NAME = 'haulcommand_offline';
const DB_VERSION = 1;

// ─── SQLite Schema (must match lib/mobile/sqlite/schema.sql) ─
const SCHEMA_SQL = `
pragma foreign_keys = ON;

create table if not exists kv_meta (
  k text primary key,
  v text not null
);

create table if not exists sync_state (
  resource text primary key,
  last_synced_at text,
  last_cursor text,
  updated_at text not null
);

create table if not exists outbox_events (
  id text primary key,
  type text not null,
  payload text not null,
  created_at text not null,
  tries integer not null default 0,
  last_error text,
  next_retry_at text
);

create table if not exists loads_cache (
  load_id text primary key,
  payload text not null,
  updated_at text not null
);

create table if not exists operator_profile_cache (
  user_id text primary key,
  payload text not null,
  updated_at text not null
);

create table if not exists leaderboard_cache (
  scope text primary key,
  payload text not null,
  updated_at text not null
);

create table if not exists geojson_cache (
  key text primary key,
  payload text not null,
  expires_at text,
  updated_at text not null
);

create index if not exists outbox_next_retry_idx on outbox_events (next_retry_at);
create index if not exists loads_cache_updated_idx on loads_cache (updated_at);
`;

// ─── Singleton ────────────────────────────────────────────
let _sqlite: SQLiteConnection | null = null;
let _db: SQLiteDBConnection | null = null;

async function getDb(): Promise<SQLiteDBConnection> {
    if (_db) return _db;

    if (!Capacitor.isNativePlatform()) {
        throw new Error('SQLite is only available on native platforms');
    }

    _sqlite = new SQLiteConnection(CapacitorSQLite);
    _db = await _sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
    await _db.open();

    // Run schema
    const statements = SCHEMA_SQL.split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const stmt of statements) {
        await _db.execute(stmt + ';');
    }

    return _db;
}

// ─── Outbox ───────────────────────────────────────────────
export async function addOutboxEvent(type: string, payload: Record<string, unknown>): Promise<string> {
    const db = await getDb();
    const id = safeUUID();
    const now = new Date().toISOString();

    await db.run(
        `INSERT INTO outbox_events (id, type, payload, created_at) VALUES (?, ?, ?, ?)`,
        [id, type, JSON.stringify(payload), now]
    );

    return id;
}

export async function getOutboxEvents(limit = 50): Promise<OutboxEvent[]> {
    const db = await getDb();
    const result = await db.query(
        `SELECT * FROM outbox_events ORDER BY created_at ASC LIMIT ?`,
        [limit]
    );
    return (result.values ?? []) as OutboxEvent[];
}

export async function removeOutboxEvent(id: string): Promise<void> {
    const db = await getDb();
    await db.run(`DELETE FROM outbox_events WHERE id = ?`, [id]);
}

export async function markOutboxRetry(id: string, error: string): Promise<void> {
    const db = await getDb();
    const retryAt = new Date(Date.now() + 30_000).toISOString(); // retry in 30s
    await db.run(
        `UPDATE outbox_events SET tries = tries + 1, last_error = ?, next_retry_at = ? WHERE id = ?`,
        [error, retryAt, id]
    );
}

// ─── Cache: Loads ─────────────────────────────────────────
export async function cacheLoad(loadId: string, payload: Record<string, unknown>): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.run(
        `INSERT OR REPLACE INTO loads_cache (load_id, payload, updated_at) VALUES (?, ?, ?)`,
        [loadId, JSON.stringify(payload), now]
    );
}

export async function getCachedLoad(loadId: string): Promise<Record<string, unknown> | null> {
    const db = await getDb();
    const result = await db.query(`SELECT payload FROM loads_cache WHERE load_id = ?`, [loadId]);
    if (!result.values?.length) return null;
    return JSON.parse(result.values[0].payload as string);
}

export async function getAllCachedLoads(): Promise<Array<{ load_id: string; payload: Record<string, unknown> }>> {
    const db = await getDb();
    const result = await db.query(`SELECT load_id, payload FROM loads_cache ORDER BY updated_at DESC LIMIT 200`);
    return (result.values ?? []).map((r: any) => ({
        load_id: r.load_id,
        payload: JSON.parse(r.payload),
    }));
}

// ─── Cache: Leaderboard ───────────────────────────────────
export async function cacheLeaderboard(scope: string, payload: unknown): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.run(
        `INSERT OR REPLACE INTO leaderboard_cache (scope, payload, updated_at) VALUES (?, ?, ?)`,
        [scope, JSON.stringify(payload), now]
    );
}

export async function getCachedLeaderboard(scope: string): Promise<unknown | null> {
    const db = await getDb();
    const result = await db.query(`SELECT payload FROM leaderboard_cache WHERE scope = ?`, [scope]);
    if (!result.values?.length) return null;
    return JSON.parse(result.values[0].payload as string);
}

// ─── Cache: Profile ───────────────────────────────────────
export async function cacheProfile(userId: string, payload: Record<string, unknown>): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.run(
        `INSERT OR REPLACE INTO operator_profile_cache (user_id, payload, updated_at) VALUES (?, ?, ?)`,
        [userId, JSON.stringify(payload), now]
    );
}

export async function getCachedProfile(userId: string): Promise<Record<string, unknown> | null> {
    const db = await getDb();
    const result = await db.query(`SELECT payload FROM operator_profile_cache WHERE user_id = ?`, [userId]);
    if (!result.values?.length) return null;
    return JSON.parse(result.values[0].payload as string);
}

// ─── Sync State ───────────────────────────────────────────
export async function getSyncState(resource: string): Promise<SyncState | null> {
    const db = await getDb();
    const result = await db.query(`SELECT * FROM sync_state WHERE resource = ?`, [resource]);
    if (!result.values?.length) return null;
    return result.values[0] as SyncState;
}

export async function setSyncState(resource: string, cursor?: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.run(
        `INSERT OR REPLACE INTO sync_state (resource, last_synced_at, last_cursor, updated_at) VALUES (?, ?, ?, ?)`,
        [resource, now, cursor ?? null, now]
    );
}

// ─── KV Meta ──────────────────────────────────────────────
export async function getKV(key: string): Promise<string | null> {
    const db = await getDb();
    const result = await db.query(`SELECT v FROM kv_meta WHERE k = ?`, [key]);
    if (!result.values?.length) return null;
    return result.values[0].v as string;
}

export async function setKV(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.run(`INSERT OR REPLACE INTO kv_meta (k, v) VALUES (?, ?)`, [key, value]);
}

// ─── Cleanup ──────────────────────────────────────────────
export async function closeDatabase(): Promise<void> {
    if (_db) {
        await _db.close();
        _db = null;
    }
    if (_sqlite) {
        await _sqlite.closeConnection(DB_NAME, false);
        _sqlite = null;
    }
}
