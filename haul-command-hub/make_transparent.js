const sharp = require('sharp');

async function processImage(inputFile, outputFile, isMobileIcon) {
  const { data, info } = await sharp(inputFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // The "rocky" background is generally dark or grayish.
    // Gold/yellow has high red and green, low blue relative to them.
    // Let's create a dynamic threshold.
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // If it's the mobile app icon, maybe the user just wants the logo with no background.
    // Or maybe a pure black background. The user said:
    // "Can we make it transparent? Not the mobile icon... wait, yeah let's make the mobile app..."
    // "what other options can we make for the mobile app icon"
    
    // We will make everything that is "background" transparent.
    // If luma is below a certain threshold, it's background. Let's make anything very dark or un-colorful transparent.
    // Gold is typically r > 100, g > 80, b < 100. Let's just use a luma and distance-to-black threshold.
    // The rock is also somewhat bright in places. So let's be careful.
    
    // A simple threshold: if the pixel is somewhat dark, fade its alpha.
    // Let's use an S-curve for alpha based on luma.
    const threshold = 40;
    if (luma < threshold && Math.abs(r-g) < 30) {
        data[i + 3] = 0; // completely transparent
    } else if (luma < 60 && Math.abs(r-g) < 20) {
        data[i + 3] = 0; 
    } else {
        // Smoothing the edges
        if (luma < 80 && Math.abs(r-g) < 30) {
             data[i + 3] = Math.max(0, luma * 2); 
        }
    }
    
    // Extra safety: The user image might have absolute black.
    if (r < 25 && g < 25 && b < 25) {
        data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toFile(outputFile);
  console.log(`Saved ${outputFile}`);
}

async function run() {
  await processImage('public/logo.png', 'public/logo-transparent.png', false);
  await processImage('public/icon.png', 'public/icon-transparent.png', true);
}

run();
