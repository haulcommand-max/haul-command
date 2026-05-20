# Haul Command Three Audience Contract

Haul Command public surfaces must serve three audiences at the same time:

1. Demand side: brokers, carriers, dispatchers, shippers, and project-cargo teams that need heavy-haul support.
2. Supply side: pilot car operators and every heavy-haul support role that needs visibility, proof, claims, and leads.
3. Discovery and authority systems: Google, Bing, map packs, voice search, snippets, and AI answer systems that need crawlable, useful, local, trustworthy pages.

Sponsors, partners, training, data products, and AdGrid are money layers. They should not overpower the primary user job.

## Code Rule

The canonical registry lives in `lib/audience/audience-contracts.ts`.

Every major route family should have an audience contract with:

- primary and secondary audiences
- user intents
- required CTAs
- trust/proof modules
- discovery/AEO modules
- internal-link families
- schema requirements
- no-dead-end actions
- monetization placement rule

Run:

```bash
npm run audit:audience-contracts
```

The audit fails when a baseline contract loses buyer/provider/search coverage, required trust modules, required schema, enough internal-link families, or no-dead-end actions.

## Design Law

Every important page should answer:

- Who is this helping right now?
- What do they need to do next?
- Why should they trust this?
- How do search and AI systems understand it?
- How does Haul Command capture the signal or money path without making the page worse?

If a page cannot answer those questions, it should stay noindex, draft, or data-pending.

