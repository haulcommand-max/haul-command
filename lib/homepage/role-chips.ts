import { createClient } from "@/lib/supabase/server";

export type HomepageHeroChip = {
  id: string;
  label: string;
  type: "conversion" | "role";
  href?: string;
  family?: string | null;
  priority: number;
  isRare?: boolean;
  weight: number;
};

export type HomepageRoleChipResult = {
  chips: HomepageHeroChip[];
  source: "canonical_roles" | "hc_role_catalog" | "fallback";
  eligibleCount: number;
};

const FALLBACK_ROLE_LABELS = [
  "Pilot Car Operator",
  "Escort Vehicle",
  "Heavy Haul Carrier",
  "Oversize Load Broker",
  "Permit Service",
  "Route Surveyor",
  "High Pole Escort",
  "Steerperson",
  "Mobile Mechanic",
  "Heavy Wrecker",
  "Crane Service",
  "Traffic Control",
  "Bucket Truck",
  "Route Support",
  "Load Escort",
];

function normalizeLabel(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCountryCode(value?: string | null): string {
  const code = normalizeLabel(value).toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "US";
}

function withCountry(path: string, countryCode: string, params: Record<string, string> = {}): string {
  const search = new URLSearchParams({ country: normalizeCountryCode(countryCode), ...params });
  return `${path}?${search.toString()}`;
}

export function buildHomepageRoleHref(row: Record<string, any>, label: string, countryCode = "US"): string {
  const country = normalizeCountryCode(countryCode);
  const key = normalizeLabel(row.role_key).toLowerCase();
  const family = normalizeLabel(row.role_family || row.role_family_display || row.entity_family).toLowerCase();
  const roleHubPath = normalizeLabel(row.role_hub_path || row.seo_page_slug || row.directory_slug);
  const haystack = `${key} ${family} ${label}`.toLowerCase();

  if (roleHubPath.startsWith("/")) {
    return withCountry(roleHubPath, country, { role: key || slugify(label) });
  }

  if (/\b(broker|dispatcher|shipper|carrier|logistics)\b/.test(haystack)) {
    return withCountry("/loads/post", country, { role: key || slugify(label), intent: "post-load" });
  }

  if (/\b(permit|compliance|regulation)\b/.test(haystack)) {
    return withCountry("/tools/permit-calculator", country, { role: key || slugify(label) });
  }

  if (/\b(training|certification|school|instructor)\b/.test(haystack)) {
    return withCountry("/training", country, { role: key || slugify(label) });
  }

  return withCountry("/directory", country, {
    q: label,
    role: key || slugify(label),
  });
}

function scoreWeight(row: Record<string, any>): number {
  const money = Number(row.default_money_score ?? row.monetization_score ?? 0);
  const scarcity = Number(row.scarcity_score ?? row.scarcity_multiplier ?? 0);
  const urgency = Number(row.urgency_score ?? 0);
  const equipment = Number(row.equipment_value_score ?? 0);
  const total = money + scarcity + urgency + equipment;
  if (total >= 220) return 2.2;
  if (total >= 120) return 1.7;
  if (scarcity >= 2 || row.is_rare_role) return 1.45;
  return 1;
}

function toRoleChip(row: Record<string, any>, labelKey: "role_name" | "display_name", countryCode: string): HomepageHeroChip | null {
  const label = normalizeLabel(row[labelKey]);
  if (!label) return null;
  const key = normalizeLabel(row.role_key) || slugify(label);
  const family = normalizeLabel(row.role_family || row.role_family_display || row.entity_family) || null;
  const priority = Math.round(
    Number(row.default_money_score ?? 0) ||
    Number(row.monetization_score ?? 0) ||
    Number(row.scarcity_score ?? 0) ||
    (row.is_rare_role ? 80 : 50)
  );

  return {
    id: key,
    label,
    type: "role",
    href: buildHomepageRoleHref(row, label, countryCode),
    family,
    priority,
    isRare: Boolean(row.is_rare_role) || Number(row.scarcity_score ?? row.scarcity_multiplier ?? 0) > 1,
    weight: scoreWeight(row),
  };
}

function dedupeChips(chips: HomepageHeroChip[]): HomepageHeroChip[] {
  const seenKeys = new Set<string>();
  const seenLabels = new Set<string>();

  return chips.filter((chip) => {
    const key = chip.id.toLowerCase();
    const label = chip.label.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!chip.label || seenKeys.has(key) || seenLabels.has(label)) return false;
    seenKeys.add(key);
    seenLabels.add(label);
    return true;
  });
}

function fallbackRoleChips(countryCode = "US"): HomepageRoleChipResult {
  const chips = FALLBACK_ROLE_LABELS.map((label) => ({
    id: slugify(label),
    label,
    type: "role" as const,
    href: buildHomepageRoleHref({ role_key: slugify(label) }, label, countryCode),
    family: null,
    priority: 40,
    isRare: false,
    weight: 1,
  }));

  return { chips, source: "fallback", eligibleCount: chips.length };
}

export async function getHomepageRoleChips(countryCode = "US"): Promise<HomepageRoleChipResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("canonical_roles" as any)
      .select(`
        role_key,
        role_name,
        role_family,
        directory_slug,
        seo_page_slug,
        default_money_score,
        monetization_score,
        scarcity_score,
        urgency_score,
        training_value_score,
        equipment_value_score,
        can_be_legally_advertised,
        is_government_only,
        entity_family
      `)
      .eq("can_be_legally_advertised", true)
      .eq("is_government_only", false)
      .not("role_name", "is", null)
      .order("default_money_score", { ascending: false, nullsFirst: false })
      .order("monetization_score", { ascending: false, nullsFirst: false })
      .order("scarcity_score", { ascending: false, nullsFirst: false })
      .order("role_name", { ascending: true });

    if (!error && data?.length) {
      const chips = dedupeChips(data.map((row) => toRoleChip(row as any, "role_name", countryCode)).filter(Boolean) as HomepageHeroChip[]);
      return { chips, source: "canonical_roles", eligibleCount: chips.length };
    }
  } catch (error) {
    console.warn("[homepage-role-chips] canonical_roles unavailable", error);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("hc_role_catalog" as any)
      .select(`
        role_key,
        display_name,
        role_family,
        role_family_display,
        role_hub_path,
        is_active,
        is_rare_role,
        scarcity_multiplier,
        ux_bucket,
        cta_primary,
        cta_secondary,
        monetization_path
      `)
      .eq("is_active", true)
      .not("display_name", "is", null)
      .order("scarcity_multiplier", { ascending: false, nullsFirst: false })
      .order("display_name", { ascending: true });

    if (!error && data?.length) {
      const chips = dedupeChips(data.map((row) => toRoleChip(row as any, "display_name", countryCode)).filter(Boolean) as HomepageHeroChip[]);
      return { chips, source: "hc_role_catalog", eligibleCount: chips.length };
    }
  } catch (error) {
    console.warn("[homepage-role-chips] hc_role_catalog unavailable", error);
  }

  return fallbackRoleChips(countryCode);
}
