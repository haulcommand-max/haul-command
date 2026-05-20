import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const contractsPath = join(root, "lib", "audience", "audience-contracts.json");
const contracts = JSON.parse(readFileSync(contractsPath, "utf8"));

const issues = [];

function addIssue(level, contract, message) {
  issues.push({ level, contractId: contract.id, message });
}

function includesAudience(contract, audience) {
  return contract.primaryAudience === audience || contract.secondaryAudiences.includes(audience);
}

function assertContractShape(contract) {
  if (!contract.routePattern.startsWith("/")) {
    addIssue("error", contract, `routePattern must start with /: ${contract.routePattern}`);
  }

  if (contract.routeFile && !existsSync(join(root, contract.routeFile))) {
    addIssue("warning", contract, `routeFile does not exist yet: ${contract.routeFile}`);
  }

  if (!includesAudience(contract, "demand_side")) {
    addIssue("error", contract, "contract must serve demand-side users");
  }

  if (!includesAudience(contract, "supply_side")) {
    addIssue("error", contract, "contract must serve supply-side providers");
  }

  if (!includesAudience(contract, "discovery_authority")) {
    addIssue("error", contract, "contract must serve discovery/authority systems");
  }

  if (contract.requiredCtas.length === 0) {
    addIssue("error", contract, "contract requires at least one visible CTA");
  }

  if (includesAudience(contract, "demand_side") && !contract.requiredCtas.some((cta) => cta === "find_providers" || cta === "post_load")) {
    addIssue("error", contract, "demand-side pages need find_providers or post_load CTA");
  }

  if (includesAudience(contract, "supply_side") && !contract.requiredCtas.includes("claim_listing")) {
    addIssue("error", contract, "supply-side pages need claim_listing CTA");
  }

  if (!contract.requiredTrustModules.includes("source_confidence")) {
    addIssue("error", contract, "contract must require source_confidence");
  }

  if (!contract.requiredDiscoveryModules.includes("schema")) {
    addIssue("error", contract, "contract must require schema");
  }

  if (!contract.requiredDiscoveryModules.includes("internal_links")) {
    addIssue("error", contract, "contract must require internal_links");
  }

  if (!contract.requiredSchema.includes("BreadcrumbList")) {
    addIssue("error", contract, "contract must require BreadcrumbList schema");
  }

  if (contract.requiredInternalLinkFamilies.length < 3) {
    addIssue("error", contract, "contract needs at least three internal-link families");
  }

  if (contract.noDeadEndActions.length < 3) {
    addIssue("error", contract, "contract needs at least three no-dead-end actions");
  }

  if (contract.monetizationRule === "primary" && contract.primaryAudience !== "monetization") {
    addIssue("error", contract, "primary monetization is only allowed on monetization-first pages");
  }
}

for (const contract of contracts) {
  assertContractShape(contract);
}

const contractIds = new Set();
for (const contract of contracts) {
  if (contractIds.has(contract.id)) {
    addIssue("error", contract, "duplicate contract id");
  }
  contractIds.add(contract.id);
}

const requiredContracts = [
  "directory-root",
  "directory-country",
  "provider-profile",
  "role-hub",
  "corridor-page",
  "regulation-page",
  "tool-page",
  "near-me",
];

for (const id of requiredContracts) {
  if (!contractIds.has(id)) {
    issues.push({ level: "error", contractId: id, message: "missing required baseline contract" });
  }
}

const errors = issues.filter((issue) => issue.level === "error");
const warnings = issues.filter((issue) => issue.level === "warning");

console.log(`Audience contracts audited: ${contracts.length}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

for (const issue of issues) {
  const prefix = issue.level === "error" ? "ERROR" : "WARN";
  console.log(`${prefix} [${issue.contractId}] ${issue.message}`);
}

if (errors.length > 0) {
  process.exit(1);
}

