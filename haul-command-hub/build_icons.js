const sharp = require('sharp');

async function buildIcons() {
  // 1. the main transparent logo for the website nav
  // We'll rename it to logo.png and logo-full.png
  await sharp('public/logo-transparent.png').toFile('public/logo-final.png');

  // 2. The mobile app icon. We'll composite the transparent logo (icon-transparent.png)
  // onto a solid very dark background, so there are definitively NO "white sides".
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 10, b: 12, alpha: 1 } // very dark slate black
    }
  })
  .composite([
    { 
      input: 'public/icon-transparent.png', 
      gravity: 'center' 
      // let's resize it down slightly so the gold badge breathes, looking very premium
      // wait, sharp composite doesn't have inline resize easily unless passed as buffer
    }
  ])
  .png()
  .toFile('public/icon-final.png');

  // To properly resize before compositing:
  const resizedBadge = await sharp('public/icon-transparent.png')
    .resize(360, 360, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
    .toBuffer();

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#0a0a0c' }
  })
  .composite([{ input: resizedBadge, gravity: 'center' }])
  .toFile('public/icon.png');

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#0a0a0c' }
  })
  .composite([{ input: resizedBadge, gravity: 'center' }])
  .toFile('public/apple-icon.png');

  // Favicon (transparent)
  await sharp('public/icon-transparent.png')
    .resize(32, 32)
    .toFile('public/favicon.ico');

  // Overwrite the site logos
  await sharp('public/logo-transparent.png').toFile('public/logo.png');
  await sharp('public/logo-transparent.png').toFile('public/logo-full.png');

  console.log("All premium transparent/dark assets generated!");
}

buildIcons();
