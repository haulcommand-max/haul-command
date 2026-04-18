import { cache } from "react";
import {
  rpcTrainingHubPayload,
  rpcTrainingPagePayload,
  rpcTrainingCountryPayload,
} from "./rpc";

export const getTrainingHubPayload = cache(async () => {
  return rpcTrainingHubPayload();
});

export const getTrainingPagePayload = cache(
  async (slug: string, countryCode?: string | null, regionCode?: string | null) => {
    return rpcTrainingPagePayload({
      slug,
      countryCode: countryCode ?? null,
      regionCode: regionCode ?? null,
    });
  }
);

export const getTrainingCountryPayload = cache(async (countryCode: string) => {
  return rpcTrainingCountryPayload(countryCode.toUpperCase());
});
