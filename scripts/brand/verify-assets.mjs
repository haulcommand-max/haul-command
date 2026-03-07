#!/usr/bin/env node
/**
 * Haul Command — Brand OS Asset Verifier
 * Verifies required generated outputs exist and meet basic constraints:
 * - file exists
 * - dimensions match expected sizes
 * - icons have alpha channel when required
 * - favicon candidates are likely crisp (simple heuristic)
 *
 * Usage:
 *   node scripts/brand/verify-assets.mjs
 */

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import sharp from "sharp";

const ROOT = process.cwd();
const BRAND_OS_PATH = path.join(ROOT, "brand", "brand-os.yaml");

const exists = (p) => fs.existsSync(p);

function readYaml(filePath) {
    const raw = fs.readFileSync(filePath, "utf8");
    return yaml.load(raw);
}

function normalizePublicPath(p) {
    if (!p) return null;
    if (p.startsWith("/public/")) return path.join(ROOT, p.slice(1));
    if (p.startsWith("/brand/")) return path.join(ROOT, "public", p);
    if (p.startsWith("/")) return path.join(ROOT, p.slice(1));
    return path.join(ROOT, p);
}

function parseSizeToken(token) {
    if (typeof token === "number") return { kind: "square", size: token };
    if (typeof token === "string" && token.includes("x")) {
        const [w, h] = token.split("x").map((n) => parseInt(n, 10));
        return { kind: "rect", width: w, height: h };
    }
    throw new Error(`Unsupported size token: ${token}`);
}

async function verifyImage(filePath, expected) {
    const meta = await sharp(filePath).metadata();

    if (expected.kind === "square") {
        if (meta.width !== expected.size || meta.height !== expected.size) {
            return `bad_dimensions expected ${expected.size}x${expected.size} got ${meta.width}x${meta.height}`;
        }
    } else {
        if (meta.width !== expected.width || meta.height !== expected.height) {
            return `bad_dimensions expected ${expected.width}x${expected.height} got ${meta.width}x${meta.height}`;
        }
    }
    return null;
}

async function hasAlpha(filePath) {
    const meta = await sharp(filePath).metadata();
    return Boolean(meta.hasAlpha);
}

function isLikelyIconSurface(generatorName) {
    return !["og_images"].includes(generatorName);
}

async function main() {
    console.log("[brand:verify] Haul Command Brand OS Asset Verifier\n");

    if (!exists(BRAND_OS_PATH)) {
        console.error(`  ✗ Missing Brand OS YAML at: ${BRAND_OS_PATH}`);
        process.exit(1);
    }

    const brandOS = readYaml(BRAND_OS_PATH);
    const pipeline = brandOS?.haul_command_brand_os?.export_pipeline;
    if (!pipeline) {
        console.error("  ✗ Missing export_pipeline in Brand OS YAML.");
        process.exit(1);
    }

    const generators = pipeline.generators || {};
    const failures = [];
    const warnings = [];
    let checked = 0;

    for (const [genName, gen] of Object.entries(generators)) {
        for (const out of gen.outputs || []) {
            const template = out.path_template;
            const fixedPath = out.path;
            const sizes = out.sizes || [];

            for (const s of sizes) {
                const sizeSpec = parseSizeToken(s);
                let outPath;
                if (template) outPath = template.replace("{size}", String(s));
                else if (fixedPath) outPath = fixedPath;
                else {
                    failures.push(`Generator '${genName}' output missing path/path_template.`);
                    continue;
                }

                const disk = normalizePublicPath(
                    outPath.startsWith("/public/") ? outPath : `/public${outPath}`
                );
                if (!disk || !exists(disk)) {
                    failures.push(`Missing output: ${outPath}`);
                    continue;
                }

                const dimErr = await verifyImage(disk, sizeSpec);
                if (dimErr) failures.push(`Bad output: ${outPath} (${dimErr})`);

                // alpha requirement for icons
                if (isLikelyIconSurface(genName)) {
                    const alpha = await hasAlpha(disk);
                    if (!alpha) failures.push(`Icon missing alpha channel: ${outPath}`);
                }

                // favicon crispness heuristic
                if (genName === "favicon" && sizeSpec.kind === "square" && sizeSpec.size === 16) {
                    const stat = fs.statSync(disk);
                    if (stat.size < 200)
                        warnings.push(`favicon-16 seems extremely small (${stat.size} bytes): ${outPath}`);
                    if (stat.size > 30000)
                        warnings.push(`favicon-16 seems unusually large (${stat.size} bytes): ${outPath}`);
                }

                checked++;
            }
        }
    }

    if (warnings.length) {
        console.warn("  ⚠ Warnings:");
        for (const w of warnings) console.warn(`    - ${w}`);
        console.log();
    }

    if (failures.length) {
        console.error("  ✗ FAIL:");
        for (const f of failures) console.error(`    - ${f}`);
        process.exit(1);
    }

    console.log(`  ✓ OK — ${checked} assets verified, all match constraints.`);
}

main().catch((err) => {
    console.error("[brand:verify] ✗ Failed:", err);
    process.exit(1);
});
