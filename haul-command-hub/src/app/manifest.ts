import type { MetadataRoute } from 'next';

/**
 * PWA Web App Manifest — Haul Command
 * 
 * Next.js auto-generates /manifest.webmanifest from this file
 * and links it in the document <head>.
 * 
 * Upgraded with:
 *  - Shortcuts for instant in-cab access
 *  - Related applications for future native apps
 *  - Screenshots for app store presentations
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Haul Command',
    short_name: 'Haul Command',
    description: "The world's largest pilot car & escort vehicle directory. Find operators, post loads, and track corridors across 57 countries.",
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
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
    shortcuts: [
      {
        name: 'Find Escorts',
        short_name: 'Directory',
        url: '/directory',
        description: 'Browse the global escort vehicle directory',
      },
      {
        name: 'Post Load',
        short_name: 'Loads',
        url: '/loads',
        description: 'Post a new load needing escorts',
      },
      {
        name: 'Requirements',
        short_name: 'Rules',
        url: '/escort-requirements',
        description: 'Check escort requirements by jurisdiction',
      },
      {
        name: 'Dictionary',
        short_name: 'Dictionary',
        url: '/dictionary',
        description: '500+ industry term definitions',
      },
    ],
  };
}
