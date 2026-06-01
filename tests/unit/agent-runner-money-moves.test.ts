import { describe, expect, it, vi } from "vitest";

describe("agent runner money moves", () => {
  it("drains money-move agent jobs into prospect, activity, money, and next-action records", async () => {
    const { isMoneyMoveAgentJob, processMoneyMoveAgentJob } = await import("@/workers/agentRunner");
    const inserts: Array<{ table: string; payload: Record<string, unknown> }> = [];
    const ids: Record<string, string> = {
      prospects: "11111111-1111-4111-8111-111111111111",
      prospect_activities: "22222222-2222-4222-8222-222222222222",
      hc_command_money_events: "33333333-3333-4333-8333-333333333333",
      hc_command_tasks: "44444444-4444-4444-8444-444444444444",
    };
    const supabase = {
      from: vi.fn((table: string) => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          insert: vi.fn((payload: Record<string, unknown>) => {
            inserts.push({ table, payload });
            return chain;
          }),
          single: vi.fn(async () => ({ data: { id: ids[table] }, error: null })),
        };
        return chain;
      }),
    };
    const job = {
      id: "55555555-5555-4555-8555-555555555555",
      agent_name: "money-moves-agent",
      job_type: "adgrid_prospect",
      target_type: "money_moves",
      target_id: "market-us-fl",
      priority: 20,
      input_payload_json: {
        company_name: "Florida Escort Supply Co",
        country_code: "US",
        category: "pilot_car",
        market: "US-FL",
        contact_email: "sponsor@example.com",
        revenue_impact_cents: 19900,
        next_action: "offer state sponsor slot",
      },
    };

    expect(isMoneyMoveAgentJob(job)).toBe(true);
    const result = await processMoneyMoveAgentJob(supabase, job);

    expect(result).toMatchObject({
      action: "money_move_records_created",
      prospect_id: ids.prospects,
      prospect_activity_id: ids.prospect_activities,
      money_event_id: ids.hc_command_money_events,
      command_task_id: ids.hc_command_tasks,
    });
    expect(inserts.map((insert) => insert.table)).toEqual([
      "prospects",
      "prospect_activities",
      "hc_command_money_events",
      "hc_command_tasks",
    ]);
    expect(inserts.find((insert) => insert.table === "hc_command_money_events")?.payload).toMatchObject({
      event_type: "sponsor_payment",
      amount_cents: 19900,
      entity_type: "prospect",
      entity_id: ids.prospects,
      market: "US-FL",
    });
    expect(inserts.find((insert) => insert.table === "hc_command_tasks")?.payload).toMatchObject({
      title: "Money move: adgrid_prospect",
      domain: "money_moves",
      target_entity_type: "prospect",
      target_entity_id: ids.prospects,
      revenue_impact_cents: 19900,
    });
  });
});
