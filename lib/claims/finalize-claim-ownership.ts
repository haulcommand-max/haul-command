type SupabaseUpdateBuilder = {
  eq(column: string, value: string): Promise<{ error?: { message?: string; code?: string } | null }>;
};

type SupabaseLike = {
  from(table: string): {
    update(values: Record<string, unknown>): SupabaseUpdateBuilder;
    insert(values: Record<string, unknown>): Promise<{ error?: { message?: string; code?: string } | null }>;
  };
};

type FinalizeClaimOwnershipParams = {
  entityId: string;
  userId: string;
  source: string;
  primaryTable?: "hc_global_operators" | "hc_operators" | "directory_entities";
  conversionAmountCents?: number;
  metadata?: Record<string, unknown>;
};

type OwnershipUpdateResult = {
  table: string;
  ok: boolean;
  primary: boolean;
  ignored?: boolean;
  error?: string;
};

function isSchemaDriftError(error?: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

async function safeOwnershipUpdate(
  supabase: SupabaseLike,
  table: string,
  values: Record<string, unknown>,
  entityId: string,
  primaryTable?: string,
): Promise<OwnershipUpdateResult> {
  const primary = table === primaryTable;
  const { error } = await supabase.from(table).update(values).eq("id", entityId);

  if (!error) {
    return { table, ok: true, primary };
  }

  if (!primary && isSchemaDriftError(error)) {
    return { table, ok: false, primary, ignored: true, error: error.message };
  }

  return { table, ok: false, primary, error: error.message };
}

async function safeClaimConversionEvent(
  supabase: SupabaseLike,
  params: FinalizeClaimOwnershipParams,
  primaryTable: string,
) {
  const amount = Number(params.conversionAmountCents ?? 0);
  const { error } = await supabase.from("hc_command_money_events").insert({
    event_type: "claim_conversion",
    amount_cents: Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0,
    currency: "USD",
    entity_type: primaryTable,
    entity_id: params.entityId,
    metadata: {
      source: params.source,
      user_id: params.userId,
      primary_table: primaryTable,
      ...(params.metadata ?? {}),
    },
  });

  if (!error) return { ok: true };
  if (isSchemaDriftError(error)) return { ok: false, ignored: true, error: error.message };
  return { ok: false, error: error.message };
}

export async function finalizeClaimOwnership(
  supabase: SupabaseLike,
  params: FinalizeClaimOwnershipParams,
) {
  const now = new Date().toISOString();
  const primaryTable = params.primaryTable ?? "hc_global_operators";

  const results = await Promise.all([
    safeOwnershipUpdate(
      supabase,
      "hc_global_operators",
      {
        user_id: params.userId,
        claim_status: "verified",
        primary_trust_source: params.source,
        claimed_at: now,
        updated_at: now,
      },
      params.entityId,
      primaryTable,
    ),
    safeOwnershipUpdate(
      supabase,
      "hc_operators",
      {
        user_id: params.userId,
        claim_status: "claimed",
        claimed_at: now,
        updated_at: now,
      },
      params.entityId,
      primaryTable,
    ),
    safeOwnershipUpdate(
      supabase,
      "directory_entities",
      {
        owner_user_id: params.userId,
        claim_status: "claimed",
        claimed_at: now,
        updated_at: now,
      },
      params.entityId,
      primaryTable,
    ),
  ]);

  await supabase
    .from("hc_trust_profiles")
    .update({
      claimed: true,
      claim_pending: false,
      claim_user_id: params.userId,
      claim_approved_at: now,
      updated_at: now,
    })
    .eq("entity_id", params.entityId)
    .catch(() => undefined);

  const claimConversionEvent = await safeClaimConversionEvent(supabase, params, primaryTable);

  const primaryFailure = results.find((result) => result.primary && !result.ok);
  if (primaryFailure) {
    throw new Error(primaryFailure.error || `Failed to update ${primaryFailure.table}`);
  }

  return {
    entityId: params.entityId,
    userId: params.userId,
    updatedAt: now,
    results,
    claimConversionEvent,
  };
}
