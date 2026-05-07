import { describe, expect, it } from "vitest";
import { buildHeroRoleWindow } from "@/lib/homepage/hero-role-rotation";
import { buildHomepageRoleHref } from "@/lib/homepage/role-chips";
import type { HomepageHeroChip } from "@/lib/homepage/role-chips";

const chips: HomepageHeroChip[] = [
  { id: "lead", label: "Lead Pilot Car", type: "role", href: "/directory?q=Lead%20Pilot%20Car", priority: 90, weight: 1 },
  { id: "chase", label: "Chase Pilot Car", type: "role", href: "/directory?q=Chase%20Pilot%20Car", priority: 88, weight: 1 },
  { id: "high-pole", label: "High Pole Escort", type: "role", href: "/directory?q=High%20Pole%20Escort", priority: 86, weight: 1 },
  { id: "route-survey", label: "Route Surveyor", type: "role", href: "/directory?q=Route%20Surveyor", priority: 80, weight: 1 },
  { id: "traffic-control", label: "Traffic Control", type: "role", href: "/directory?q=Traffic%20Control", priority: 70, weight: 1 },
];

describe("buildHeroRoleWindow", () => {
  it("shows a readable window of unique role chips", () => {
    const visible = buildHeroRoleWindow(chips, 0, 3);

    expect(visible).toHaveLength(3);
    expect(visible.map((chip) => chip.label)).toEqual([
      "Lead Pilot Car",
      "Chase Pilot Car",
      "High Pole Escort",
    ]);
  });

  it("rotates through the full list without repeating the same visible group", () => {
    const first = buildHeroRoleWindow(chips, 0, 3).map((chip) => chip.id);
    const second = buildHeroRoleWindow(chips, 1, 3).map((chip) => chip.id);
    const wrapped = buildHeroRoleWindow(chips, 4, 3).map((chip) => chip.id);

    expect(second).not.toEqual(first);
    expect(wrapped).toEqual(["traffic-control", "lead", "chase"]);
  });

  it("dedupes role labels before choosing visible chips", () => {
    const visible = buildHeroRoleWindow([...chips, { ...chips[0], id: "lead-copy" }], 0, 6);

    expect(visible.map((chip) => chip.label)).toEqual([
      "Lead Pilot Car",
      "Chase Pilot Car",
      "High Pole Escort",
      "Route Surveyor",
      "Traffic Control",
    ]);
  });

  it("supports larger desktop and mobile visible windows without exceeding available roles", () => {
    expect(buildHeroRoleWindow(chips, 0, 7)).toHaveLength(5);
    expect(buildHeroRoleWindow([...chips, { id: "bucket", label: "Bucket Truck", type: "role", href: "/directory?q=Bucket%20Truck", priority: 68, weight: 1 }], 0, 5)).toHaveLength(5);
  });

  it("can rotate through a large role catalog without dropping rows", () => {
    const largeCatalog = Array.from({ length: 169 }, (_, index) => ({
      id: `role-${index + 1}`,
      label: `Role ${index + 1}`,
      type: "role" as const,
      href: `/directory?q=Role+${index + 1}`,
      priority: 50,
      weight: 1,
    }));
    const seen = new Set<string>();

    for (let offset = 0; offset < largeCatalog.length; offset += 7) {
      buildHeroRoleWindow(largeCatalog, offset, 7).forEach((chip) => seen.add(chip.id));
    }

    expect(seen.size).toBe(169);
  });
});

describe("buildHomepageRoleHref", () => {
  it("routes job-position roles into country-aware directory search", () => {
    expect(buildHomepageRoleHref({ role_key: "high_pole_escort" }, "High Pole Escort", "AU")).toBe(
      "/directory?country=AU&q=High+Pole+Escort&role=high_pole_escort",
    );
  });

  it("routes broker-style roles into the load posting flow for that country", () => {
    expect(buildHomepageRoleHref({ role_key: "broker_dispatcher" }, "Broker Dispatcher", "AU")).toBe(
      "/loads/post?country=AU&role=broker_dispatcher&intent=post-load",
    );
  });
});
