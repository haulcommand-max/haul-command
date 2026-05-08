export type HCAssetStatus = 'planned' | 'active' | 'partial' | 'deprecated' | 'paused';

export type HCAssetCountryReadiness =
  | 'global_ready'
  | 'tier_ready'
  | 'country_specific'
  | 'needs_local_review'
  | 'unknown';

export type HCAssetPurposes = {
  seo: string;
  aeo: string;
  adgrid: string;
  matching: string;
  trust: string;
  monetization: string;
};

export type HCAssetRegistryEntry = {
  id: string;
  featureName: string;
  ownerSurface: string;
  status: HCAssetStatus;
  relatedSupabaseTables: string[];
  relatedGithubFiles: string[];
  relatedRoutes: string[];
  relatedVercelEnvs: string[];
  purposes: HCAssetPurposes;
  countryReadiness: HCAssetCountryReadiness;
  lastAuditedAt: string;
  safeToEditNotes: string;
  doNotBreakDependencies: string[];
};

export type HCAssetRegistryValidation = {
  valid: boolean;
  errors: string[];
};

export type HCAssetRegistryReadiness = 'complete' | 'needs_attention' | 'blocked';

export function createAssetRegistryEntry(entry: HCAssetRegistryEntry): HCAssetRegistryEntry {
  return {
    ...entry,
    id: entry.id.trim(),
    featureName: entry.featureName.trim(),
    ownerSurface: entry.ownerSurface.trim(),
    relatedSupabaseTables: dedupeClean(entry.relatedSupabaseTables),
    relatedGithubFiles: dedupeClean(entry.relatedGithubFiles),
    relatedRoutes: dedupeClean(entry.relatedRoutes),
    relatedVercelEnvs: dedupeClean(entry.relatedVercelEnvs),
    safeToEditNotes: entry.safeToEditNotes.trim(),
    doNotBreakDependencies: dedupeClean(entry.doNotBreakDependencies),
    purposes: {
      seo: entry.purposes.seo.trim(),
      aeo: entry.purposes.aeo.trim(),
      adgrid: entry.purposes.adgrid.trim(),
      matching: entry.purposes.matching.trim(),
      trust: entry.purposes.trust.trim(),
      monetization: entry.purposes.monetization.trim(),
    },
  };
}

export function validateAssetRegistryEntry(entry: HCAssetRegistryEntry): HCAssetRegistryValidation {
  const asset = createAssetRegistryEntry(entry);
  const errors: string[] = [];

  if (!asset.id) errors.push('id is required for registry lookup.');
  if (!asset.featureName) errors.push('featureName is required for human review.');
  if (!asset.ownerSurface) errors.push('ownerSurface is required so the asset is not orphaned.');

  if (asset.relatedSupabaseTables.length === 0 && asset.relatedGithubFiles.length === 0) {
    errors.push('At least one Supabase table/view or GitHub file must be mapped.');
  }

  if (!asset.purposes.seo) errors.push('seo purpose is required for authority tracking.');
  if (!asset.purposes.aeo) errors.push('aeo purpose is required for answer-engine tracking.');
  if (!asset.purposes.adgrid) errors.push('adgrid purpose is required for monetization routing.');
  if (!asset.purposes.matching) errors.push('matching purpose is required for marketplace routing.');
  if (!asset.purposes.trust) errors.push('trust purpose is required for ecosystem confidence.');
  if (!asset.purposes.monetization) {
    errors.push('monetization purpose is required so the asset has a money path.');
  }

  if (asset.countryReadiness === 'unknown') {
    errors.push('countryReadiness must be more specific than unknown.');
  }

  if (!asset.safeToEditNotes) {
    errors.push('safeToEditNotes is required to prevent downgrade drift.');
  }

  if (!isIsoDate(asset.lastAuditedAt)) {
    errors.push('lastAuditedAt must be an ISO timestamp.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getAssetRegistryReadiness(entry: HCAssetRegistryEntry): HCAssetRegistryReadiness {
  const validation = validateAssetRegistryEntry(entry);
  if (!validation.valid) return 'blocked';

  const asset = createAssetRegistryEntry(entry);
  const hasCodeOrData = asset.relatedGithubFiles.length > 0 || asset.relatedSupabaseTables.length > 0;
  const hasRoute = asset.relatedRoutes.length > 0;
  const hasDependencyNotes = asset.doNotBreakDependencies.length > 0;

  if (hasCodeOrData && hasRoute && hasDependencyNotes) return 'complete';
  return 'needs_attention';
}

function dedupeClean(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isIsoDate(value: string): boolean {
  if (!value.trim()) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && value.includes('T');
}
