import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const BRAND_DIR = path.join(ROOT, "brand");
const PUBLIC_BRAND_DIR = path.join(ROOT, "public", "brand");
const ICONS_DIR = path.join(ROOT, "public", "icons");

const SRC_SVG = path.join(BRAND_DIR, "logo-source.svg");
const SRC_PNG = path.join(BRAND_DIR, "logo-source.png");

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function fileExists(p) {
    try { fs.accessSync(p); return true; } catch { return false; }
}

function pickSource() {
    if (fileExists(SRC_SVG)) return SRC_SVG;
    if (fileExists(SRC_PNG)) return SRC_PNG;
    throw new Error(
        `Missing logo source. Put ONE of these in place:\n- ${SRC_SVG}\n- ${SRC_PNG}`
    );
}

async function writePng(inputPath, outPath, size) {
    await sharp(inputPath, { density: 300 })
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(outPath);
}

async function main() {
    ensureDir(PUBLIC_BRAND_DIR);
    ensureDir(ICONS_DIR);

    const src = pickSource();
    console.log("Using source:", src);

    // 1) Copy canonical logo into public/brand
    if (src.endsWith(".svg")) {
        fs.copyFileSync(src, path.join(PUBLIC_BRAND_DIR, "logo.svg"));
    } else {
        fs.copyFileSync(src, path.join(PUBLIC_BRAND_DIR, "logo.png"));
    }

    // 2) Master app icon (1024 — iOS/Android build tooling)
    await writePng(src, path.join(ICONS_DIR, "app-icon-1024.png"), 1024);

    // 3) PWA icons
    await writePng(src, path.join(ICONS_DIR, "pwa-192.png"), 192);
    await writePng(src, path.join(ICONS_DIR, "pwa-512.png"), 512);

    // 4) Apple touch icon
    await writePng(src, path.join(ICONS_DIR, "apple-touch-icon.png"), 180);

    // 5) Favicons
    await writePng(src, path.join(ICONS_DIR, "favicon-16.png"), 16);
    await writePng(src, path.join(ICONS_DIR, "favicon-32.png"), 32);
    await writePng(src, path.join(ICONS_DIR, "favicon-48.png"), 48);

    console.log("✅ Generated icons into:", ICONS_DIR);
    console.log("✅ Canonical logo copied into:", PUBLIC_BRAND_DIR);
}

main().catch((err) => {
    console.error("❌ Icon generation failed:", err.message);
    process.exit(1);
});
