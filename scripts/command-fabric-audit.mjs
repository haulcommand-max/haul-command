#!/usr/bin/env node
/**
 * Haul Command Command Fabric Audit
 *
 * Purpose:
 * - Detect whether Paperclip/Command Layer concepts are actually wired.
 * - Separate seeded agents from executable workers.
 * - Catch missing heartbeats, missing scripts, stale hardcoded credentials,
 *   playbook actions with no handlers, and untracked cron/API workers.
 *
 * This script is static-code only. It does not require Supabase access.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const report = {
  generated_at: new Date().toISOString(),
  status: 'needs_review',
  architecture: {
    pinecone: 'must_not_exist',
    typesense: 'required_for_fast_hero_directory_search',
    supabase_hc_vector: 'required_pinecone_replacement',
    command_fabric: 'required_central_nervous_system',
  },
  checks: [],
  missing: [],
  warnings: [],
  recommendations: [],
};

function addCheck(name, ok, details = {}) {
  report.checks.push({ name, ok, ...details });
  if (!ok) report.missing.push(name);
}

function walk(dir, out = []) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', '.python'].includes(entry.name)) continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

const files = [
  ...walk('app'),
  ...walk('lib'),
  ...walk('agents'),
  ...walk('scripts'),
  ...walk('supabase'),
].filter(p => /\.(ts|tsx|js|mjs|cjs|sql|json|md)$/.test(p));

// Core command files
addCheck('command_layer_schema_exists', exists('supabase/migrations/20260412_command_layer_schema.sql'));
addCheck('command_heartbeat_api_exists', exists('app/api/command/heartbeat/route.ts'));
addCheck('command_board_api_exists', exists('app/api/command/board/route.ts'));
addCheck('command_playbook_execute_api_exists', exists('app/api/command/playbooks/execute/route.ts'));
addCheck('command_heartbeat_library_exists', exists('lib/command-heartbeat.ts'));
addCheck('hybrid_command_fabric_config_exists', exists('agents/config/hybrid-command-fabric.json'));

// Pinecone must be gone, Typesense must remain.
const pineconeRefs = files.filter(p => /pinecone/i.test(read(p)) && !p.includes('command-fabric-audit'));
const typesenseRefs = files.filter(p => /typesense/i.test(read(p)) && !p.includes('command-fabric-audit'));
addCheck('no_active_pinecone_references', pineconeRefs.length === 0, { refs: pineconeRefs.slice(0, 20) });
addCheck('typesense_references_present', typesenseRefs.length > 0, { refs_count: typesenseRefs.length });

// Paperclip provision security and executable scripts.
if (exists('agents/paperclip-provision.js')) {
  const provision = read('agents/paperclip-provision.js');
  const hasCredentialDefault = /HaulCommand123|password\s*=\s*getArg\('--password'\)\s*\|\|/i.test(provision);
  addCheck('paperclip_provision_no_hardcoded_password_default', !hasCredentialDefault);

  const scriptRefs = [...provision.matchAll(/scriptPath:\s*'([^']+)'/g)].map(m => m[1]);
  const missingScripts = scriptRefs.filter(p => !exists(p));
  addCheck('paperclip_super_scripts_exist', missingScripts.length === 0, { script_refs: scriptRefs, missing_scripts: missingScripts });
}

// Cron/API routes should use CommandHeartbeat where appropriate.
const cronRoutes = files.filter(p => /^app\/api\/cron\/.+\/route\.ts$/.test(p));
const cronWithoutHeartbeat = cronRoutes.filter(p => !/CommandHeartbeat|withHeartbeat|hc_command_runs|command\/heartbeat/.test(read(p)));
addCheck('cron_routes_report_to_command_fabric', cronWithoutHeartbeat.length === 0, {
  cron_routes: cronRoutes,
  missing_heartbeat: cronWithoutHeartbeat,
});

// Playbook handler coverage.
if (exists('app/api/command/playbooks/execute/route.ts')) {
  const exec = read('app/api/command/playbooks/execute/route.ts');
  const handledActions = [...exec.matchAll(/step\.action\s*===\s*'([^']+)'/g)].map(m => m[1]);
  const migrations = files.filter(p => p.endsWith('.sql')).map(read).join('\n');
  const playbookActions = [...migrations.matchAll(/"action"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
  const uniquePlaybookActions = [...new Set(playbookActions)];
  const unhandled = uniquePlaybookActions.filter(a => !handledActions.includes(a));
  addCheck('playbook_actions_have_handlers', unhandled.length === 0, {
    handled_actions: handledActions,
    unhandled_actions: unhandled.slice(0, 100),
    unhandled_count: unhandled.length,
  });
}

// Firecrawl must route to command fabric eventually.
const firecrawlRefs = files.filter(p => /firecrawl/i.test(read(p)));
const firecrawlWithCommand = firecrawlRefs.filter(p => /CommandHeartbeat|hc_command_runs|hc_command_tasks|command\/heartbeat/.test(read(p)));
addCheck('firecrawl_present_or_planned', firecrawlRefs.length > 0, { refs: firecrawlRefs.slice(0, 20) });
addCheck('firecrawl_reports_to_command_fabric', firecrawlRefs.length === 0 || firecrawlWithCommand.length > 0, {
  firecrawl_refs: firecrawlRefs.slice(0, 20),
  command_wired_refs: firecrawlWithCommand,
});

// Emerging services watch coverage.
const emergingTerms = ['autonomous', 'drone', 'drones', 'EV', 'hydrogen', 'telematics'];
const emergingHits = files.filter(p => emergingTerms.some(t => new RegExp(t, 'i').test(read(p))));
addCheck('emerging_services_watch_present', emergingHits.length > 0, { refs: emergingHits.slice(0, 20) });

// Recommendations
if (cronWithoutHeartbeat.length) {
  report.recommendations.push('Wrap listed cron routes with withHeartbeat(...) or CommandHeartbeat.startDirect/completeDirect so they show up in Command Board.');
}
if (report.missing.includes('playbook_actions_have_handlers')) {
  report.recommendations.push('Add a playbook action registry so every seeded action maps to a handler, worker, or explicit manual-review step.');
}
if (report.missing.includes('paperclip_super_scripts_exist')) {
  report.recommendations.push('Create agents/scripts super-scripts or stop referencing them in paperclip-provision.js. Hybrid config should be the source of truth.');
}
if (report.missing.includes('firecrawl_reports_to_command_fabric')) {
  report.recommendations.push('Update the Supabase Firecrawl Edge Function to write hc_command_runs / hc_command_tasks metrics for every run.');
}
if (pineconeRefs.length) {
  report.recommendations.push('Remove Pinecone references unless they are historical docs explicitly marked deprecated. Supabase HC Vector is the replacement.');
}

const failed = report.checks.filter(c => !c.ok).length;
report.status = failed === 0 ? 'pass' : failed <= 3 ? 'partial' : 'needs_work';

const output = process.argv.includes('--json')
  ? JSON.stringify(report, null, 2)
  : [
      `Haul Command Command Fabric Audit — ${report.status.toUpperCase()}`,
      `Checks: ${report.checks.length}`,
      `Failed: ${failed}`,
      '',
      ...report.checks.map(c => `${c.ok ? '✅' : '❌'} ${c.name}`),
      '',
      'Recommendations:',
      ...(report.recommendations.length ? report.recommendations.map(r => `- ${r}`) : ['- None']),
    ].join('\n');

console.log(output);
process.exit(failed > 6 ? 1 : 0);
