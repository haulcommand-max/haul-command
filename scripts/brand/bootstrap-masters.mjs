#!/usr/bin/env node
/**
 * Haul Command — Bootstrap Brand Masters
 * Creates placeholder PNG masters from existing SVGs so the full
 * Brand OS pipeline can run end-to-end.
 *
 * Run once: node scripts/brand/bootstrap-masters.mjs
 * Then run: npm run brand:build
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const BRAND_DIR = path.join(ROOT, "public", "brand");

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const exists = (p) => fs.existsSync(p);

async function createPngFromSvg(svgPath, outPath, size, opts = {}) {
    if (!exists(svgPath)) {
        console.warn(`  ⚠ SVG not found: ${svgPath}`);
        return false;
    }

    const bg = opts.opaque
        ? { r: 11, g: 11, b: 11, alpha: 1 }
        : { r: 0, g: 0, b: 0, alpha: 0 };

    ensureDir(path.dirname(outPath));

    if (opts.rect) {
        await sharp(svgPath, { density: 300 })
            .resize(opts.rect.width, opts.rect.height, {
                fit: "contain",
                background: bg,
            })
            .png({ compressionLevel: 9 })
            .toFile(outPath);
    } else {
        await sharp(svgPath, { density: 300 })
            .resize(size, size, { fit: "contain", background: bg })
            .png({ compressionLevel: 9 })
            .toFile(outPath);
    }

    console.log(`  ✓ ${path.basename(outPath)}`);
    return true;
}

async function main() {
    console.log("[brand:bootstrap] Creating PNG masters from SVGs...\n");

    const markSvg = path.join(BRAND_DIR, "logo-mark.svg");
    const wordmarkSvg = path.join(BRAND_DIR, "logo.svg");
    const faviconSvg = path.join(BRAND_DIR, "favicon.svg");

    // badge_square: logo-square.png (512px from mark SVG)
    await createPngFromSvg(markSvg, path.join(BRAND_DIR, "logo-square.png"), 512);

    // badge_round: logo-round.png (512px from mark SVG)
    await createPngFromSvg(markSvg, path.join(BRAND_DIR, "logo-round.png"), 512);

    // primary_mark: logo-mark.png (512px from mark SVG)
    await createPngFromSvg(markSvg, path.join(BRAND_DIR, "logo-mark.png"), 512);

    // primary_wordmark: logo-wordmark.png (wide from wordmark SVG)
    await createPngFromSvg(wordmarkSvg, path.join(BRAND_DIR, "logo-wordmark.png"), 512);

    // favicon: favicon.png (from favicon SVG)
    await createPngFromSvg(faviconSvg, path.join(BRAND_DIR, "favicon.png"), 256);

    // og_master: og.png (1200x630 — mark centered on dark bg)
    await createPngFromSvg(markSvg, path.join(BRAND_DIR, "og.png"), null, {
        opaque: true,
        rect: { width: 1200, height: 630 },
    });

    // splash_master: splash.png (mark centered on dark bg)
    await createPngFromSvg(markSvg, path.join(BRAND_DIR, "splash.png"), null, {
        opaque: true,
        rect: { width: 1284, height: 2778 },
    });

    console.log(
        "\n[brand:bootstrap] ✅ Done. Now run: npm run brand:build"
    );
}

main().catch((err) => {
    console.error("[brand:bootstrap] ✗ Failed:", err);
    process.exit(1);
});
