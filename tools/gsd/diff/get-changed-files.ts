import { changedFilesSince, mergeBase } from "../shared/git";

export function getChangedFiles(baseBranch = "origin/main") {
  const base = mergeBase(baseBranch, "HEAD");
  const changedFiles = changedFilesSince(base, "HEAD");

  return {
    baseRef: baseBranch,
    mergeBase: base,
    changedFiles,
  };
}
