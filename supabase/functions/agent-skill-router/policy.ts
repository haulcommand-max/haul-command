export type AgentSkillRiskLevel =
  | "public_read"
  | "internal_read"
  | "internal_write"
  | "external_side_effect"
  | "financial"
  | "admin"
  | "emergency";

export type AgentSkillPolicyRecord = {
  skill_key: string;
  enabled: boolean;
  agent_callable: boolean;
  requires_human_approval: boolean;
  requires_idempotency_key: boolean;
  allowed_agent_roles: string[] | null;
  risk_level: AgentSkillRiskLevel;
};

export type AgentSkillInvocationContext = {
  caller_role: string | null;
  idempotency_key: string | null;
  approval_status: "approved" | "pending" | "rejected" | null;
};

export type AgentSkillPolicyResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

const APPROVAL_RISK_LEVELS = new Set<AgentSkillRiskLevel>([
  "external_side_effect",
  "financial",
  "admin",
  "emergency",
]);

export function resolveSkillOrError(
  skill: AgentSkillPolicyRecord | null,
): AgentSkillPolicyResult {
  if (!skill) {
    return {
      ok: false,
      code: "SKILL_NOT_FOUND",
      message: "No enabled skill metadata exists for the requested skill.",
    };
  }

  return { ok: true };
}

export function evaluateSkillInvocation(
  skill: AgentSkillPolicyRecord,
  context: AgentSkillInvocationContext,
): AgentSkillPolicyResult {
  if (!skill.enabled) {
    return {
      ok: false,
      code: "SKILL_DISABLED",
      message: "This skill is currently disabled.",
    };
  }

  if (!skill.agent_callable) {
    return {
      ok: false,
      code: "SKILL_NOT_ALLOWED",
      message: "This skill is not agent-callable.",
    };
  }

  const allowedRoles = skill.allowed_agent_roles ?? [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(context.caller_role ?? "")) {
    return {
      ok: false,
      code: "SKILL_NOT_ALLOWED",
      message: "This caller role is not allowed to invoke the skill.",
    };
  }

  if (skill.requires_idempotency_key && !context.idempotency_key?.trim()) {
    return {
      ok: false,
      code: "IDEMPOTENCY_REQUIRED",
      message: "This skill requires an idempotency key.",
    };
  }

  const requiresApproval =
    skill.requires_human_approval || APPROVAL_RISK_LEVELS.has(skill.risk_level);
  if (requiresApproval && context.approval_status !== "approved") {
    return {
      ok: false,
      code: "APPROVAL_REQUIRED",
      message: "This skill requires an approved human approval row before execution.",
    };
  }

  return { ok: true };
}
