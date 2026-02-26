
import { upgradeOnlyGate, Component, GateResult } from './upgradeOnlyGate';

/**
 * Component Registry
 * Acts as the centralized store for SEO components (patterns, rulesets, templates).
 * Enforces the "Upgrade-Only" policy via the Gate.
 */

// Simulated database/store
const REGISTRY = new Map<string, Component>();

export function registerComponent(newComp: Component): GateResult {
    const existing = REGISTRY.get(newComp.id);

    if (!existing) {
        // First install
        REGISTRY.set(newComp.id, newComp);
        return {
            componentId: newComp.id,
            decision: 'APPLY',
            qsOld: 0,
            qsNew: 1, // Placeholder
            minMargin: 0,
            reason: 'Initial installation',
            canary: { enabled: true, percentage: 5 }
        };
    }

    // Run the Guardrail
    const result = upgradeOnlyGate(existing, newComp);

    if (result.decision === 'APPLY') {
        const toSave = { ...newComp, rollbackTo: { version: existing.version } };
        REGISTRY.set(newComp.id, toSave);
    } else if (result.decision === 'MERGE' && result.mergedPayload) {
        // Create merged component
        const mergedComp: Component = {
            ...existing,
            version: incrementVersion(existing.version),
            payload: result.mergedPayload,
            createdAtISO: new Date().toISOString()
        };
        REGISTRY.set(mergedComp.id, mergedComp);
    }
    // If HOLD, do nothing (or store in separate candidates table)

    return result;
}

export function getComponent(id: string): Component | undefined {
    return REGISTRY.get(id);
}

function incrementVersion(v: string): string {
    // Simple semver bump
    const parts = v.split('.').map(Number);
    parts[2]++;
    return parts.join('.');
}
