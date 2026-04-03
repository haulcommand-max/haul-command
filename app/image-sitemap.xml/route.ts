import { NextResponse } from 'next/server';

export const revalidate = 86400;

// Seed image sitemap — maps known high-value image assets to their target pages.
// These are primed for Google Image Search snippet capture on gear/corridor queries.
const IMAGE_ENTRIES = [
  {
    loc: 'https://www.haulcommand.com/gear',
    images: [
      { loc: 'https://www.haulcommand.com/images/gear/height-pole-escort.jpg', title: 'Height Pole Escort Vehicle Setup', caption: 'Standard height pole and amber light configuration for certified pilot car operators.' },
      { loc: 'https://www.haulcommand.com/images/gear/amber-lights.jpg', title: 'Amber Warning Lights for Oversize Loads', caption: 'FHWA-compliant amber strobe and beacon lighting required for escort vehicles.' },
      { loc: 'https://www.haulcommand.com/images/gear/oversize-banner.jpg', title: 'Oversize Load Banner Signs', caption: 'Standard "Oversize Load" sign dimensions and placement requirements.' },
    ],
  },
  {
    loc: 'https://www.haulcommand.com/directory',
    images: [
      { loc: 'https://www.haulcommand.com/images/directory/pilot-car-operator.jpg', title: 'Verified Pilot Car Operator', caption: 'A certified pilot car operator in high-visibility gear next to their escort vehicle.' },
    ],
  },
  {
    loc: 'https://www.haulcommand.com/corridors',
    images: [
      { loc: 'https://www.haulcommand.com/images/corridors/I-35-corridor.jpg', title: 'I-35 Heavy Haul Corridor Map', caption: 'Infographic showing key weigh stations, low bridges, and choke points on the I-35 corridor.' },
      { loc: 'https://www.haulcommand.com/images/corridors/texas-triangle.jpg', title: 'Texas Triangle Freight Corridor', caption: 'The Texas Triangle heavy haul route connecting Dallas, Houston, and San Antonio.' },
    ],
  },
];

export async function GET() {
  const urlset = IMAGE_ENTRIES.map(entry => {
    const imageElems = entry.images.map(img => `
      <image:image>
        <image:loc>${img.loc}</image:loc>
        <image:title>${img.title}</image:title>
        <image:caption>${img.caption}</image:caption>
        <image:license>https://www.haulcommand.com/legal/terms</image:license>
      </image:image>`).join('');
    return `
  <url>
    <loc>${entry.loc}</loc>${imageElems}
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urlset}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
