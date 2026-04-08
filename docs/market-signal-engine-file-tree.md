# Haul Command Market Signal Engine File Tree

```text
supabase/
  migrations/
    20260407_001_hc_market_signal_enums.sql
    20260407_002_hc_market_signal_tables.sql
    20260407_003_hc_market_signal_indexes.sql
    20260407_004_hc_market_signal_functions.sql
    20260407_005_hc_market_signal_triggers_and_rls.sql
    20260407_006_hc_market_signal_seed.sql

app/
  api/
    events/
      ingest/
        route.ts
    signals/
      process/
        route.ts
    content/
      preview/
        route.ts
      approve/
        route.ts
    distribution/
      schedule/
        route.ts
    claims/
      pressure/
        route.ts
    seo/
      refresh-surface/
        route.ts

lib/
  env.ts
  supabase/
    admin.ts
  contracts/
    market-signal.ts
  events/
    emit.ts
  signals/
    materialize.ts
  scoring/
    claim-pressure.ts
  content/
    build-packet.ts
  distribution/
    router.ts
  seo/
    refresh-surface.ts

types/
  market-signal.ts

workers/
  _shared/
    auth.ts
    logger.ts
  corridor-heat.worker.ts
  claim-pressure.worker.ts
  distribution-router.worker.ts
  page-refresh.worker.ts
  index.ts
```
