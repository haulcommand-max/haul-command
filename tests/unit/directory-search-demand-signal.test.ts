import { describe, expect, it } from "vitest";
import { buildDirectorySearchSignal } from "@/lib/directory/search-demand-signal";

describe("buildDirectorySearchSignal", () => {
  it("extracts role and state from a high-intent directory query", () => {
    const signal = buildDirectorySearchSignal({
      query: "pilot car operator Texas",
      resultCount: 0,
      source: "directory_grid",
    });

    expect(signal.parsed_role).toBe("pilot_car_operator");
    expect(signal.parsed_state).toBe("TX");
    expect(signal.no_results).toBe(true);
    expect(signal.source).toBe("directory_grid");
  });

  it("uses explicit filters over loose query inference", () => {
    const signal = buildDirectorySearchSignal({
      query: "support near me",
      filters: {
        query: "support near me",
        category: "route-survey",
        country: "ca",
        state: "ON",
      },
      resultCount: 12,
    });

    expect(signal.parsed_role).toBe("route_survey");
    expect(signal.parsed_country).toBe("CA");
    expect(signal.parsed_state).toBe("ON");
    expect(signal.no_results).toBe(false);
  });

  it("keeps no-result gaps as structured demand without fake supply", () => {
    const signal = buildDirectorySearchSignal({
      query: "high pole escort Houston TX",
      resultCount: 0,
    });

    expect(signal.parsed_role).toBe("high_pole_escort");
    expect(signal.parsed_state).toBe("TX");
    expect(signal.parsed_city).toBe("Houston");
    expect(signal.result_count).toBe(0);
  });
});
