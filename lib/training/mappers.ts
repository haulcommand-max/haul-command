import type { TrainingPagePayload } from "./types";

export function mapTrainingLinkBuckets(payload: TrainingPagePayload) {
  return {
    regulations: payload.links.filter((x) => x.link_type === "related_regulation"),
    tools: payload.links.filter((x) => x.link_type === "related_tool"),
    glossary: payload.links.filter((x) => x.link_type === "related_glossary"),
    locations: payload.links.filter((x) => x.link_type === "related_location"),
    corridors: payload.links.filter((x) => x.link_type === "related_corridor"),
    nextActions: payload.links.filter((x) => x.link_type === "next_action"),
    claimPaths: payload.links.filter((x) => x.link_type === "claim_path"),
    sponsorPaths: payload.links.filter((x) => x.link_type === "sponsor_path"),
  };
}

export function groupGeoFitByCountry(
  geoFit: TrainingPagePayload["geo_fit"]
) {
  const map: Record<string, typeof geoFit> = {};
  for (const gf of geoFit) {
    if (!map[gf.country_code]) map[gf.country_code] = [];
    map[gf.country_code].push(gf);
  }
  return map;
}
