import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("Next.js redirect rules", () => {
  it("keeps legacy escort corridor slug redirects on the plural corridor route", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual(
      expect.objectContaining({
        source: "/escort/corridor/:path*",
        destination: "/corridors/:path*",
        permanent: true,
      }),
    );
  });

  it("does not broadly redirect all united-states directory slugs", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).not.toContainEqual(
      expect.objectContaining({
        source: "/directory/united-states/:state",
      }),
    );
    expect(redirects).toContainEqual(
      expect.objectContaining({
        source: "/directory/united-states/texas",
        destination: "/directory/us/tx",
      }),
    );
  });
});
