import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("agent job endpoint boundary", () => {
  it("requires internal authorization before queue writes or worker execution", () => {
    const route = read("app/api/agent/job/route.ts");
    const postBody = route.slice(route.indexOf("export async function POST"));

    expect(route).toContain('import { requireInternalRequest } from "@/lib/security/internal-request-auth"');
    expect(postBody).toContain("const authFailure = requireInternalRequest(request)");
    expect(postBody).toContain("if (authFailure) return authFailure");
    expect(postBody.indexOf("const authFailure = requireInternalRequest(request)")).toBeLessThan(
      postBody.indexOf("request.json()"),
    );
    expect(postBody.indexOf("const authFailure = requireInternalRequest(request)")).toBeLessThan(
      postBody.indexOf('.from("hc_agent_jobs")'),
    );
    expect(postBody.indexOf("const authFailure = requireInternalRequest(request)")).toBeLessThan(
      postBody.indexOf("processAgentQueue()"),
    );
  });
});
