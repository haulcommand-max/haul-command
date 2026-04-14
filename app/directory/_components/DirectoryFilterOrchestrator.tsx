'use client';

import React, { useState, useCallback } from 'react';
import { DirectoryHardFilter } from '@/components/directory/DirectoryHardFilter';
import { DirectorySearchList, HardFilterState } from '../_components/DirectorySearchList';

/**
 * DirectoryFilterOrchestrator
 * 
 * Client-side wrapper that manages filter state between the
 * DirectoryHardFilter sidebar and the DirectorySearchList.
 * This component bridges the gap between the server-rendered
 * directory page and the interactive client-side filter UX.
 */
export function DirectoryFilterOrchestrator() {
  const [filters, setFilters] = useState<HardFilterState>({
    highPole: false,
    twic: false,
    hazmat: false,
    superload: false,
    avCertified: false,
    gpsTracked: false,
    availableNow: false,
    verified: false,
    equipmentType: [],
  });

  const handleFilterChange = useCallback((newFilters: HardFilterState) => {
    setFilters(newFilters);
  }, []);

  return (
    <>
      {/* Hard Filters — Certification / Equipment / Availability */}
      <div className="max-w-4xl mx-auto mb-6">
        <DirectoryHardFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Search — receives live filter state */}
      <div className="max-w-4xl mx-auto mb-16 text-left">
        <DirectorySearchList filters={filters} />
      </div>
    </>
  );
}