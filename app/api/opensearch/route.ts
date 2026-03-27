/**
 * OpenSearch Description — Browser Search Integration
 * 
 * Makes "Haul Command" appear as a search engine in browser settings.
 * Coverage: Chrome, Firefox, Edge, Safari
 */

import { NextResponse } from 'next/server';
import { generateOpenSearchXML } from '@/lib/seo/structured-data-factory';

export async function GET() {
  const xml = generateOpenSearchXML(
    'Haul Command',
    'Search the #1 directory for pilot cars, escort vehicles, and oversize load services across 120 countries.',
    'https://haulcommand.com',
  );

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/opensearchdescription+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
