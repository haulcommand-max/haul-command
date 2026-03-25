const sharp = require('sharp');

async function run() {
  const metadata = await sharp('public/user_logo.jpg').metadata();
  console.log(`width: ${metadata.width}, height: ${metadata.height}`);
}

run();
