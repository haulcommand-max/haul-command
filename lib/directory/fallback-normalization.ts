type DirectoryFallbackCategory = {
    entitySubtypes: string[];
};

export function asDirectoryRecord(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function normalizeDirectorySignal(value: unknown): string {
    return String(value ?? '').trim().toLowerCase().replace(/[-\s]+/g, '_');
}

function collectSignals(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.flatMap((item) => collectSignals(item));
    }

    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).flatMap((item) => collectSignals(item));
    }

    const normalized = normalizeDirectorySignal(value);
    return normalized ? [normalized] : [];
}

export function fallbackRowMatchesCategory(row: any, category: DirectoryFallbackCategory | null | undefined): boolean {
    if (!category) return true;

    const metadata = asDirectoryRecord(row.metadata);
    const subtypeSignals = new Set(category.entitySubtypes.map(normalizeDirectorySignal));
    const rowSignals = new Set([
        ...collectSignals(row.entity_subtype),
        ...collectSignals(row.entity_type),
        ...collectSignals(row.entity_family),
        ...collectSignals(row.primary_service),
        ...collectSignals(row.primary_category),
        ...collectSignals(row.services),
        ...collectSignals(row.specialties),
        ...collectSignals(row.equipment_types),
        ...collectSignals(row.tags),
        ...collectSignals(metadata.entity_subtype),
        ...collectSignals(metadata.entity_type),
        ...collectSignals(metadata.entity_family),
        ...collectSignals(metadata.primary_service),
        ...collectSignals(metadata.primary_category),
        ...collectSignals(metadata.service_categories),
        ...collectSignals(metadata.services),
        ...collectSignals(metadata.specialties),
        ...collectSignals(metadata.equipment_types),
        ...collectSignals(metadata.tags),
    ]);

    for (const subtype of subtypeSignals) {
        if (rowSignals.has(subtype)) return true;
        for (const signal of rowSignals) {
            if (signal.includes(subtype) || subtype.includes(signal)) return true;
        }
    }

    return false;
}

export function normalizeDirectoryFallbackRow(row: any, sourceView: string) {
    const metadata = asDirectoryRecord(row.metadata);
    return {
        ...row,
        id: row.contact_id ?? row.id ?? row.entity_id,
        contact_id: row.contact_id ?? row.id ?? row.entity_id,
        entity_id: row.entity_id ?? row.id,
        company: row.company ?? row.name ?? row.display_name,
        name: row.name ?? row.company ?? row.display_name,
        country_code: row.country_code ?? row.country_code_inferred,
        country_code_inferred: row.country_code_inferred ?? row.country_code,
        state: row.state_inferred ?? row.state_code ?? row.admin1_code,
        state_inferred: row.state_inferred ?? row.state_code ?? row.admin1_code,
        admin1_code: row.admin1_code ?? row.state_code ?? row.state_inferred,
        entity_family: row.entity_family ?? metadata.entity_family,
        entity_subtype: row.entity_subtype ?? metadata.entity_subtype,
        services: row.services ?? metadata.services ?? metadata.service_categories,
        specialties: row.specialties ?? metadata.specialties,
        equipment_types: row.equipment_types ?? metadata.equipment_types,
        primary_service_area: row.primary_service_area ?? metadata.primary_service_area,
        claim_status: row.claim_status ?? 'claimable',
        source_view: sourceView,
    };
}
