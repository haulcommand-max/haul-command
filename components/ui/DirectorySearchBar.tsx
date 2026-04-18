'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, MapPin, Filter } from 'lucide-react';

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
}

export function DirectorySearchBar({
  items,
  onFilter,
  placeholder = 'Search operators by name, city, or state...',
  searchFields = ['company', 'name', 'company_name', 'city', 'state_inferred', 'state_code', 'primary_service_area'],
  stateOptions,
  compact = false,
}: DirectorySearchBarProps) {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const filterItems = useCallback((q: string, state: string) => {
    let result = items;
    
    if (q.trim()) {
      const lower = q.toLowerCase().trim();
      result = result.filter(item => 
        searchFields.some(field => {
          const val = item[field];
          return val && String(val).toLowerCase().includes(lower);
        })
      );
    }

    if (state) {
      result = result.filter(item => 
        (item.state_inferred || item.state_code || '').toUpperCase() === state.toUpperCase()
      );
    }

    onFilter(result);
  }, [items, onFilter, searchFields]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    filterItems(val, stateFilter);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStateFilter(val);
    filterItems(query, val);
  };

  const clearSearch = () => {
    setQuery('');
    setStateFilter('');
    onFilter(items);
  };

  const hasActiveFilters = query.trim() || stateFilter;

  return (
    <div style={{
      display: 'flex', gap: compact ? 8 : 10, flexWrap: 'wrap',
      marginBottom: compact ? 16 : 24,
      alignItems: 'center',
    }}>
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
          value={query}
          onChange={handleSearch}
          placeholder={placeholder}
          style={{
            width: '100%', padding: compact ? '10px 40px 10px 40px' : '12px 44px 12px 44px',
            borderRadius: 8, border: '1px solid #D1D5DB',
            background: '#ffffff', color: '#111827',
            fontSize: compact ? 13 : 14, fontWeight: 500,
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#C6923A'}
          onBlur={e => e.target.style.borderColor = '#D1D5DB'}
        />
        {query && (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: '#F3F4F6', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 4,
              color: '#4B5563', display: 'flex',
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
            value={stateFilter}
            onChange={handleStateChange}
            style={{
              padding: compact ? '10px 16px 10px 34px' : '12px 20px 12px 36px',
              borderRadius: 8, border: '1px solid #D1D5DB',
              background: '#ffffff', color: stateFilter ? '#111827' : '#6B7280',
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

      {/* Filter count badge */}
      {hasActiveFilters && (
        <button
          onClick={clearSearch}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: '#FEF9C3', border: '1px solid #FDE047',
            color: '#854D0E', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.02em',
          }}
        >
          <X style={{ width: 14, height: 14 }} /> Clear Filters
        </button>
      )}
    </div>
  );
}
