const sharp = require('sharp');

async function analyze() {
  const meta = await sharp('public/media_logo.jpg').metadata();
  const { data, info } = await sharp('public/media_logo.jpg')
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  // We want to find the rough bounding boxes of the gold shapes.
  // Gold is roughly R>100, G>50, B<100, but let's just look for overall brightness.
  // We'll scan horizontal lines and keep ranges where average brightness > 30.
  let rowBright = [];
  for (let y = 0; y < info.height; y++) {
    let sum = 0;
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * info.channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      sum += (r + g + b) / 3;
    }
    rowBright.push(sum / info.width);
  }
  
  let regions = [];
  let start = -1;
  for (let y = 0; y < info.height; y++) {
    if (rowBright[y] > 20 && start === -1) start = y;
    if (rowBright[y] <= 20 && start !== -1) {
      if (y - start > 20) regions.push([start, y]);
      start = -1;
    }
  }
  if (start !== -1) regions.push([start, info.height]);
  
  console.log('Vertical bright regions (y1 to y2):');
  console.log(regions);
}

analyze();
