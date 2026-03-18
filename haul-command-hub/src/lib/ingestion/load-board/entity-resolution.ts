/**
 * Haul Command Load Board Ingestion v3 — Entity Resolution
 *
 * Builds and merges identity graphs from parsed observations.
 * v3 adds: corridors_seen tracking, linked_identity_id bridge,
 * improved org detection with hybrid role handling.
 */

import type {
  ParsedObservation,
  OrganizationCandidate,
  ContactCandidate,
  PhoneRecord,
  AliasRecord,
  EntityScores,
  ScoreBand,
} from './types';

// ─── In-Memory Identity Store ────────────────────────────────────

export class IdentityGraph {
  private orgsByPhone = new Map<string, OrganizationCandidate>();
  private orgsByName = new Map<string, OrganizationCandidate>();
  private contactsByPhone = new Map<string, ContactCandidate>();
  private phoneRecords = new Map<string, PhoneRecord>();
  private aliases: AliasRecord[] = [];
  private batchId: string;

  constructor(batchId: string) {
    this.batchId = batchId;
  }

  processObservation(obs: ParsedObservation): void {
    if (!obs.parsed_name_or_company && !obs.normalized_phone) return;

    const now = new Date().toISOString();
    const canonicalName = obs.parsed_name_or_company
      ? canonicalize(obs.parsed_name_or_company)
      : null;

    if (obs.normalized_phone && !obs.phone_is_placeholder) {
      this.upsertPhone(obs, now);
    }

    if (canonicalName && looksLikeOrg(obs.parsed_name_or_company!)) {
      this.upsertOrg(obs, canonicalName, now);
    }

    if (canonicalName && !looksLikeOrg(obs.parsed_name_or_company!)) {
      this.upsertContact(obs, canonicalName, now);
    }

    if (obs.parsed_name_or_company) {
      this.aliases.push({
        display_variant: obs.parsed_name_or_company,
        canonical_candidate: canonicalName ?? obs.parsed_name_or_company,
        linked_phone: obs.normalized_phone,
        linked_org: looksLikeOrg(obs.parsed_name_or_company) ? canonicalName : null,
        source_batch_id: this.batchId,
        observed_at: now,
      });
    }
  }

  // ─── Upsert Helpers ──────────────────────────────────────────

  private upsertPhone(obs: ParsedObservation, now: string): void {
    const key = obs.normalized_phone!;
    const existing = this.phoneRecords.get(key);

    if (existing) {
      existing.observation_count += 1;
      existing.last_seen = now;
      if (obs.parsed_name_or_company && !existing.linked_names.includes(obs.parsed_name_or_company)) {
        existing.linked_names.push(obs.parsed_name_or_company);
      }
    } else {
      this.phoneRecords.set(key, {
        raw_phone: obs.raw_phone!,
        normalized_phone: key,
        is_placeholder: false,
        linked_names: obs.parsed_name_or_company ? [obs.parsed_name_or_company] : [],
        linked_orgs: [],
        observation_count: 1,
        first_seen: now,
        last_seen: now,
      });
    }
  }

  private upsertOrg(obs: ParsedObservation, canonicalName: string, now: string): void {
    let org: OrganizationCandidate | undefined;

    if (obs.normalized_phone && !obs.phone_is_placeholder) {
      org = this.orgsByPhone.get(obs.normalized_phone);
    }
    if (!org) {
      org = this.orgsByName.get(canonicalName);
    }

    if (org) {
      org.observation_count += 1;
      org.last_seen = now;
      if (obs.parsed_name_or_company && !org.aliases.includes(obs.parsed_name_or_company)) {
        org.aliases.push(obs.parsed_name_or_company);
      }
      if (obs.normalized_phone && !org.phones.includes(obs.normalized_phone)) {
        org.phones.push(obs.normalized_phone);
      }
      if (obs.country_code && !org.country_codes.includes(obs.country_code)) {
        org.country_codes.push(obs.country_code);
      }
      // v3: track corridors seen
      if (obs.corridor_key && !org.corridors_seen.includes(obs.corridor_key)) {
        org.corridors_seen.push(obs.corridor_key);
      }
      for (const rc of obs.role_candidates) {
        const existing = org.role_candidates.find((r) => r.role === rc.role);
        if (existing) {
          existing.confidence = Math.min(1, existing.confidence + 0.1);
        } else {
          org.role_candidates.push({ ...rc });
        }
      }
    } else {
      org = {
        canonical_name: canonicalName,
        display_name: obs.parsed_name_or_company!,
        aliases: [obs.parsed_name_or_company!],
        phones: obs.normalized_phone ? [obs.normalized_phone] : [],
        role_candidates: obs.role_candidates.map((r) => ({ ...r })),
        country_codes: obs.country_code ? [obs.country_code] : [],
        corridors_seen: obs.corridor_key ? [obs.corridor_key] : [],
        first_seen: now,
        last_seen: now,
        observation_count: 1,
        recurrence_score: 1,
        linked_identity_id: null,
      };
      this.orgsByName.set(canonicalName, org);
    }

    if (obs.normalized_phone && !obs.phone_is_placeholder) {
      this.orgsByPhone.set(obs.normalized_phone, org);
    }

    if (obs.normalized_phone) {
      const phone = this.phoneRecords.get(obs.normalized_phone);
      if (phone && !phone.linked_orgs.includes(canonicalName)) {
        phone.linked_orgs.push(canonicalName);
      }
    }
  }

  private upsertContact(obs: ParsedObservation, canonicalName: string, now: string): void {
    let contact: ContactCandidate | undefined;

    if (obs.normalized_phone && !obs.phone_is_placeholder) {
      contact = this.contactsByPhone.get(obs.normalized_phone);
    }

    if (contact) {
      contact.last_seen = now;
      if (obs.parsed_name_or_company && !contact.aliases.includes(obs.parsed_name_or_company)) {
        contact.aliases.push(obs.parsed_name_or_company);
      }
    } else {
      contact = {
        canonical_name: canonicalName,
        display_name: obs.parsed_name_or_company!,
        aliases: [obs.parsed_name_or_company!],
        phones: obs.normalized_phone ? [obs.normalized_phone] : [],
        linked_org_name: null,
        first_seen: now,
        last_seen: now,
      };
      if (obs.normalized_phone) {
        this.contactsByPhone.set(obs.normalized_phone, contact);
      }
    }
  }

  // ─── Results ─────────────────────────────────────────────────

  getOrganizations(): OrganizationCandidate[] {
    const seen = new Set<string>();
    const result: OrganizationCandidate[] = [];
    for (const org of this.orgsByName.values()) {
      if (!seen.has(org.canonical_name)) {
        seen.add(org.canonical_name);
        org.recurrence_score = org.observation_count;
        result.push(org);
      }
    }
    return result;
  }

  getContacts(): ContactCandidate[] {
    return Array.from(this.contactsByPhone.values());
  }

  getPhoneRecords(): PhoneRecord[] {
    return Array.from(this.phoneRecords.values());
  }

  getAliases(): AliasRecord[] {
    return this.aliases;
  }
}

// ─── Scoring ─────────────────────────────────────────────────────

export function scoreEntity(org: OrganizationCandidate): EntityScores {
  const recurrence = org.observation_count;
  const recurrenceBand = getRecurrenceBand(recurrence);
  const hasPhone = org.phones.length > 0;
  const hasMultipleAliases = org.aliases.length > 1;
  const hasMultipleCountries = org.country_codes.length > 1;
  const hasMultipleCorridors = org.corridors_seen.length > 1;

  let entityConfidence = 0.3;
  if (hasPhone) entityConfidence += 0.25;
  if (recurrence >= 3) entityConfidence += 0.2;
  if (hasMultipleAliases) entityConfidence += 0.1;
  if (hasMultipleCorridors) entityConfidence += 0.05;
  if (org.role_candidates.some((r) => r.confidence > 0.5)) entityConfidence += 0.1;

  let claimPriority = 0;
  if (recurrence >= 2) claimPriority += 0.3;
  if (hasPhone) claimPriority += 0.25;
  if (hasMultipleCountries) claimPriority += 0.15;
  if (hasMultipleCorridors) claimPriority += 0.1;
  if (entityConfidence > 0.6) claimPriority += 0.2;

  let completeness = 0;
  if (org.canonical_name) completeness += 0.2;
  if (hasPhone) completeness += 0.2;
  if (org.country_codes.length > 0) completeness += 0.2;
  if (org.role_candidates.length > 0) completeness += 0.2;
  if (org.corridors_seen.length > 0) completeness += 0.2;

  const monetization = (entityConfidence + claimPriority + completeness) / 3;

  return {
    recurrence_score: recurrence,
    recurrence_band: recurrenceBand,
    entity_confidence_score: round(entityConfidence),
    claim_priority_score: round(claimPriority),
    monetization_value_score: round(monetization),
    internal_risk_score: 0,
    public_display_eligible: entityConfidence >= 0.6 && recurrence >= 2,
    data_completeness_score: round(completeness),
  };
}

function getRecurrenceBand(count: number): ScoreBand {
  if (count >= 15) return 'dominant';
  if (count >= 5) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
}

// ─── Helpers ─────────────────────────────────────────────────────

function canonicalize(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[''`]/g, "'")
    .toLowerCase()
    .replace(/\b(?:llc|inc|corp|co|ltd|group)\b\.?/gi, '')
    .trim();
}

const ORG_INDICATORS =
  /(?:LLC|Inc|Corp|Co|Ltd|Group|Services|Solutions|Transport|Logistics|Express|Dispatch|Trucking|Hauling)\b/i;

function looksLikeOrg(name: string): boolean {
  if (ORG_INDICATORS.test(name)) return true;
  return name.split(/\s+/).length >= 3;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
