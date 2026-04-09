import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key);
}

export async function syncDiffFindings(params: {
  projectId: string;
  report: any;
  baseRef: string;
  headSha: string;
  prNumber?: number | null;
}) {
  const supabase = getClient();

  const payload = {
    project_id: params.projectId,
    event_type: "diff_analysis",
    event_name: "branch_comparison_completed",
    payload: {
      baseRef: params.baseRef,
      headSha: params.headSha,
      prNumber: params.prNumber ?? null,
      introducedDebt: params.report.regressionDebt,
      baselineDebt: params.report.baselineDebt,
      improvements: params.report.improvements,
    },
  };

  const { error } = await supabase.from("gsd_events").insert(payload);
  if (error) throw error;
}
