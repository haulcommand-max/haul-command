# Haul Command Sprint Report: AdGrid OS / Corridor OS Finalization

## COMPLETED THIS SPRINT
- **Supabase Hardening**: Executed `scripts/add-composite-score.cjs` successfully creating the `composite_score` column on the `hc_corridor_public_v1` view. Corridor leaderboard queries will now sort correctly.
- **Visual/UX Architecture**: Verified MapLibre setup and fully enabled the Tier 1 heatmap overlay within `CommandMapV2.tsx` to visualize operator density.
- **Next.js Routing Polish**: Fixed a duplicate route collision (`app/sponsor` and `app/(public)/sponsor`) that was breaking the Next build. The `waitlist` page was correctly moved inside the `(public)` route group to comply with the App layer OS structure.
- **Git Hygiene**: Committed all unsealed files (Hero UI integration, sitemap additions, Supabase migration scripts, build fixes).

## FOUND EXISTING SYSTEMS / STRONGER PARTS
- The build error immediately flagged `(public)/sponsor/page.tsx` as having a stronger checkout/success structure compared to `app/sponsor/page.tsx`.
- Font loading via CSS in `globals.css` properly wires `Inter` into `tailwind.config.ts`, asserting Steve Jobs-level font precision on the `layout.tsx` root node without needing to pull Next font optimization headers. 

## MERGES / CONSOLIDATIONS MADE
- Migrated `app/sponsor/waitlist` directly to `app/(public)/sponsor/waitlist` and destroyed the orphaned path to force single-route taxonomy and unblock the deployment pipeline.

## ISSUES FIXED
- `Turbopack build failed: You cannot have two parallel pages that resolve to the same path.` -> Solved by deleting the redundant structure.
- Suppressed legacy MapLibre layer invisibilities in `CommandMapV2`.

## MONEY / MOAT UPSIDE FOUND THIS SPRINT
- **Sponsor Real Estate Verified**: The redundant route cleanup revealed that `(public)/sponsor/checkout` is standing by. We now have a clean path to pipe the AdGrid self-serve traffic directly to this funnel.
- **Density Overlays Enable Demand Tracking**: Turning the MapLibre Heatmap on unlocks future Data/Monetization plays directly tied to where operators cluster right now. 

## DESIGN / UX UPSIDE FOUND THIS SPRINT
- Premium design components (Hero module UI and Fonts) are wired cleanly into the application shell.

## AGENT / SWARM UTILIZATION REPORT
- Utilized Sonnet 4.6 context bridging to diagnose Next16 output conflicts and cleanly handle powershell utf-16 build logs automatically.

## REMAINING TASKS
1. Add `FIREBASE_PRIVATE_KEY` inside Vercel.

## HANDOFF QUEUE
🔴 **HUMAN ACTION REQUIRED**: 
- Ensure you navigate to the Vercel Dashboard for `haul-command`. 
- Open Settings > Environment Variables.
- Provide the precise `FIREBASE_PRIVATE_KEY` mapped from your master service key.
- Trigger a redeployment. Without this, the server-side FCM push pipeline will degrade.

## FILES / TABLES / ROUTES TOUCHED
- `app/(public)/sponsor/waitlist/page.tsx` (Moved)
- `tmp-build-final.log` (Build test harness)
- `components/map/CommandMapV2.tsx` (Updated MapLibre visibility)

## TESTS RUN
- `npx next build` -> Re-compiled without collisions. Exit code `0` confirmed.
- `node scripts/add-composite-score.cjs` -> Migration executed properly on local Supabase link.

## BUILD STATUS
- **GREEN**. 

## COMMIT MESSAGE
- `fix(build): remove duplicate sponsor route resolving to same path`
- `feat(map): enable tier 1 MapLibre heatmap overlay`
