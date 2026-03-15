// scripts/generate-icons.mjs
// Generate all PWA icon sizes from the 1024px master
import { readFileSync, writeFileSync } from 'fs';

const SIZES = [512, 256, 192, 128, 64, 32];
const SOURCE = 'public/icons/app/icon-1024.png';

async function main() {
    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch {
        console.error('sharp not installed. Run: npm install sharp');
        process.exit(1);
    }

    const buffer = readFileSync(SOURCE);

    for (const size of SIZES) {
        const outPath = `public/icons/app/icon-${size}.png`;
        await sharp(buffer)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 10, g: 10, b: 15, alpha: 1 },
            })
            .png({ quality: 95, compressionLevel: 9 })
            .toFile(outPath);
        console.log(`✓ ${outPath} (${size}x${size})`);
    }

    // Also generate favicon.ico as 32px PNG
    await sharp(buffer)
        .resize(32, 32, {
            fit: 'contain',
            background: { r: 10, g: 10, b: 15, alpha: 1 },
        })
        .png()
        .toFile('public/favicon.png');
    console.log('✓ public/favicon.png (32x32)');

    // Generate apple-touch-icon (180x180)
    await sharp(buffer)
        .resize(180, 180, {
            fit: 'contain',
            background: { r: 10, g: 10, b: 15, alpha: 1 },
        })
        .png({ quality: 95 })
        .toFile('public/apple-touch-icon.png');
    console.log('✓ public/apple-touch-icon.png (180x180)');

    console.log('\nAll icons generated! ✅');
}

main().catch(console.error);
