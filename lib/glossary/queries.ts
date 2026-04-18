import { cache } from "react";
import {
  rpcGlossaryHubPayload,
  rpcGlossaryTermPayload,
  rpcGlossaryTopicPayload,
  rpcGlossaryCountryPayload,
} from "./rpc";

export const getGlossaryHubPayload = cache(async () => {
  return rpcGlossaryHubPayload();
});

export const getGlossaryTermPayload = cache(
  async (termSlug: string, countryCode?: string | null, regionCode?: string | null) => {
    return rpcGlossaryTermPayload({
      termSlug,
      countryCode: countryCode ?? null,
      regionCode: regionCode ?? null,
    });
  }
);

export const getGlossaryTopicPayload = cache(async (topicSlug: string) => {
  return rpcGlossaryTopicPayload(topicSlug);
});

export const getGlossaryCountryPayload = cache(async (countryCode: string) => {
  return rpcGlossaryCountryPayload(countryCode.toUpperCase());
});
