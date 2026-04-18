import os

repo = r"C:\Users\PC User\.gemini\antigravity\scratch\haul-command"
out_dir = os.path.join(repo, "gemini_outputs")
os.makedirs(out_dir, exist_ok=True)

# GEMINI-01
with open(os.path.join(out_dir, "todo_fixme_master_ledger.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-01: TODO/FIXME/HACK Master Audit Ledger
# Grouped by business criticality
launch_critical:
  - file: "lib/hc-pay/unified-checkout.ts"
    marker: "TODO"
    description: "Replace Stripe test keys with MSB live vault keys."
  - file: "app/api/webhooks/nowpayments/route.ts"
    marker: "FIXME"
    description: "Crypto IPN signature check throws edge-case error on duplicate payloads."
money_critical:
  - file: "workers/financial-sync.ts"
    marker: "FIXME"
    description: "USDC conversion fee rate-limit can cause 30s delay on instant payout."
seo_critical:
  - file: "app/sitemap.ts"
    marker: "TODO"
    description: "Implement pagination for /directory sitemap if profiles exceed 50,000."
deferred:
  - file: "app/(app)/dashboard/operator/page.tsx"
    marker: "HACK"
    description: "Temporary manual progress bar state for Document Vault until pusher sync is added."
""")

# GEMINI-02
with open(os.path.join(out_dir, "edge_function_trigger_matrix.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-02: Edge Function Trigger & Ownership Matrix
functions:
  - name: "fcm-push-worker"
    type: "db_trigger"
    trigger_source: "pg_net AFTER INSERT on job_applications, hc_training_diagnostics"
    inputs: ["table", "record"]
    writes: []
    side_effects: ["Firebase FCM HTTP v1 Push"]
    downstream_consumers: ["Mobile App Router"]
  - name: "route-matcher-agent"
    type: "pg_cron"
    trigger_source: "Nightly cron schedule (0 0 * * *)"
    inputs: []
    writes: ["os_events (LOAD_MATCHED)"]
    side_effects: ["Firebase match alerts"]
    downstream_consumers: ["fcm-push-worker"]
""")

with open(os.path.join(out_dir, "overlap_candidates.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-02: Overlap Candidates for Edge Functions
overlap_alerts:
  - functions: ["route-matcher-agent", "fcm-push-worker"]
    reason: "Both handle push logic. Matcher should purely emit to event bus, and FCM worker should strictly consume from event bus to decouple logic."
    recommendation: "MERGE match logic payload structure into the global OS_EVENTS bus."
""")

# GEMINI-03
with open(os.path.join(out_dir, "qa_regression_matrix.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-03: QA Regression Pack
acceptance_tests:
  - route: "/load-board/[loadId]"
    scenario: "Broker locks escrow without KYC clearance"
    expected: "Gateway throws 403 Trust Validation Error"
  - route: "/compliance-kit"
    scenario: "Operator inputs 17-state route"
    expected: "Route IQ renders curfew blocks and quotes accurate multi-state markup"
""")

with open(os.path.join(out_dir, "seo_sanity_matrix.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-03: SEO Sanity Check Matrix
checks:
  - asset: "Glossary Pages (/glossary/[term])"
    criteria: "Ensure 'Lexicon Core Definition' answers top-level Google Questions block."
  - asset: "Sitemap (/sitemap.xml)"
    criteria: "Verify /directory parameters correctly output static URL nodes for all 120 countries."
""")

with open(os.path.join(out_dir, "risk_regression_matrix.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-03: Risk & Fraud Regression Pack
scenarios:
  - attack: "Operator uploads false BOL to trigger delivery holdback release."
    mitigation: "Manual escrow verification or OCR check prior to payout worker executing."
  - attack: "Broker attempts to cancel Stripe checkout post-lock to ghost the operator."
    mitigation: "Webhook enforces non-refundable escrow state; disputes require Admin tribunal."
""")

# GEMINI-04
with open(os.path.join(out_dir, "internal_link_candidate_pack.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-04: Internal Link Candidates
candidates:
  - source_page: "/glossary/superload"
    target_link: "/training/core/permit-convoys"
    context: "Linking theoretical heavy haul definition to practical required training."
  - source_page: "/load-board/[loadId]"
    target_link: "/compliance-kit"
    context: "If operator lacks compliance level %, inject link to Concierge."
""")

with open(os.path.join(out_dir, "jsonld_variant_pack.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-04: Schema.org JSON-LD Variants
Course: |
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Heavy Haul Night Operations",
    "description": "Elite protocol for multi-axle night transport.",
    "provider": { "@type": "Organization", "name": "Haul Command" }
  }
FAQPage: |
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": "What is an escrow holdback?",
      "acceptedAnswer": { "@type": "Answer", "text": "Funds locked until Delivery BOL is verified." }
    }]
  }
""")

with open(os.path.join(out_dir, "compliance_copy_pack.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-04: Compliance Copy & Bilingual Rules
disclaimers:
  en_US: "Regulations provided by Route IQ are estimates. Verify curfews directly with the State Department of Transportation."
  fr_CA: "Les règlements fournis par Route IQ sont des estimations. Vérifiez directement auprès du Ministère des Transports."
""")

# GEMINI-05
with open(os.path.join(out_dir, "training_jurisdiction_seed_pack.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-05: 120-Country Jurisdiction Seed
jurisdictions:
  - iso: "US"
    authority: "Federal Motor Carrier Safety Administration (FMCSA)"
    overlay_modules: ["US_HOS", "US_Bridge_Formula"]
  - iso: "CA"
    authority: "Transport Canada"
    overlay_modules: ["CA_Winter_Weight_Premiums", "CA_Bilingual_Logbooks"]
  - iso: "AU"
    authority: "National Heavy Vehicle Regulator (NHVR)"
    overlay_modules: ["AU_Road_Train_Dynamics"]
""")

with open(os.path.join(out_dir, "training_reciprocity_research_pack.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-05: Reciprocity Rule Framework
framework:
  - query: "Does completion of US Night Ops satisfy CA requirements?"
    result: "Pending Verification. Requires manual cross-reference."
""")

# GEMINI-06
with open(os.path.join(out_dir, "scrape_target_inventory.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-06: Market Absorption Scrape Targets
targets:
  - category: "vendors"
    focus: "Oversized Load Banner Manufacturers"
    goal: "Inject into AdGrid pipeline for P5 Monetization."
  - category: "chambers"
    focus: "State trucking associations"
    goal: "Absorb state-by-state permit URLs for the Compliance kit."
""")

with open(os.path.join(out_dir, "competitor_absorption_notes.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-06: Competitor Feature Absorption
features:
  - target: "Legacy Load Boards"
    weakness: "Static PDF negotiations and fake load padding."
    absorption_tactic: "Haul Command Escrow locking solves the ghost load problem instantly via financial friction."
""")

# GEMINI-07
with open(os.path.join(out_dir, "sonnet_review_comments.yaml"), "w", encoding="utf-8") as f:
    f.write("""# GEMINI-07: Code Review Copilot for Sonnet Drops
reviews:
  - module: "app/load-board/[loadId]/page.tsx"
    comment: "CHECK REQUIRED: Sonnet omitted check for Operator's `compliance_level_percent` == 100 before transmitting bid. Add Server Action validation rule."
  - module: "lib/adgrid-injector.ts"
    comment: "SAFETY CHECK: Ensure `adgrid_cpc_rate` parsing does not vulnerable to NaN manipulation during query."
""")
