const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function generateAssets() {
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  const svgContent = fs.readFileSync(path.join(__dirname, 'public/brand/svg/logo-mark.svg'), 'utf8');

  // 1. Generate icon-background.png (1024x1024 solid dark #000000 or #121212)
  // Let's use #0b0b0c to match standard app background or #000000. Let's use pure #000000 for standard icon background.
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 18, g: 18, b: 18, alpha: 1 } // #121212
    }
  })
    .png()
    .toFile(path.join(assetsDir, 'icon-background.png'));

  // 2. Generate icon-foreground.png (1024x1024 with SVG scaled down to fit within inner ~66%)
  // SVG natural size is 100x100. We want it to be about 600x600 in the center.
  // Actually, adaptive icons are 108dp with a 72dp safe zone. 
  // 1024 * (72/108) = 682. So 600 is very safe.
  const svgBuffer = Buffer.from(svgContent);
  
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(600, 600).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(assetsDir, 'icon-foreground.png'));

  // 3. Generate icon-only.png (same as foreground just to be safe for "@capacitor/assets")
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(600, 600).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(assetsDir, 'icon-only.png'));

  // 4. Generate icon.png (Fallback, standard iOS/Android icon, full 1024x1024 with solid background + logo)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 18, g: 18, b: 18, alpha: 1 } // #121212
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(700, 700).toBuffer(), // Slightly larger for iOS since it doesn't mask as much
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

// 5. Generate splash.png
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 18, g: 18, b: 18, alpha: 1 } // #121212
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(800, 800).toBuffer(), 
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
    
// 6. Generate splash-dark.png (optional but good idea)
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 18, g: 18, b: 18, alpha: 1 } // #121212
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(800, 800).toBuffer(), 
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(assetsDir, 'splash-dark.png'));

  console.log('✅ Generated assets successfully in ./assets/');
}

generateAssets().catch(console.error);
