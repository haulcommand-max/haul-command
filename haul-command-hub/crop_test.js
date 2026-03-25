const sharp = require('sharp');

async function extract() {
  const meta = await sharp('public/media_logo.jpg').metadata();
  
  // Let's create a perfectly square crop from the user image for the mobile app icon.
  // We'll guess the coordinates. We know y=448-492 is bright.
  // So probably y=380 to 600.
  // x is somewhere on the left side. width=682.
  
  await sharp('public/media_logo.jpg')
    .extract({ left: 60, top: 380, width: 220, height: 220 })
    .toFile('public/test_crop1.jpg');
    
  await sharp('public/media_logo.jpg')
    .extract({ left: 360, top: 400, width: 220, height: 220 })
    .toFile('public/test_crop2.jpg');
    
  await sharp('public/media_logo.jpg')
    .extract({ left: 231, top: 100, width: 220, height: 220 })
    .toFile('public/test_crop3.jpg'); // Main logo?
    
  console.log('done cropping tests');
}

extract();
