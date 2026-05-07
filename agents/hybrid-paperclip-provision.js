#!/usr/bin/env node
/**
 * Haul Command Hybrid Paperclip Provisioning
 * =========================================
 * Source of truth: agents/config/hybrid-command-fabric.json
 *
 * Model:
 * - 7 real super agents / execution owners
 * - 208 virtual mandates: 120 countries + 50 U.S. states + 30 HQ domains + 8 emerging-service watches
 * - Virtual mandates are not paid LLM agents. They route work into Supabase command tasks.
 * - Workers/process scripts do bulk execution. LLMs are escalation-only.
 *
 * Usage:
 *   node agents/hybrid-paperclip-provision.js --dry-run
 *   PAPERCLIP_EMAIL=you@example.com PAPERCLIP_PASSWORD=... node agents/hybrid-paperclip-provision.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PAPERCLIP_URL || 'http://localhost:3100';
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const CONFIG_PATH = path.join(__dirname, 'config', 'hybrid-command-fabric.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Missing config: ${CONFIG_PATH}`);
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

const fabric = loadConfig();
const agents = fabric.real_super_agents.map((a) => ({
  key: a.slug,
  title: a.title,
  adapter: a.adapter_type === 'agent' ? 'claude_local' : 'process',
  model: a.default_model_class?.includes('highest') ? 'claude-opus-4-6' : null,
  budget: a.monthly_budget_cents ?? 0,
  hb: a.heartbeat_minutes ?? 120,
  reportsTo: a.slug === 'ceo-command-brain' ? null : 'ceo-command-brain',
  tasks: [
    ...((a.owns || []).map((x) => `Own ${x}`)),
    ...((a.money_paths || []).map((x) => `Track money path: ${x}`)),
  ],
  caps: `HYBRID SUPER AGENT: ${a.title}\nDomain: ${a.domain}\nOwns: ${(a.owns || []).join(', ')}\nMoney paths: ${(a.money_paths || []).join(', ')}\nDefault model class: ${a.default_model_class}\nVirtual mandates are zero-cost task scopes, not separate paid agents.`,
}));

const email = process.env.PAPERCLIP_EMAIL;
const password = process.env.PAPERCLIP_PASSWORD;
let sessionCookie = null;

async function api(method, apiPath, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (sessionCookie) opts.headers.Cookie = sessionCookie;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${apiPath}`, opts);
  const sc = res.headers.get('set-cookie');
  if (sc) sessionCookie = sc.split(';')[0];
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`${method} ${apiPath} -> ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function printSummary() {
  const totalTasks = agents.reduce((s, a) => s + a.tasks.length, 0);
  const totalBudget = agents.reduce((s, a) => s + a.budget, 0);
  const virtual = fabric.virtual_matrix || {};

  console.log('');
  console.log('HAUL COMMAND HYBRID PAPERCLIP COMMAND FABRIC');
  console.log('------------------------------------------------');
  console.log(`Real super agents:    ${agents.length}`);
  console.log(`Virtual mandates:     ${virtual.total_virtual_mandates || 208}`);
  console.log(`Countries covered:    ${virtual.country_mandates?.count || 120}`);
  console.log(`U.S. state mandates:  ${virtual.us_state_mandates?.count || 50}`);
  console.log(`HQ domain mandates:   ${virtual.hq_domain_mandates?.count || 30}`);
  console.log(`Emerging watches:     ${virtual.emerging_service_mandates?.count || 8}`);
  console.log(`Tasks per cycle:      ${totalTasks}`);
  console.log(`Monthly budget cap:   $${(totalBudget / 100).toFixed(0)}`);
  console.log(`Mode:                 ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');
}

async function main() {
  printSummary();

  if (DRY_RUN) {
    agents.forEach((a, i) => {
      const hbStr = a.hb >= 60 ? `${a.hb / 60}h` : `${a.hb}m`;
      const costStr = a.budget > 0 ? `$${(a.budget / 100).toFixed(0)}/mo cap` : 'FREE';
      console.log(`AGENT ${i + 1}: ${a.title}`);
      console.log(`  Adapter: ${a.adapter} | Heartbeat: ${hbStr} | Cost: ${costStr}`);
      a.tasks.forEach(t => console.log(`  - ${t}`));
      console.log('');
    });
    console.log('Hybrid rule: the 208 matrix is task scope, not 208 paid agents.');
    return;
  }

  if (!email || !password) {
    console.error('LIVE MODE BLOCKED: set PAPERCLIP_EMAIL and PAPERCLIP_PASSWORD in the environment.');
    process.exit(1);
  }

  console.log('1. Authenticating...');
  await api('POST', '/api/auth/sign-in/email', { email, password });
  console.log('   OK');

  console.log('2. Finding company...');
  const res = await api('GET', '/api/companies');
  const list = Array.isArray(res) ? res : (res.companies || res.data || []);
  const company = list[0];
  if (!company) throw new Error('No company found');
  console.log(`   ${company.name} (${company.id})`);

  console.log('3. Setting company budget cap...');
  try {
    await api('PATCH', `/api/companies/${company.id}`, { budgetMonthlyCents: 50000 });
  } catch (e) {
    console.log('   budget update skipped: ' + e.message);
  }

  let existingAgents = [];
  try {
    const agentRes = await api('GET', `/api/companies/${company.id}/agents`);
    existingAgents = Array.isArray(agentRes) ? agentRes : (agentRes.agents || agentRes.data || []);
  } catch {}

  console.log('4. Provisioning hybrid super agents...');
  const idMap = {};
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const a of agents) {
    const existing = existingAgents.find(e => e.title === a.title);
    if (existing) {
      idMap[a.key] = existing.id;
      skipped++;
      console.log(`   ~ ${a.title} exists`);
      continue;
    }

    const body = {
      title: a.title,
      adapterType: a.adapter,
      capabilities: a.caps,
      budgetMonthlyCents: a.budget,
      companyId: company.id,
    };
    if (a.reportsTo && idMap[a.reportsTo]) body.reportsToAgentId = idMap[a.reportsTo];
    if (a.model) body.adapterConfig = { model: a.model };

    try {
      const result = await api('POST', `/api/companies/${company.id}/agents`, body);
      idMap[a.key] = result.id || result.agentId;
      created++;
      console.log(`   + ${a.title}`);
    } catch (e) {
      errors++;
      console.log(`   X ${a.title}: ${e.message}`);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    blueprint: 'HYBRID PAPERCLIP COMMAND FABRIC',
    companyId: company.id,
    realSuperAgents: agents.length,
    virtualMandates: fabric.virtual_matrix?.total_virtual_mandates ?? 208,
    architecture: fabric.locked_architecture,
    created,
    skipped,
    errors,
    agents: agents.map(a => ({
      key: a.key,
      title: a.title,
      id: idMap[a.key] || null,
      adapter: a.adapter,
      budgetCents: a.budget,
      heartbeatMin: a.hb,
      tasksPerCycle: a.tasks.length,
    })),
  };

  const mPath = path.join(__dirname, 'paperclip-manifest.json');
  fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2));
  console.log(`\nCreated: ${created} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(`Manifest: ${mPath}`);
}

main().catch(e => {
  console.error('Fatal: ' + e.message);
  process.exit(1);
});
