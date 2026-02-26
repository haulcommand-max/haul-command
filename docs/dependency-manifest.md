# Dependency Manifest

## Objective
Confirm every GitHub tool/repo referenced in this project is installed and working.

## Audit Summary
- **Count Total:** 0 direct GitHub-hosted dependencies
- **Count Installed:** 0
- **Count Missing:** 0
- **Count Failing:** 0
- **Exact Fix Commands:** N/A

## Detailed Findings

After an exhaustive recursive scan of the entire repository (including `package.json`, `package-lock.json`, `supabase/functions/**/*`, and configuration files), **no direct GitHub repositories or tools are referenced as dependencies.** 

The project relies entirely on officially published, version-pinned artifacts from the standard package registries (NPM for Node.js frontend, and `esm.sh` / `deno.land/std` for Supabase Edge Functions). 

While `package-lock.json` contains `github.com` URLs, these are exclusively funding sponsor links or metadata repository links for NPM packages (e.g., `react`, `tailwindcss`, `cheerio`), not direct Git installations.

| Name | Source URL | Installed Version / Commit | Install Command | Status (Pass/Fail) |
|---|---|---|---|---|
| *None* | *N/A* | *N/A* | *N/A* | **PASS** (Clean) |

*All standard NPM packages were confirmed installed successfully via `npm ls` and `npm install`.*
