import { describe, expect, test } from "vitest";

import {
  evaluateSkillInvocation,
  resolveSkillOrError,
  type AgentSkillPolicyRecord,
} from "@/supabase/functions/agent-skill-router/policy";

const baseSkill: AgentSkillPolicyRecord = {
  skill_key: "dispatch.match_load",
  enabled: true,
  agent_callable: true,
  requires_human_approval: false,
  requires_idempotency_key: true,
  allowed_agent_roles: ["dispatch_agent", "admin_agent"],
  risk_level: "internal_write",
};

describe("agent skill router policy", () => {
  test("rejects unknown skills before execution", () => {
    expect(resolveSkillOrError(null)).toEqual({
      ok: false,
      code: "SKILL_NOT_FOUND",
      message: "No enabled skill metadata exists for the requested skill.",
    });
  });

  test("rejects disabled skills", () => {
    const result = evaluateSkillInvocation(
      { ...baseSkill, enabled: false },
      {
        caller_role: "dispatch_agent",
        idempotency_key: "idem_123",
        approval_status: null,
      },
    );

    expect(result).toMatchObject({ ok: false, code: "SKILL_DISABLED" });
  });

  test("requires approval before high-risk execution", () => {
    const result = evaluateSkillInvocation(
      {
        ...baseSkill,
        risk_level: "emergency",
        requires_human_approval: true,
      },
      {
        caller_role: "dispatch_agent",
        idempotency_key: "idem_123",
        approval_status: null,
      },
    );

    expect(result).toMatchObject({ ok: false, code: "APPROVAL_REQUIRED" });
  });

  test("requires idempotency keys for write skills", () => {
    const result = evaluateSkillInvocation(baseSkill, {
      caller_role: "dispatch_agent",
      idempotency_key: "",
      approval_status: null,
    });

    expect(result).toMatchObject({ ok: false, code: "IDEMPOTENCY_REQUIRED" });
  });

  test("rejects unauthorized agent roles", () => {
    const result = evaluateSkillInvocation(baseSkill, {
      caller_role: "seo_agent",
      idempotency_key: "idem_123",
      approval_status: null,
    });

    expect(result).toMatchObject({ ok: false, code: "SKILL_NOT_ALLOWED" });
  });

  test("allows approved, authorized calls", () => {
    const result = evaluateSkillInvocation(baseSkill, {
      caller_role: "dispatch_agent",
      idempotency_key: "idem_123",
      approval_status: null,
    });

    expect(result).toEqual({ ok: true });
  });
});
