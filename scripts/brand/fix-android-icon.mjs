import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_SVG = path.join(ROOT, "public", "brand", "logo-mark.svg");
const ASSETS_DIR = path.join(ROOT, "assets");

async function generate() {
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    console.log("Reading from:", SRC_SVG);

    // 1. Generate icon-background.png (1024x1024 flat color #07090D)
    await sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 7, g: 9, b: 13, alpha: 1 } // #07090D
        }
    })
    .png()
    .toFile(path.join(ASSETS_DIR, "icon-background.png"));

    // 2. Generate icon-foreground.png (1024x1024 transparent, logo scaled to 600x600 in center)
    // The safe zone is radius 33% of icon size, which is a circle of diameter 67%. So 600px is safe.
    const logoBuffer = await sharp(SRC_SVG)
        .resize(600, 600, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

    await sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, "icon-foreground.png"));

    // 3. Generate icon.png (flat combined version for fallback and iOS)
    await sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 7, g: 9, b: 13, alpha: 1 }
        }
    })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, "icon.png"));

    console.log("Generated perfect adaptive icons in /assets!");
}

generate().catch(e => {
    console.error("Error:", e);
    process.exit(1);
});
