/**
 * SVG Export Utility — Generates raw .svg files from icon definitions.
 * Run: node --import tsx components/icons/svg-export.ts
 * Or: npx tsx components/icons/svg-export.ts
 */

import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ALL_ICON_DEFS } from './HcIcons';
import { HcIconBase } from './HcIconBase';
import type { HcVariant } from './types';
import * as fs from 'fs';
import * as path from 'path';

const VARIANTS: HcVariant[] = ['outline', 'filled', 'duotone', 'active_selected', 'map_pin', 'badge_mini', 'app_nav', 'empty_state'];

const OUT_DIR = path.join(process.cwd(), 'public', 'icons', 'hc');

function exportAllSvgs() {
    // Ensure output directory
    fs.mkdirSync(OUT_DIR, { recursive: true });
    VARIANTS.forEach(v => fs.mkdirSync(path.join(OUT_DIR, v), { recursive: true }));

    let totalFiles = 0;

    for (const def of ALL_ICON_DEFS) {
        for (const variant of VARIANTS) {
            const el = React.createElement(HcIconBase, {
                paths: def.paths,
                primaryFill: def.primaryFill,
                size: 24,
                variant,
            });
            const svgString = renderToStaticMarkup(el);
            const filename = `hc-icon-${def.id}.svg`;
            const filepath = path.join(OUT_DIR, variant, filename);
            fs.writeFileSync(filepath, svgString, 'utf-8');
            totalFiles++;
        }
    }

    console.log(`✅ Exported ${totalFiles} SVG files (${ALL_ICON_DEFS.length} icons × ${VARIANTS.length} variants)`);
    console.log(`   Output: ${OUT_DIR}`);
}

exportAllSvgs();
