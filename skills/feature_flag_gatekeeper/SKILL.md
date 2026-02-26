---
name: feature_flag_gatekeeper
description: Enforces the "Day 1 Guardrails" by keeping all new integrations behind feature flags.
---

# Feature Flag Gatekeeper Skill

**Purpose**: To ensure no expensive, risky, or unfinished feature goes live without a remote switch to kill it.

**Trigger**: When adding any external API (Maps, Weather, Payments) or major UI block.

## 1. Flag Definition
- Check `supabase/migrations/*_feature_flags.sql` for existing keys.
- If new, add an `INSERT` statement to the seed file.
- Default `enabled` to `FALSE`.

## 2. Implementation Pattern (Code)
- **Do NOT** hardcode API calls.
- Wrap usage in:
```typescript
import { checkFlag } from '@packages/config/flags';

if (await checkFlag('my_feature')) {
  // Execute expensive logic
} else {
  // Fallback (Free/Mock)
}
```

## 3. The "Billing Lock"
- If a feature costs money (e.g. Mapbox Geocoding), the Flag Config MUST support a "Provider" switch.
- Example: `config: { provider: 'maplibre' }` vs `config: { provider: 'mapbox' }`.

## 4. Verification
- Verify the fallback path works (e.g., App runs without an API Key).
