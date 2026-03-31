import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Haul Command OS
// Task 40: Fetch translations from our global glossary dynamically.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const termSlug = searchParams.get('slug');
  const regionCode = searchParams.get('region') || 'US';

  if (!termSlug) {
    return NextResponse.json({ error: 'Missing term slug.' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'global-glossary.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const glossary = JSON.parse(fileContents);

    const match = glossary.haul_command_global_dictionary.terms.find((t: any) => 
      t.universal_id === termSlug || t.seo_slugs?.US === termSlug
    );

    if (!match) {
      return NextResponse.json({ error: 'Term not found.' }, { status: 404 });
    }

    const localizedName = match.regional_translations[regionCode] || match.universal_en;

    return NextResponse.json({
      universal_term: match.universal_en,
      local_term: localizedName,
      definition: match.description,
      sensitivity: match.regulatory_sensitivity
    });

  } catch (err) {
    return NextResponse.json({ error: 'Dictionary lookup failed.' }, { status: 500 });
  }
}
