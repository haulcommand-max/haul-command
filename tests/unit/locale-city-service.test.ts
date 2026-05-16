import { describe, expect, it } from "vitest";
import {
  buildLocaleCityServiceCanonical,
  cityServiceIndexabilityScore,
  countryFromLocale,
  getCityServiceDefinition,
  shouldIndexCityServicePage,
} from "@/lib/seo/locale-city-service";
import { resolveLegacyCityServiceRedirect } from "@/lib/seo/legacy-city-service-redirect";

describe("locale-first city service helpers", () => {
  it("normalizes locale country and service definitions", () => {
    expect(countryFromLocale("en-us")).toBe("US");
    expect(countryFromLocale("de-de")).toBe("DE");
    expect(getCityServiceDefinition("pilot-car").entitySubtypes).toContain("pilot_car_operator");
  });

  it("builds stable canonical URLs for Caleb-style city service pages", () => {
    expect(buildLocaleCityServiceCanonical({
      locale: "en-us",
      region: "TX",
      city: "Houston",
      service: "Pilot Car",
    })).toBe("https://www.haulcommand.com/en-us/tx/houston/pilot-car");
  });

  it("keeps indexability gated by concrete useful signals", () => {
    const thinScore = cityServiceIndexabilityScore({
      providerCount: 0,
      hasServiceDefinition: true,
      hasRegion: true,
      hasCity: true,
      hasNoDeadEndActions: false,
      hasFaq: false,
      hasInternalLinks: false,
    });

    const usefulScore = cityServiceIndexabilityScore({
      providerCount: 4,
      hasServiceDefinition: true,
      hasRegion: true,
      hasCity: true,
      hasNoDeadEndActions: true,
      hasFaq: true,
      hasInternalLinks: true,
    });

    expect(thinScore).toBeGreaterThanOrEqual(3);
    expect(shouldIndexCityServicePage(thinScore, 0)).toBe(false);
    expect(shouldIndexCityServicePage(usefulScore, 4)).toBe(true);
  });

  it("redirects legacy US city-service slugs without breaking hyphenated city names", () => {
    expect(resolveLegacyCityServiceRedirect("/us-tx-houston-pilot-car")).toBe("/en-us/tx/houston/pilot-car");
    expect(resolveLegacyCityServiceRedirect("/us-tx-san-antonio-permit-support")).toBe("/en-us/tx/san-antonio/permit-support");
    expect(resolveLegacyCityServiceRedirect("/us-tx")).toBeNull();
  });
});
