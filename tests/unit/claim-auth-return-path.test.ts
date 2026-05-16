import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("claim auth return path preservation", () => {
  it("sends anonymous claim users through auth with the claim path in next", () => {
    const claimPage = read("app/claim/page.tsx");

    expect(claimPage).toContain("const claimPath = buildClaimPath(claimParams)");
    expect(claimPage).toContain("const nextParam = encodeURIComponent(claimPath)");
    expect(claimPage).toContain("href={`/auth/register?intent=claim&next=${nextParam}`}");
    expect(claimPage).toContain("href={`/login?next=${nextParam}`}");
  });

  it("lets login and registration honor next before the older return param", () => {
    const loginCard = read("components/auth/LoginCard.tsx");

    expect(loginCard).toContain("normalizeAuthReturnPath(searchParams.get('next') || searchParams.get('return'))");
    expect(loginCard).toContain("redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`");
    expect(loginCard).toContain("emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`");
    expect(loginCard).toContain("window.location.href = returnUrl");
  });

  it("rejects external or protocol-relative auth redirect targets", () => {
    const loginCard = read("components/auth/LoginCard.tsx");
    const callback = read("app/auth/callback/route.ts");

    expect(loginCard).toContain("!value.startsWith('/') || value.startsWith('//')");
    expect(callback).toContain("!value.startsWith(\"/\") || value.startsWith(\"//\")");
    expect(callback).toContain("normalizeAuthNextPath(requestUrl.searchParams.get(\"next\"))");
    expect(callback).toContain("NextResponse.redirect(new URL(next, requestUrl.origin))");
  });
});
