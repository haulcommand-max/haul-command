import type { MetadataRoute } from 'next';

/**
 * PWA Web App Manifest — Haul Command
 * 
 * Next.js auto-generates /manifest.webmanifest from this file
 * and links it in the document <head>.
 * 
 * Icons:
 *  - icon-192.png: Standard app icon (192×192)
 *  - icon-512.png: High-res app icon (512×512)
 *  - icon-maskable-512.png: Maskable icon with safe-zone padding (512×512)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Haul Command',
    short_name: 'Haul Command',
    description: "The world's largest pilot car & escort vehicle directory. Find operators, post loads, and track corridors across 57 countries.",
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0F14',
    theme_color: '#0B0F14',
    orientation: 'portrait-primary',
    categories: ['business', 'logistics', 'transportation'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
