// scripts/fix-use-client.mjs — adds 'use client' to all CB violations, then deletes itself
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'components/admin/AdminSidebar.tsx',
  'components/ai-search/AnswerBlock.tsx',
  'components/comms/ChannelHeader.tsx',
  'components/comms/CommsFAB.tsx',
  'components/comms/CommsProvider.tsx',
  'components/comms/EmergencyBroadcast.tsx',
  'components/comms/hooks/useAudioDevice.ts',
  'components/comms/hooks/useChannel.ts',
  'components/comms/hooks/useCommsStatus.ts',
  'components/comms/hooks/usePaidFeatures.ts',
  'components/comms/hooks/usePTT.ts',
  'components/comms/hooks/useQuickCalls.ts',
  'components/comms/QuickCallBar.tsx',
  'components/comms/TalkButton.tsx',
  'components/directory/BrowseByRegion.tsx',
  'components/directory/BrowseRegions2026.tsx',
  'components/directory/CorridorStrip.tsx',
  'components/directory/DirectoryPopularSearches.tsx',
  'components/directory/DirectorySortControls.tsx',
  'components/directory/DriverEmbedSnippet.tsx',
  'components/directory/OperatorTrustCard.tsx',
  'components/directory/StickyClaimBar.tsx',
  'components/earnings/EarningsExport.tsx',
  'components/earnings/EarningsSparkline.tsx',
  'components/glossary/AudioPronunciation.tsx',
  'components/gps/PilotCarNavigation.tsx',
  'components/intelligence/HotZonesNearYou.tsx',
  'components/intelligence/OperatorEarningsCard.tsx',
  'components/map/EscortSupplyRadar.tsx',
  'components/map/LiveOperatorMap.tsx',
  'components/maps/LoadboardMap.tsx',
  'components/mobile/SwipeableRunCard.tsx',
  'components/motive/AdminMotiveStats.tsx',
  'components/motive/FleetIntelligencePanel.tsx',
  'components/motive/MotiveOnboardingPrompt.tsx',
  'components/offline/ConnectionStatusBar.tsx',
  'components/rates/PostingCoachPanel.tsx',
  'components/swarm/SwarmActivityFeed.tsx',
  'components/swarm/SwarmScoreboard.tsx',
  'components/swarm/SwarmTriggerPixel.tsx',
  'app/(app)/profile/page.tsx',
  'app/admin/content/videos/page.tsx',
];

let fixed = 0;
let skipped = 0;

for (const rel of FILES) {
  const full = join(ROOT, rel);
  const content = readFileSync(full, 'utf8');
  // Double-check it doesn't already have it
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
    console.log(`  SKIP (already has): ${rel}`);
    skipped++;
    continue;
  }
  writeFileSync(full, `'use client';\n${content}`);
  console.log(`  ✅ Fixed: ${rel}`);
  fixed++;
}

console.log(`\nDone: ${fixed} fixed, ${skipped} already correct.`);
