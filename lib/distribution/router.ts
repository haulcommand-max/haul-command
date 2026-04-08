import type { DistributionJobSpec } from "@/types/market-signal";

type BuildDistributionJobsInput = {
  country_code?: string | null;
  risk_level: "low" | "medium" | "high";
  channels?: Array<{ channel: string; account_key?: string | null }>;
};

export const buildDistributionJobs = (
  input: BuildDistributionJobsInput,
): DistributionJobSpec[] => {
  const fallbackChannels =
    input.country_code === "US"
      ? [
          { channel: "facebook", account_key: "facebook_us_primary" },
          { channel: "tiktok", account_key: "tiktok_us_primary" },
        ]
      : [{ channel: "facebook", account_key: null }];

  const targets = input.channels?.length ? input.channels : fallbackChannels;

  return targets.map((target) => ({
    channel: target.channel,
    account_key: target.account_key ?? null,
    publish_mode: input.risk_level === "high" ? "manual_review" : "draft_only",
    scheduled_for: new Date().toISOString(),
    priority_score: input.risk_level === "high" ? 0.9 : 0.5,
  }));
};
