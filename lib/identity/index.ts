/**
 * HAUL COMMAND — Identity System
 * 
 * Two types of IDs:
 *   1. safeUUID()      — Random, for UI keys / ephemeral IDs (works everywhere)
 *   2. makeEntityId()  — Deterministic, for real-world entities (dedup-safe)
 */

export { safeUUID } from './uid';
export {
    canonPhone,
    canonCompany,
    canonCorridor,
    canonOperator,
    sha256Hex,
    makeEntityId,
    phoneEntityId,
    companyEntityId,
    corridorEntityId,
} from './entity-graph';
export type { EntityType } from './entity-graph';
