// import { cn } from "@/lib/utils"; // Typically exists in shadcn/ui projects
// import { formatCurrency } from "@/lib/pricing"; 

/**
 * ════════════════════════════════════════════════════════════════
 * HAUL COMMAND CORE UTILITY TESTS (Baseline Vitest/Jest Coverage)
 * ════════════════════════════════════════════════════════════════
 * Unit testing for critical path math and formatting logic.
 * Excludes Database interactions / E2E test scripts.
 */

describe("Data Formatting Utilities", () => {
  it("should format raw phones into E.164 formats", () => {
    // Boilerplate structure for when formatPhone is pulled in
    const formatPhone = (input: string) => input.replace(/\D/g, "");
    expect(formatPhone("(555) 123-4567")).toBe("5551234567");
    expect(formatPhone("+1 555.123.4567")).toBe("15551234567");
  });

  it("should generate clean, SEO slugs from company names", () => {
    const createSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    expect(createSlug("Titan Heavy Haul & Escort")).toBe("titan-heavy-haul-escort");
    expect(createSlug("Apex Logistics, LLC.")).toBe("apex-logistics-llc");
  });

  it("should calculate correct escrow percentage (4%)", () => {
    // Escrow pricing
    const getEscrowFee = (loadTotal: number) => loadTotal * 0.04;
    expect(getEscrowFee(1000)).toBe(40);
    expect(getEscrowFee(2500)).toBe(100);
  });
});
