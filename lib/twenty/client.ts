// ============================================================
// Haul Command — Twenty CRM Client
// Internal CRM / ops / relationship management spine
// Custom objects for Haul Command entities
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

// ── Configuration ──

const TWENTY_API_URL = () => process.env.TWENTY_API_URL || 'http://localhost:3000/api';
const TWENTY_API_KEY = () => process.env.TWENTY_API_KEY || '';

function twentyHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TWENTY_API_KEY()}`,
  };
}

async function twentyFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${TWENTY_API_URL()}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...twentyHeaders(), ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Twenty] ${opts?.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Haul Command Entity Types ──
// These map to Twenty custom objects

export type HCEntityType =
  | 'operator'
  | 'broker'
  | 'escort'
  | 'carrier'
  | 'partner'
  | 'installer'
  | 'infrastructure'    // yards, lots, parking, hotels
  | 'route'             // routes / corridors
  | 'claim'
  | 'outreach_target'
  | 'sponsorship_lead'
  | 'market_activation';

export interface HCEntity {
  id?: string;
  type: HCEntityType;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  location?: { lat: number; lng: number; address?: string };
  tags?: string[];
  assignedTo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HCRelation {
  fromId: string;
  fromType: HCEntityType;
  toId: string;
  toType: HCEntityType;
  relationType: string;    // e.g., 'assigned_to', 'operates_on', 'sponsors'
  metadata?: Record<string, unknown>;
}

export interface HCActivity {
  entityId: string;
  entityType: HCEntityType;
  activityType: 'note' | 'call' | 'email' | 'task' | 'event' | 'status_change';
  title: string;
  body?: string;
  performedBy?: string;
  timestamp?: string;
}

// ── CRUD Operations ──

/**
 * Create or update an entity in Twenty.
 */
export async function upsertEntity(entity: HCEntity): Promise<HCEntity | null> {
  if (!isEnabled('TWENTY_CRM')) {
    console.warn('[Twenty] CRM disabled — entity not persisted');
    return null;
  }

  const objectName = entityTypeToObjectName(entity.type);
  const payload = mapEntityToTwentyRecord(entity);

  if (entity.id) {
    return twentyFetch<HCEntity>(`/objects/${objectName}/${entity.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  return twentyFetch<HCEntity>(`/objects/${objectName}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Find entities by type and optional filters.
 */
export async function findEntities(
  type: HCEntityType,
  filters?: Record<string, string | number | boolean>,
  limit: number = 50
): Promise<HCEntity[]> {
  if (!isEnabled('TWENTY_CRM')) return [];

  const objectName = entityTypeToObjectName(type);
  const params = new URLSearchParams({ limit: String(limit) });
  
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      params.set(`filter[${k}]`, String(v));
    }
  }

  const result = await twentyFetch<{ data: any[] }>(
    `/objects/${objectName}?${params}`
  );
  return (result.data || []).map(r => mapTwentyRecordToEntity(type, r));
}

/**
 * Get a single entity by ID and type.
 */
export async function getEntity(type: HCEntityType, id: string): Promise<HCEntity | null> {
  if (!isEnabled('TWENTY_CRM')) return null;
  try {
    const objectName = entityTypeToObjectName(type);
    const result = await twentyFetch<any>(`/objects/${objectName}/${id}`);
    return mapTwentyRecordToEntity(type, result);
  } catch {
    return null;
  }
}

/**
 * Log an activity against an entity.
 */
export async function logActivity(activity: HCActivity): Promise<boolean> {
  if (!isEnabled('TWENTY_CRM')) return false;

  try {
    await twentyFetch('/objects/activities', {
      method: 'POST',
      body: JSON.stringify({
        title: activity.title,
        body: activity.body || '',
        type: activity.activityType,
        linkedObjectId: activity.entityId,
        linkedObjectType: entityTypeToObjectName(activity.entityType),
        performedBy: activity.performedBy,
        completedAt: activity.timestamp || new Date().toISOString(),
      }),
    });
    return true;
  } catch (err) {
    console.error('[Twenty] Failed to log activity:', err);
    return false;
  }
}

/**
 * Create a relation between two entities.
 */
export async function createRelation(relation: HCRelation): Promise<boolean> {
  if (!isEnabled('TWENTY_CRM')) return false;

  try {
    await twentyFetch('/objects/relations', {
      method: 'POST',
      body: JSON.stringify({
        fromObjectId: relation.fromId,
        fromObjectType: entityTypeToObjectName(relation.fromType),
        toObjectId: relation.toId,
        toObjectType: entityTypeToObjectName(relation.toType),
        relationType: relation.relationType,
        metadata: relation.metadata || {},
      }),
    });
    return true;
  } catch (err) {
    console.error('[Twenty] Failed to create relation:', err);
    return false;
  }
}

/**
 * Health check.
 */
export async function healthCheck(): Promise<boolean> {
  if (!isEnabled('TWENTY_CRM')) return false;
  try {
    await twentyFetch('/metadata/objects');
    return true;
  } catch {
    return false;
  }
}

// ── Mapping Helpers ──

function entityTypeToObjectName(type: HCEntityType): string {
  const map: Record<HCEntityType, string> = {
    operator: 'hcOperators',
    broker: 'hcBrokers',
    escort: 'hcEscorts',
    carrier: 'hcCarriers',
    partner: 'hcPartners',
    installer: 'hcInstallers',
    infrastructure: 'hcInfrastructure',
    route: 'hcRoutes',
    claim: 'hcClaims',
    outreach_target: 'hcOutreachTargets',
    sponsorship_lead: 'hcSponsorshipLeads',
    market_activation: 'hcMarketActivations',
  };
  return map[type] || type;
}

function mapEntityToTwentyRecord(entity: HCEntity): Record<string, unknown> {
  return {
    name: entity.name,
    email: entity.email,
    phone: entity.phone,
    status: entity.status,
    metadata: entity.metadata,
    latitude: entity.location?.lat,
    longitude: entity.location?.lng,
    address: entity.location?.address,
    tags: entity.tags,
    assignedTo: entity.assignedTo,
    notes: entity.notes,
  };
}

function mapTwentyRecordToEntity(type: HCEntityType, record: any): HCEntity {
  return {
    id: record.id,
    type,
    name: record.name || '',
    email: record.email,
    phone: record.phone,
    status: record.status,
    metadata: record.metadata,
    location: record.latitude ? {
      lat: record.latitude,
      lng: record.longitude,
      address: record.address,
    } : undefined,
    tags: record.tags,
    assignedTo: record.assignedTo,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
