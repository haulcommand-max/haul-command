const sharp = require('sharp');

async function run() {
  const metadata = await sharp('public/media_logo.jpg').metadata();
  console.log(`width: ${metadata.width}, height: ${metadata.height}`);
  
  // Crop 1: Main Logo
  await sharp('public/media_logo.jpg')
    .extract({ left: 140, top: 70, width: 400, height: 260 })
    .toFile('public/logo.png');
    
  // Crop 2: Mobile App Icon
  await sharp('public/media_logo.jpg')
    .extract({ left: 60, top: 410, width: 230, height: 230 })
    .toFile('public/icon.png');
    
  await sharp('public/media_logo.jpg')
    .extract({ left: 60, top: 410, width: 230, height: 230 })
    .resize(32, 32)
    .toFile('public/favicon.ico');
    
  // Crop 3: App icon apple
  await sharp('public/media_logo.jpg')
    .extract({ left: 60, top: 410, width: 230, height: 230 })
    .toFile('public/apple-icon.png');
    
  console.log("Images generated heuristically! Check them later.");
}

run();
