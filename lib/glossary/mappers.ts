import type {
  GlossaryTermPayload,
  GlossaryTopicPayload,
  GlossaryCountryPayload,
} from "./types";

export function mapRelationshipBuckets(payload: GlossaryTermPayload) {
  return {
    related: payload.relationships.filter((x) => x.relationship_type === "related"),
    confusedWith: payload.relationships.filter((x) => x.relationship_type === "confused_with"),
    parent: payload.relationships.filter((x) => x.relationship_type === "parent"),
    child: payload.relationships.filter((x) => x.relationship_type === "child"),
    oftenUsedWith: payload.relationships.filter((x) => x.relationship_type === "often_used_with"),
  };
}

export function mapLinkBuckets(payload: GlossaryTermPayload) {
  return {
    regulations: payload.links.filter((x) => x.link_type === "related_regulation"),
    tools: payload.links.filter((x) => x.link_type === "related_tool"),
    corridors: payload.links.filter((x) => x.link_type === "related_corridor"),
    locations: payload.links.filter((x) => x.link_type === "related_location"),
    services: payload.links.filter((x) => x.link_type === "related_service"),
    categories: payload.links.filter((x) => x.link_type === "related_category"),
    nextActions: payload.links.filter((x) => x.link_type === "next_action"),
    claimPaths: payload.links.filter((x) => x.link_type === "claim_path"),
    sponsorPaths: payload.links.filter((x) => x.link_type === "sponsor_path"),
    marketplacePaths: payload.links.filter((x) => x.link_type === "marketplace_path"),
  };
}

export function sortTopicTerms(payload: GlossaryTopicPayload) {
  return [...payload.terms].sort((a, b) => {
    if (b.commercial_intent_level !== a.commercial_intent_level) {
      return b.commercial_intent_level - a.commercial_intent_level;
    }
    return a.canonical_term.localeCompare(b.canonical_term);
  });
}

export function sortCountryTerms(payload: GlossaryCountryPayload) {
  return [...payload.terms].sort((a, b) => {
    if (b.commercial_intent_level !== a.commercial_intent_level) {
      return b.commercial_intent_level - a.commercial_intent_level;
    }
    return a.canonical_term.localeCompare(b.canonical_term);
  });
}
