#!/usr/bin/env node
/**
 * PATCH-009: Facebook Cover Workflow — two export sizes.
 *
 * 1. Safe-area version (content guaranteed visible)
 *    - 820x312 with 60px horizontal + 30px vertical padding
 *    - "safe zone" = 700x252
 *
 * 2. Full-bleed version (edge-to-edge)
 *    - 820x312, no padding
 *
 * 3. Overlay guide PNG (for internal design use)
 *    - Shows safe zone boundary lines
 *
 * Requires: sharp
 * Usage: node scripts/brand/facebook-cover.mjs
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = 'public/brand/generated/social';
const WIDTH = 820;
const HEIGHT = 312;
const SAFE_PAD_X = 60;
const SAFE_PAD_Y = 30;

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp is required. Install with: npm i sharp');
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // Base brand color background
  const bg = { r: 11, g: 11, b: 12 }; // --hc-bg
  const gold = { r: 198, g: 146, b: 58 }; // --hc-gold-500

  // 1. Full-bleed version
  const fullBleed = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: bg },
  }).png();
  await fullBleed.toFile(join(OUT_DIR, 'fb-cover-full-bleed.png'));
  console.log('Created: fb-cover-full-bleed.png (820x312)');

  // 2. Safe-area version (with visual safe zone marker)
  const safeArea = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: bg },
  });

  // Create safe zone overlay with gold border lines
  const safeOverlay = Buffer.from(
    `<svg width="${WIDTH}" height="${HEIGHT}">
      <rect x="${SAFE_PAD_X}" y="${SAFE_PAD_Y}"
            width="${WIDTH - 2 * SAFE_PAD_X}" height="${HEIGHT - 2 * SAFE_PAD_Y}"
            fill="none" stroke="rgba(198,146,58,0.3)" stroke-width="1" stroke-dasharray="8,4"/>
      <text x="${WIDTH / 2}" y="${HEIGHT / 2}" text-anchor="middle" fill="rgba(198,146,58,0.5)"
            font-family="sans-serif" font-size="14" font-weight="600">
        Safe Zone (${WIDTH - 2 * SAFE_PAD_X}x${HEIGHT - 2 * SAFE_PAD_Y})
      </text>
    </svg>`
  );

  await safeArea
    .composite([{ input: safeOverlay, top: 0, left: 0 }])
    .png()
    .toFile(join(OUT_DIR, 'fb-cover-safe-area.png'));
  console.log('Created: fb-cover-safe-area.png (820x312, safe zone marked)');

  // 3. Overlay guide (design reference)
  const guide = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { ...bg, alpha: 200 } },
  });

  const guideOverlay = Buffer.from(
    `<svg width="${WIDTH}" height="${HEIGHT}">
      <!-- Safe zone -->
      <rect x="${SAFE_PAD_X}" y="${SAFE_PAD_Y}"
            width="${WIDTH - 2 * SAFE_PAD_X}" height="${HEIGHT - 2 * SAFE_PAD_Y}"
            fill="none" stroke="#22C55E" stroke-width="2"/>
      <!-- Danger zone -->
      <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}"
            fill="none" stroke="#EF4444" stroke-width="2"/>
      <!-- Labels -->
      <text x="10" y="20" fill="#EF4444" font-family="monospace" font-size="11" font-weight="700">DANGER ZONE (clips on mobile)</text>
      <text x="${SAFE_PAD_X + 4}" y="${SAFE_PAD_Y + 16}" fill="#22C55E" font-family="monospace" font-size="11" font-weight="700">SAFE ZONE — content visible on all devices</text>
      <!-- Cross-hairs -->
      <line x1="${WIDTH / 2}" y1="0" x2="${WIDTH / 2}" y2="${HEIGHT}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="4,4"/>
      <line x1="0" y1="${HEIGHT / 2}" x2="${WIDTH}" y2="${HEIGHT / 2}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="4,4"/>
    </svg>`
  );

  await guide
    .composite([{ input: guideOverlay, top: 0, left: 0 }])
    .png()
    .toFile(join(OUT_DIR, 'fb-cover-overlay-guide.png'));
  console.log('Created: fb-cover-overlay-guide.png (design reference)');

  console.log('\nDone. Files in:', OUT_DIR);
}

main().catch(console.error);
