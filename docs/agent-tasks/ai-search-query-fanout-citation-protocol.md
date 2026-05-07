# AI Search Query Fanout & Citation Protocol

## Source context

This note is based on an Ahrefs AI-search training transcript explaining how AI search engines retrieve, evaluate, and cite content.

Use this as operating guidance for Haul Command SEO/AEO work. Do not treat it as a legal or technical standard. It is a strategy layer for how Haul Command content should be structured so ChatGPT, Perplexity, Gemini, Google AI Overviews, AI Mode, and future answer engines are more likely to retrieve and cite Haul Command.

## What the repo already has

Haul Command already has AI/SEO scaffolding in `GEMINI_25_SEO_AI_EXPANSION_TASKS.md`, including `llms.txt`, AI answer snippets, semantic HTML, JSON-LD, DefinedTerm schema, FAQ schema, internal linking, hreflang, breadcrumbs, and crawl controls.

This protocol does not replace that work. It adds the missing operating model for query fanout, probabilistic citation visibility, consensus, freshness, and authority.

## Core mechanics to design for

AI search generally pulls from two information sources:

1. Training data
   - Slow-moving model memory from broad web/text data.
   - Haul Command influences this by becoming widely mentioned across the web with consistent entity language.

2. Real-time retrieval
   - AI systems search/fetch current pages, read them, and synthesize answers.
   - Haul Command influences this through classic SEO, crawlable pages, authoritative source trails, freshness, structured pages, internal links, and topic completeness.

## Query fanout rule

Do not build pages as if one page equals one keyword.

AI systems often expand a single prompt into many subqueries. A broad prompt like “How do I move an oversize load in Florida?” can fan out into questions about:

- Florida escort requirements
- Pilot car certification
- Height pole requirements
- Route surveys
- Permits
- Travel restrictions
- Warning signs and lights
- Insurance
- Work-zone risks
- Bridge clearances
- Police escorts
- Public safety
- Training requirements
- Operator availability
- Rates
- Corridor conditions

Haul Command pages should therefore cover a topic cluster deeply enough that AI retrieval can find us across many fanout subqueries.

## AI visibility is probabilistic

Do not optimize for a fixed rank only. AI citations behave more like probability than a stable leaderboard.

Haul Command should track:

- citation appearances
- brand mentions
- source consistency
- topic coverage
- freshness
- authority links
- Google rank where available
- answer-block extractability
- whether the same prompt cites us across repeated runs

## What increases citation probability

### 1. Consensus

If many reputable sources describe Haul Command and heavy-haul topics consistently, AI systems are more likely to repeat that framing.

Implementation requirements:

- Keep brand/entity language consistent.
- Use the same plain-English definitions across glossary, training, regulations, tools, and role pages.
- Earn/seed mentions through public safety, training, regulatory, association, and directory assets.
- Avoid contradictory definitions across pages.

### 2. Freshness

AI systems often favor newer content for topics that change.

Implementation requirements:

- Add `last_reviewed_at` or visible “Last reviewed” date to regulation, training, glossary, safety, and data-product pages.
- Update pages when new state workbooks, DOT rules, FHWA/FMCSA sources, or industry documents are added.
- Create changelog sections for regulatory pages.

### 3. Authority

Traditional SEO still matters. Pages ranking well in Google are more likely to be cited by AI systems, but AI can also cite pages outside top traditional rankings.

Implementation requirements:

- Preserve classic SEO: titles, H1s, internal links, schema, page speed, backlinks, useful content, crawlability.
- Add source trails to authority pages.
- Link to official sources like FHWA, FMCSA, state DOTs, LTAP/T2 centers, MUTCD, and state work-zone policies.
- Do not publish unsourced compliance claims as final authority.

### 4. Topic coverage

Because query fanout creates many subqueries, thin pages lose to full clusters.

Implementation requirements:

Every major Haul Command topic should connect:

- short answer block
- detailed explanation
- glossary terms
- training modules
- official source references
- role pages
- tools/calculators
- directory/marketplace CTA
- corridor pages when relevant
- FAQ schema
- Article/DefinedTerm/HowTo/Breadcrumb schema where relevant

## Haul Command page requirements for AI retrieval

Every strategic page should include:

1. AI-citable short answer near the top
2. Source trail with official sources where applicable
3. Last reviewed date
4. Related glossary terms
5. Related training modules
6. Related tools or checklists
7. Role-specific implications
8. Country/state scope warning
9. Internal links into the Haul Command topic cluster
10. Commercial CTA that matches user intent

## Query fanout cluster examples for Haul Command

### What is a pilot car?

Fanout coverage should include:

- pilot car definition
- PEVO definition
- lead car
- chase car
- high pole car
- steerman
- permitted route
- route clearance
- warning signs and lights
- public safety around oversize loads
- how to become a pilot car operator
- pilot car equipment checklist
- training and certification
- find operators near me

### Florida pilot car requirements

Fanout coverage should include:

- Florida PEVO flagging
- Florida Administrative Code Chapter 14-26
- FDOT / UF T2 workbook source trail
- escort vehicle checklist
- height-pole six-inch clearance rule
- permit review
- overdimensional load stipulations
- accepted-state qualification references
- pre-trip meeting
- after-action report
- training CTA
- directory CTA

### Work-zone oversize load safety

Fanout coverage should include:

- MUTCD
- temporary traffic control
- work-zone safety
- transportation management plans
- state DOT standard drawings
- flagger rules
- route survey work-zone risk
- public driver safety
- pilot car positioning
- corridor risk overlays

### Autonomous truck warning-device exemption

Fanout coverage should include:

- FMCSA docket
- 49 CFR 392.22
- 49 CFR 393.95
- warning triangles
- cab-mounted warning beacons
- Level 4 ADS
- autonomous truck recovery support
- ADS corridor safety observer
- equipment marketplace categories
- regulatory radar CTA

## Evaluation rules

Add or extend tests/evals so Haul Command can score pages by AI-search readiness.

Suggested fields:

- `has_short_answer_block`
- `has_source_trail`
- `has_last_reviewed_date`
- `has_related_terms`
- `has_related_training`
- `has_schema_json_ld`
- `has_scope_warning`
- `has_commercial_cta`
- `fanout_coverage_score`
- `freshness_score`
- `consensus_score`
- `authority_source_score`

Pages below the threshold should be considered incomplete even if they technically render.

## Agent instructions

When building new Haul Command content, do not ask “what keyword is this page for?” first.

Ask:

1. What broad AI prompt could trigger this page?
2. What fanout subqueries would the AI likely run?
3. Which of those subqueries can Haul Command answer better than competitors?
4. What official sources support the answer?
5. Which existing glossary/training/tool/directory pages should this page link to?
6. What commercial action should the user take next?

Do not create isolated pages. Every page must become part of a cluster.

## Important guardrail

Do not spam keywords or synthetic fanout queries into page copy. Use fanout as a coverage planning tool, not as a stuffing list.
