#!/usr/bin/env node
/**
 * Haul Command — Brand OS Asset Generator
 * Generates required icon sizes & OG images from master assets.
 *
 * Usage:
 *   node scripts/brand/generate-assets.mjs
 *
 * Notes:
 * - Uses Brand OS YAML at ./brand/brand-os.yaml
 * - Writes outputs under ./public/brand/generated
 * - Enforces: preserve aspect ratio, no stretch, transparent where needed
 */

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import sharp from "sharp";

const ROOT = process.cwd();

const BRAND_OS_PATH = path.join(ROOT, "brand", "brand-os.yaml");
const OUT_DIR = path.join(ROOT, "public", "brand", "generated");

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
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

function pickInputFileForRole(roleObj) {
    const files = roleObj?.files || {};
    const preferred = roleObj?.preferred_formats || [];
    const candidates = [];

    for (const fmt of preferred) {
        if (files[fmt]) candidates.push(files[fmt]);
    }
    // fallback order
    if (files.svg) candidates.push(files.svg);
    if (files.png) candidates.push(files.png);
    if (files.jpg) candidates.push(files.jpg);

    for (const c of candidates) {
        const disk = normalizePublicPath(c);
        if (disk && exists(disk)) return disk;
    }
    return null;
}

async function writePngSquare({ inputPath, outputPath, size, transparent = true }) {
    const bg = transparent
        ? { r: 0, g: 0, b: 0, alpha: 0 }
        : { r: 11, g: 11, b: 11, alpha: 1 };

    ensureDir(path.dirname(outputPath));

    await sharp(inputPath, { density: 300 })
        .resize(size, size, { fit: "contain", background: bg, withoutEnlargement: true })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(outputPath);
}

async function writePngRect({ inputPath, outputPath, width, height, transparent = false }) {
    const bg = transparent
        ? { r: 0, g: 0, b: 0, alpha: 0 }
        : { r: 11, g: 11, b: 11, alpha: 1 };

    ensureDir(path.dirname(outputPath));

    await sharp(inputPath, { density: 300 })
        .resize(width, height, { fit: "cover", background: bg, withoutEnlargement: true })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(outputPath);
}

function parseSizeToken(token) {
    if (typeof token === "number") return { kind: "square", size: token };
    if (typeof token === "string" && token.includes("x")) {
        const [w, h] = token.split("x").map((n) => parseInt(n, 10));
        if (!Number.isFinite(w) || !Number.isFinite(h))
            throw new Error(`Invalid size token: ${token}`);
        return { kind: "rect", width: w, height: h };
    }
    throw new Error(`Unsupported size token: ${token}`);
}

async function generateFromConfig(brandOS) {
    const pipeline = brandOS?.haul_command_brand_os?.export_pipeline;
    const roles = brandOS?.haul_command_brand_os?.asset_registry?.roles;

    if (!pipeline || !roles)
        throw new Error("Brand OS missing export_pipeline or asset_registry.roles.");

    ensureDir(OUT_DIR);

    const generators = pipeline.generators || {};
    const jobs = [];
    let totalOutputs = 0;

    for (const [genName, gen] of Object.entries(generators)) {
        const inputRoleName = gen.input_role;
        const roleObj = roles[inputRoleName];
        if (!roleObj)
            throw new Error(`Generator ${genName} references missing role: ${inputRoleName}`);

        const inputFile = pickInputFileForRole(roleObj);
        if (!inputFile) {
            console.warn(`  ⚠ Skipping generator '${genName}': no input file found for role '${inputRoleName}'`);
            continue;
        }

        console.log(`  📦 ${genName} ← ${path.basename(inputFile)}`);

        for (const out of gen.outputs || []) {
            const template = out.path_template;
            const fixedPath = out.path;
            const sizes = out.sizes || [];

            for (const s of sizes) {
                const sizeSpec = parseSizeToken(s);
                let outPath;

                if (template) {
                    outPath = template.replace("{size}", String(s));
                } else if (fixedPath) {
                    outPath = fixedPath;
                } else {
                    throw new Error(`Generator '${genName}' output missing path or path_template.`);
                }

                const diskOut = normalizePublicPath(
                    outPath.startsWith("/public/") ? outPath : `/public${outPath}`
                );

                if (sizeSpec.kind === "square") {
                    const transparent = genName !== "og_images";
                    jobs.push({
                        name: `${genName}/${s}`,
                        fn: () =>
                            writePngSquare({
                                inputPath: inputFile,
                                outputPath: diskOut,
                                size: sizeSpec.size,
                                transparent,
                            }),
                    });
                } else {
                    jobs.push({
                        name: `${genName}/${s}`,
                        fn: () =>
                            writePngRect({
                                inputPath: inputFile,
                                outputPath: diskOut,
                                width: sizeSpec.width,
                                height: sizeSpec.height,
                                transparent: false,
                            }),
                    });
                }
                totalOutputs++;
            }
        }
    }

    // Execute sequentially to avoid memory spikes
    for (const job of jobs) {
        await job.fn();
        console.log(`    ✓ ${job.name}`);
    }

    return totalOutputs;
}

async function main() {
    console.log("[brand:generate] Haul Command Brand OS Asset Generator\n");

    if (!exists(BRAND_OS_PATH)) {
        console.error(`  ✗ Missing Brand OS YAML at: ${BRAND_OS_PATH}`);
        process.exit(1);
    }

    const brandOS = readYaml(BRAND_OS_PATH);

    // Preflight: warn about missing master roles
    const roles = brandOS?.haul_command_brand_os?.asset_registry?.roles || {};
    const missing = [];
    for (const [roleName, roleObj] of Object.entries(roles)) {
        const input = pickInputFileForRole(roleObj);
        if (!input) missing.push(roleName);
    }
    if (missing.length) {
        console.warn(
            `  ⚠ Warning: some roles have no resolvable input: ${missing.join(", ")}\n`
        );
    }

    const count = await generateFromConfig(brandOS);

    console.log(`\n[brand:generate] ✅ Done — ${count} assets written to: ${OUT_DIR}`);
}

main().catch((err) => {
    console.error("[brand:generate] ✗ Failed:", err);
    process.exit(1);
});
