import { execSync } from "node:child_process";

export function runGit(command: string): string {
  return execSync(command, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();
}

export function currentHeadSha(): string {
  return runGit("git rev-parse HEAD");
}

export function mergeBase(baseRef: string, headRef = "HEAD"): string {
  return runGit(`git merge-base ${baseRef} ${headRef}`);
}

export function changedFilesSince(baseRef: string, headRef = "HEAD"): string[] {
  const output = runGit(`git diff --name-only ${baseRef}...${headRef}`);
  return output ? output.split("\n").map((x) => x.trim()).filter(Boolean) : [];
}

export function fileContentAtRef(ref: string, filePath: string): string | null {
  try {
    return runGit(`git show ${ref}:${filePath}`);
  } catch {
    return null;
  }
}

export function refExists(ref: string): boolean {
  try {
    runGit(`git rev-parse --verify ${ref}`);
    return true;
  } catch {
    return false;
  }
}
