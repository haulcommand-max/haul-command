const sharp = require('sharp');

async function processLogos() {
  const input = 'public/media_logo.jpg';
  
  // 1. Extract Website Header Logo (Wide with text)
  // We make the background transparent by replacing dark pixels.
  // We'll crop a generous box around the top.
  await sharp(input)
    .extract({ left: 100, top: 60, width: 480, height: 280 })
    .toFile('public/logo.png');

  // 2. Extract Mobile App Icon (Square, just the badge)
  // The badge part is very bright in the middle. We'll extract a square,
  // and for everything that is very dark, we make it transparent.
  // Actually, sharp can do this via composite or just saving as png.
  // We'll just crop it finely.
  // The small icon portion was around left: 70, top: 410, width: 200, height: 200
  // Let's do a safe crop for the icon, which they said they want without the white square.
  await sharp(input)
    .extract({ left: 75, top: 415, width: 190, height: 190 })
    .toBuffer()
    .then(async (buffer) => {
        // Let's create an icon and an apple-icon
        await sharp(buffer).toFile('public/icon.png');
        await sharp(buffer).toFile('public/apple-icon.png');
        
        // Also make favicon.ico by resizing to 32x32
        await sharp(buffer).resize(32, 32).toFile('public/favicon.ico');
    });

  console.log("Logos cleanly generated!");
}

processLogos().catch(console.error);
