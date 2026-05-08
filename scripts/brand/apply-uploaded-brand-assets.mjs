#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const DOWNLOADS = "C:/Users/PC User/Documents/Downloads";
const BRAND_SHEET = path.join(DOWNLOADS, "logo.png");
const ROUND_BADGE = path.join(DOWNLOADS, "ChatGPT Image May 1, 2026, 01_16_28 PM (5).png");

const out = (...parts) => path.join(ROOT, ...parts);
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

async function write(filePath, pipeline) {
  ensureDir(filePath);
  await pipeline.toFile(filePath);
  console.log(`wrote ${path.relative(ROOT, filePath)}`);
}

function brandSheet() {
  return sharp(BRAND_SHEET, { limitInputPixels: false });
}

function roundBadge() {
  return sharp(ROUND_BADGE, { limitInputPixels: false });
}

async function writeContain(input, filePath, width, height, background = { r: 5, g: 5, b: 5, alpha: 1 }) {
  await write(
    filePath,
    input
      .resize(width, height, {
        fit: "contain",
        background,
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true }),
  );
}

async function writeJpeg(input, filePath, width, height) {
  await write(
    filePath,
    input
      .resize(width, height, {
        fit: "cover",
        position: "center",
        kernel: sharp.kernel.lanczos3,
      })
      .jpeg({ quality: 88, mozjpeg: true }),
  );
}

async function main() {
  if (!fs.existsSync(BRAND_SHEET)) throw new Error(`Missing uploaded brand sheet: ${BRAND_SHEET}`);
  if (!fs.existsSync(ROUND_BADGE)) throw new Error(`Missing uploaded round logo: ${ROUND_BADGE}`);

  // Website header lockup: crop only the logo slab, not the label text on the sheet.
  const headerLockup = brandSheet().extract({ left: 24, top: 178, width: 1317, height: 520 });
  await writeContain(headerLockup.clone(), out("public", "brand", "logo-header-full.png"), 900, 260, {
    r: 0,
    g: 0,
    b: 0,
    alpha: 0,
  });
  await writeJpeg(headerLockup.clone(), out("public", "brand", "logo-header-full.jpg"), 1200, 420);

  // Native/PWA icon: crop the rounded-square phone icon from the sheet.
  const appIcon = brandSheet().extract({ left: 190, top: 806, width: 420, height: 420 });
  await writeContain(appIcon.clone(), out("public", "brand", "logo-square.png"), 512, 512);
  await writeContain(appIcon.clone(), out("public", "brand", "generated", "pwa-icon-192.png"), 192, 192);
  await writeContain(appIcon.clone(), out("public", "brand", "generated", "pwa-icon-512.png"), 512, 512);
  await writeContain(appIcon.clone(), out("public", "brand", "generated", "pwa-maskable-192.png"), 192, 192);
  await writeContain(appIcon.clone(), out("public", "brand", "generated", "pwa-maskable-512.png"), 512, 512);
  await writeContain(appIcon.clone(), out("public", "icons", "app", "icon-128.png"), 128, 128);
  await writeContain(appIcon.clone(), out("public", "icons", "app", "icon-192.png"), 192, 192);
  await writeContain(appIcon.clone(), out("public", "icons", "app", "icon-256.png"), 256, 256);
  await writeContain(appIcon.clone(), out("public", "icons", "app", "icon-512.png"), 512, 512);
  await writeContain(appIcon.clone(), out("app", "icon.png"), 512, 512);
  await writeContain(appIcon.clone(), out("app", "apple-icon.png"), 180, 180);

  for (const size of [29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]) {
    await writeContain(appIcon.clone(), out("public", "brand", "generated", `ios-appicon-${size}.png`), size, size);
  }
  for (const size of [48, 72, 96, 144, 192, 512]) {
    await writeContain(appIcon.clone(), out("public", "brand", "generated", `android-icon-${size}.png`), size, size);
  }

  // Favicon and compact mark: use the symbol-only favicon crop to stay legible at 16/32/48.
  const faviconMark = brandSheet().extract({ left: 922, top: 820, width: 184, height: 184 });
  await writeContain(faviconMark.clone(), out("public", "brand", "favicon.png"), 48, 48, {
    r: 0,
    g: 0,
    b: 0,
    alpha: 0,
  });
  for (const size of [16, 32, 48]) {
    await writeContain(faviconMark.clone(), out("public", "brand", "generated", `favicon-${size}.png`), size, size, {
      r: 0,
      g: 0,
      b: 0,
      alpha: 0,
    });
  }

  // Social/round source: use the Facebook-style badge the user prefers.
  await writeContain(roundBadge().clone(), out("public", "brand", "haul-command-logo-real.png"), 1024, 1024);
  await writeContain(roundBadge().clone(), out("public", "brand", "logo-round.png"), 512, 512);
  await writeJpeg(roundBadge().clone(), out("public", "brand", "og.png"), 1200, 630);
  await writeJpeg(roundBadge().clone(), out("public", "brand", "generated", "og-1200x630.png"), 1200, 630);

  // Native Capacitor Android launcher icons.
  const androidSizes = {
    "mipmap-ldpi": 36,
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
  };
  for (const [folder, size] of Object.entries(androidSizes)) {
    const base = out("android", "app", "src", "main", "res", folder);
    await writeContain(appIcon.clone(), path.join(base, "ic_launcher.png"), size, size);
    await writeContain(appIcon.clone(), path.join(base, "ic_launcher_round.png"), size, size);
    await writeContain(appIcon.clone(), path.join(base, "ic_launcher_foreground.png"), size, size);
  }

  // Native Capacitor iOS app icon currently references one 1024 file.
  await writeContain(appIcon.clone(), out("ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png"), 1024, 1024);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
