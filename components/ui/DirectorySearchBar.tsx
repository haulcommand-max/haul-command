'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, X, MapPin, BadgeCheck, Filter, Globe2, SlidersHorizontal } from 'lucide-react';
import { stateFullName } from '@/lib/geo/state-names';

/**
 * DirectorySearchBar — Client-side search + filter for directory/available-now grids.
 * 
 * Usage:
 *   <DirectorySearchBar items={operators} onFilter={setFilteredOps} />
 * 
 * Filters by company name, state, city. Can be extended with equipment/service type.
 */

interface DirectorySearchBarProps {
  items: any[];
  onFilter: (filtered: any[]) => void;
  placeholder?: string;
  /** Field names on the item to search against */
  searchFields?: string[];
  /** Optional state options for dropdown */
  stateOptions?: { code: string; name: string }[];
  /** Show compact variant */
  compact?: boolean;
  /** Command surface variant for dark public directory pages */
  surface?: 'light' | 'command';
  initialFilters?: Partial<DirectoryFilterState>;
}

export type DirectorySortMode = 'score' | 'newest' | 'name';
export type DirectoryProofFilter = 'all' | 'verified' | 'contact_confirmed';
export type DirectoryClaimFilter = 'all' | 'claimed' | 'unclaimed';

export interface DirectoryFilterState {
  query: string;
  state: string;
  country: string;
  category: string;
  proof: DirectoryProofFilter;
  claim: DirectoryClaimFilter;
  sort: DirectorySortMode;
}

const DEFAULT_FILTERS: DirectoryFilterState = {
  query: '',
  state: '',
  country: '',
  category: '',
  proof: 'all',
  claim: 'all',
  sort: 'score',
};

const DEFAULT_SEARCH_FIELDS = ['company', 'name', 'company_name', 'display_name', 'city', 'city_inferred', 'state_inferred', 'state_code', 'primary_service_area', 'services', 'specialties'];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'support', label: 'All Support' },
  { value: 'pilot-car', label: 'Pilot Cars' },
  { value: 'escort', label: 'Escorts' },
  { value: 'route-survey', label: 'Route Survey' },
  { value: 'permit', label: 'Permit Support' },
  { value: 'parking', label: 'Parking / Staging' },
  { value: 'repair', label: 'Repair' },
  { value: 'broker', label: 'Brokers' },
  { value: 'carrier', label: 'Carriers' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

function normalizeFilterValue(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function getRecordCountry(item: any): string {
  return normalizeCode(item.country_code || item.country_code_inferred || item.country || item.country_iso2);
}

function getRecordName(item: any): string {
  return String(item.company_name || item.company || item.display_name || item.name || item.full_name || '');
}

function getRecordScore(item: any): number {
  return Number(item.rank_score ?? item.trust_score ?? item.confidence_score ?? item.directory_quality_score ?? 0);
}

function getRecordTime(item: any): number {
  const value = item.updated_at || item.last_seen_at || item.last_verified_at || item.created_at || '';
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function recordHasClaimState(item: any, claim: DirectoryClaimFilter): boolean {
  if (claim === 'all') return true;
  const status = normalizeFilterValue(item.claim_status || item.owner_claim_status || item.profile_claim_status);
  const claimed = Boolean(item.claimed_at || item.owner_user_id || item.claim_owner_id) || ['claimed', 'approved', 'owner_verified'].includes(status);
  return claim === 'claimed' ? claimed : !claimed;
}

function recordHasProofState(item: any, proof: DirectoryProofFilter): boolean {
  if (proof === 'all') return true;
  const status = normalizeFilterValue(item.verification_status || item.proof_status || item.trust_status);
  const hasContact = Boolean(item.phone || item.phone_number || item.website || item.email);
  const verified = [
    'verified',
    'document_verified',
    'performance_verified',
    'admin_verified',
    'premium_verified',
    'owner_verified',
  ].includes(status) || Boolean(item.verified_at || item.last_verified_at || item.is_verified);

  if (proof === 'verified') return verified;
  return verified || status === 'contact_confirmed' || hasContact;
}

function recordMatchesCategory(item: any, category: string): boolean {
  const normalized = normalizeFilterValue(category);
  if (!normalized || normalized === 'support') return true;
  const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};

  const haystack = [
    item.entity_family,
    item.entity_subtype,
    metadata.entity_family,
    metadata.entity_subtype,
    metadata.primary_service,
    metadata.primary_category,
    item.category,
    item.category_slug,
    item.service_type,
    item.primary_service,
    item.primary_category,
    item.equipment_types,
    metadata.equipment_types,
    metadata.service_categories,
    metadata.services,
    metadata.specialties,
    metadata.tags,
    item.services,
    item.specialties,
    item.tags,
  ]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map(normalizeFilterValue)
    .filter(Boolean)
    .join(' ');

  const categoryTerms: Record<string, string[]> = {
    'pilot-car': ['pilot', 'pilot_car', 'pilot car', 'lead', 'chase'],
    escort: ['escort', 'escort_operator', 'escort vehicle', 'steer'],
    'route-survey': ['route survey', 'route_survey', 'survey', 'high pole', 'high-pole', 'height pole'],
    permit: ['permit', 'permitting', 'compliance'],
    parking: ['parking', 'staging', 'yard', 'truck_parking'],
    repair: ['repair', 'mechanic', 'mobile_truck_repair', 'service truck'],
    broker: ['broker', 'freight_broker'],
    carrier: ['carrier', 'hauler', 'operator_carrier'],
    infrastructure: ['infrastructure', 'port', 'yard', 'facility', 'truck stop', 'truck_stop'],
  };

  return (categoryTerms[normalized] || [normalized]).some((term) => haystack.includes(term));
}

function recordMatchesQuery(item: any, query: string, searchFields: string[]): boolean {
  const lower = normalizeFilterValue(query);
  if (!lower) return true;

  const fieldMatch = searchFields.some(field => {
    const val = item[field];
    if (Array.isArray(val)) return val.some((entry) => normalizeFilterValue(entry).includes(lower));
    return val && normalizeFilterValue(val).includes(lower);
  });
  if (fieldMatch) return true;

  const stCode = item.state_inferred || item.state_code || item.admin1_code || '';
  const fullName = stateFullName(stCode);
  return Boolean(fullName && fullName.toLowerCase().includes(lower));
}

export function applyDirectoryFilters(
  items: any[],
  filters: Partial<DirectoryFilterState>,
  searchFields: string[] = DEFAULT_SEARCH_FIELDS,
): any[] {
  const nextFilters = { ...DEFAULT_FILTERS, ...filters };

  return [...items]
    .filter((item) => recordMatchesQuery(item, nextFilters.query, searchFields))
    .filter((item) => !nextFilters.state || normalizeCode(item.state_inferred || item.state_code || item.admin1_code) === normalizeCode(nextFilters.state))
    .filter((item) => !nextFilters.country || getRecordCountry(item) === normalizeCode(nextFilters.country))
    .filter((item) => recordMatchesCategory(item, nextFilters.category))
    .filter((item) => recordHasProofState(item, nextFilters.proof))
    .filter((item) => recordHasClaimState(item, nextFilters.claim))
    .sort((a, b) => {
      if (nextFilters.sort === 'newest') return getRecordTime(b) - getRecordTime(a);
      if (nextFilters.sort === 'name') return getRecordName(a).localeCompare(getRecordName(b));
      return getRecordScore(b) - getRecordScore(a);
    });
}

export function DirectorySearchBar({
  items,
  onFilter,
  placeholder = 'Search operators by name, city, or state...',
  searchFields = DEFAULT_SEARCH_FIELDS,
  stateOptions,
  compact = false,
  surface = 'light',
  initialFilters,
}: DirectorySearchBarProps) {
  const [filters, setFilters] = useState<DirectoryFilterState>({ ...DEFAULT_FILTERS, ...initialFilters });
  const isCommand = surface === 'command';
  const fieldBorder = isCommand ? 'rgba(255,255,255,0.12)' : '#D1D5DB';
  const fieldBorderFocus = isCommand ? 'rgba(198,146,58,0.62)' : '#C6923A';
  const selectBackground = isCommand ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const selectText = isCommand ? '#fff7e8' : '#111827';

  const countryOptions = useMemo(() => {
    const codes = Array.from(new Set([...items.map(getRecordCountry), filters.country].filter(Boolean))).sort();
    return codes;
  }, [items, filters.country]);

  const filterItems = useCallback((nextFilters: DirectoryFilterState) => {
    const result = applyDirectoryFilters(items, nextFilters, searchFields);
    onFilter(result);
  }, [items, onFilter, searchFields]);

  useEffect(() => {
    filterItems(filters);
  }, [filterItems, filters]);

  const updateFilters = (patch: Partial<DirectoryFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateFilters({ query: val });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateFilters({ state: val });
  };

  const clearSearch = () => {
    setFilters(DEFAULT_FILTERS);
    onFilter(items);
  };

  const hasActiveFilters = Boolean(
    filters.query.trim() ||
    filters.state ||
    filters.country ||
    filters.category ||
    filters.proof !== 'all' ||
    filters.claim !== 'all' ||
    filters.sort !== 'score',
  );

  return (
    <div
      className={isCommand ? 'rounded-2xl border border-white/10 bg-black/35 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-[2px]' : undefined}
      style={{
        display: 'flex', gap: compact ? 8 : 10, flexWrap: 'wrap',
        marginBottom: compact ? 16 : 24,
        alignItems: 'center',
      }}
    >
      {/* Search input */}
      <div style={{
        flex: '1 1 280px', position: 'relative', minWidth: 200,
      }}>
        <Search style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none',
        }} />
          <input
            type="text"
            value={filters.query}
            onChange={handleSearch}
            placeholder={placeholder}
          style={{
            width: '100%', padding: compact ? '10px 40px 10px 40px' : '12px 44px 12px 44px',
            borderRadius: 8, border: `1px solid ${fieldBorder}`,
            background: isCommand ? 'rgba(255,255,255,0.06)' : '#ffffff',
            color: isCommand ? '#fff7e8' : '#111827',
            fontSize: compact ? 13 : 14, fontWeight: 500,
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = fieldBorderFocus}
          onBlur={e => e.target.style.borderColor = fieldBorder}
        />
        {filters.query && (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: isCommand ? 'rgba(255,255,255,0.10)' : '#F3F4F6',
              border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 4,
              color: isCommand ? '#F8DFB0' : '#4B5563', display: 'flex',
            }}
            aria-label="Clear search"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* State filter dropdown */}
      {stateOptions && stateOptions.length > 0 && (
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <MapPin style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none',
          }} />
          <select
            value={filters.state}
            onChange={handleStateChange}
            style={{
              padding: compact ? '10px 16px 10px 34px' : '12px 20px 12px 36px',
              borderRadius: 8, border: `1px solid ${fieldBorder}`,
              background: selectBackground,
              color: filters.state ? selectText : (isCommand ? '#d8c6a3' : '#6B7280'),
              fontSize: compact ? 13 : 14, fontWeight: 500,
              cursor: 'pointer', outline: 'none',
              appearance: 'none', WebkitAppearance: 'none',
              minWidth: compact ? 100 : 140,
            }}
          >
            <option value="">All States</option>
            {stateOptions.map(s => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <Globe2 style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none',
        }} />
        <select
          value={filters.country}
          onChange={(e) => updateFilters({ country: e.target.value })}
          style={{
            padding: compact ? '10px 16px 10px 34px' : '12px 20px 12px 36px',
            borderRadius: 8, border: `1px solid ${fieldBorder}`,
            background: selectBackground,
            color: filters.country ? selectText : (isCommand ? '#d8c6a3' : '#6B7280'),
            fontSize: compact ? 13 : 14, fontWeight: 500,
            cursor: 'pointer', outline: 'none',
            appearance: 'none', WebkitAppearance: 'none',
            minWidth: compact ? 100 : 126,
          }}
          aria-label="Filter by country"
        >
          <option value="">All Countries</option>
          {countryOptions.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>

      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <Filter style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none',
        }} />
        <select
          value={filters.category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          style={{
            padding: compact ? '10px 16px 10px 34px' : '12px 20px 12px 36px',
            borderRadius: 8, border: `1px solid ${fieldBorder}`,
            background: selectBackground,
            color: filters.category ? selectText : (isCommand ? '#d8c6a3' : '#6B7280'),
            fontSize: compact ? 13 : 14, fontWeight: 500,
            cursor: 'pointer', outline: 'none',
            appearance: 'none', WebkitAppearance: 'none',
            minWidth: compact ? 132 : 164,
          }}
          aria-label="Filter by category or service"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <BadgeCheck style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none',
        }} />
        <select
          value={filters.proof}
          onChange={(e) => updateFilters({ proof: e.target.value as DirectoryProofFilter })}
          style={{
            padding: compact ? '10px 16px 10px 34px' : '12px 20px 12px 36px',
            borderRadius: 8, border: `1px solid ${fieldBorder}`,
            background: selectBackground,
            color: filters.proof !== 'all' ? selectText : (isCommand ? '#d8c6a3' : '#6B7280'),
            fontSize: compact ? 13 : 14, fontWeight: 500,
            cursor: 'pointer', outline: 'none',
            appearance: 'none', WebkitAppearance: 'none',
            minWidth: compact ? 124 : 154,
          }}
          aria-label="Filter by verification"
        >
          <option value="all">All proof states</option>
          <option value="verified">Document/performance proof</option>
          <option value="contact_confirmed">Contact Confirmed</option>
        </select>
      </div>

      <select
        value={filters.claim}
        onChange={(e) => updateFilters({ claim: e.target.value as DirectoryClaimFilter })}
        style={{
          padding: compact ? '10px 16px' : '12px 20px',
          borderRadius: 8, border: `1px solid ${fieldBorder}`,
          background: selectBackground,
          color: filters.claim !== 'all' ? selectText : (isCommand ? '#d8c6a3' : '#6B7280'),
          fontSize: compact ? 13 : 14, fontWeight: 500,
          cursor: 'pointer', outline: 'none',
          appearance: 'none', WebkitAppearance: 'none',
          minWidth: compact ? 116 : 146,
        }}
        aria-label="Filter by claim status"
      >
        <option value="all">All Claims</option>
        <option value="claimed">Claimed</option>
        <option value="unclaimed">Unclaimed</option>
      </select>

      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <SlidersHorizontal style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none',
        }} />
        <select
          value={filters.sort}
          onChange={(e) => updateFilters({ sort: e.target.value as DirectorySortMode })}
          style={{
            padding: compact ? '10px 16px 10px 34px' : '12px 20px 12px 36px',
            borderRadius: 8, border: `1px solid ${fieldBorder}`,
            background: selectBackground,
            color: selectText,
            fontSize: compact ? 13 : 14, fontWeight: 500,
            cursor: 'pointer', outline: 'none',
            appearance: 'none', WebkitAppearance: 'none',
            minWidth: compact ? 116 : 140,
          }}
          aria-label="Sort directory records"
        >
          <option value="score">Best Signal</option>
          <option value="newest">Newest</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Filter count badge */}
      {hasActiveFilters && (
        <button
          onClick={clearSearch}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: isCommand ? 'rgba(198,146,58,0.12)' : '#FEF9C3',
            border: isCommand ? '1px solid rgba(198,146,58,0.32)' : '1px solid #FDE047',
            color: isCommand ? '#F8DFB0' : '#854D0E', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.02em',
          }}
        >
          <X style={{ width: 14, height: 14 }} /> Clear Filters
        </button>
      )}
    </div>
  );
}
