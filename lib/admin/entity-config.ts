// lib/admin/entity-config.ts — Entity configuration for asset linking
export const ENTITY_CONFIG = {
  directory_listing: {
    table: "directory_listings",
    labelColumn: "title",
    slugColumn: "slug",
    selectColumns: "id,title,slug",
  },
  broker_profile: {
    table: "broker_profiles",
    labelColumn: "name",
    slugColumn: "slug",
    selectColumns: "id,name,slug",
  },
  partner_profile: {
    table: "partner_profiles",
    labelColumn: "name",
    slugColumn: "slug",
    selectColumns: "id,name,slug",
  },
  marketplace_item: {
    table: "marketplace_items",
    labelColumn: "title",
    slugColumn: "slug",
    selectColumns: "id,title,slug",
  },
  social_campaign: {
    table: "social_campaigns",
    labelColumn: "name",
    slugColumn: "slug",
    selectColumns: "id,name,slug",
  },
} as const;

export type HcEntityType = keyof typeof ENTITY_CONFIG;

export const HC_ENTITY_TYPE_OPTIONS: Array<{
  value: HcEntityType;
  label: string;
}> = [
  { value: "directory_listing", label: "Directory listing" },
  { value: "broker_profile", label: "Broker profile" },
  { value: "partner_profile", label: "Partner profile" },
  { value: "marketplace_item", label: "Marketplace item" },
  { value: "social_campaign", label: "Social campaign" },
];
