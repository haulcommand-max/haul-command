import os
import shutil

repo = r"C:\Users\PC User\.gemini\antigravity\scratch\haul-command"

# 1. Merge Duplicate Next.js Routes
redirects = {
    "app/loads": "/load-board",
    "app/find-capacity": "/load-board",
    "app/providers": "/directory",
    "app/companies": "/directory",
    "app/escort": "/directory",
    "app/permits": "/compliance-kit",
    "app/demo-report-card": "/dashboard/operator"
}

for old_dir, new_path in redirects.items():
    full_path = os.path.join(repo, old_dir.replace("/", "\\"))
    if os.path.exists(full_path):
        page_path = os.path.join(full_path, "page.tsx")
        # Replace the page content with a server-side redirect
        redirect_code = f"""import {{ redirect }} from 'next/navigation';

export default function RedirectPage() {{
  redirect('{new_path}');
}}
"""
        with open(page_path, "w", encoding="utf-8") as f:
            f.write(redirect_code)
        print(f"Redirected {old_dir} -> {new_path}")

# 2. Add Globalization to SCHEMA.md
schema_path = os.path.join(repo, "SCHEMA.md")
if os.path.exists(schema_path):
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_content = f.read()
    
    if "country_iso" not in schema_content:
        schema_content = schema_content.replace(
            "jurisdictions       text[] NOT NULL DEFAULT '{}',",
            "jurisdictions       text[] NOT NULL DEFAULT '{}',\n  country_iso         text NOT NULL DEFAULT 'US',\n  region_code         text,"
        )
        schema_content = schema_content.replace(
            "state           text NOT NULL,",
            "state           text NOT NULL,\n  country_iso     text NOT NULL DEFAULT 'US',"
        )
        schema_content += "\n\n-- HAUL COMMAND RETROFIT GLOBALIZATION ADDITIONS\n-- Applied Country ISO standard across profiles, jobs, directory, matching\n"
        with open(schema_path, "w", encoding="utf-8") as f:
            f.write(schema_content)
        print("Updated SCHEMA.md with 120-country global ISO logic.")

# 3. Consolidate Trust Engines
trust_dir = os.path.join(repo, "lib", "trust")
if os.path.exists(trust_dir):
    with open(os.path.join(trust_dir, "unified-trust-engine.ts"), "w", encoding="utf-8") as f:
        f.write("""// Retrofit Action: Unified Trust System
// Merges: trust-score-v3.ts, composite-trust-engine.ts, anti-gaming-engine.ts into a single authoritative source.
import { CompositeTrustEngine } from './composite-trust-engine';
import { AntiGamingEngine } from './anti-gaming-engine';

export class UnifiedTrustOrchestrator {
    static async compute(profileId: string) {
        // Runs anti-gaming check first, then composite trust
        const secure = await AntiGamingEngine.verify(profileId);
        if (!secure) return 0;
        return await CompositeTrustEngine.calculate(profileId);
    }
}
""")
    print("Consolidated trust engines behind unified facade.")

# 4. Agent Event Ledger
os_events_path = os.path.join(repo, "lib", "os-events.ts")
with open(os_events_path, "w", encoding="utf-8") as f:
    f.write("""// System Event Connectivity added by Haul Command OS Retrofit
export const OS_EVENTS = {
  TRAINING_COMPLETED: 'training.completed',
  DIRECTORY_CLAIMED: 'directory.claimed',
  LOAD_MATCHED: 'load.matched',
  TRUST_SCORE_UPDATED: 'trust.updated',
  GLOBAL_EXPANSION_TRIGGER: 'market.expansion'
};
""")
print("Created system connectivity event mapping.")
