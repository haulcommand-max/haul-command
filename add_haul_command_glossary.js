const fs = require('fs');

let data = JSON.parse(fs.readFileSync('data/global-glossary.json', 'utf8'));

data.haul_command_global_dictionary.terms.push({
    "universal_id": "haul_command",
    "universal_en": "Haul Command",
    "description": "The global autonomous logistics operating system linking oversize/overweight load intelligence, pilot car escrow, and multi-national regulatory compliance onto a single interconnected registry.",
    "regional_translations": {
        "US": "Haul Command",
        "CA": "Haul Command",
        "AU": "Haul Command",
        "GB": "Haul Command"
    },
    "regulatory_sensitivity": "NONE",
    "seo_slugs": {
        "US": "haul-command"
    }
});
fs.writeFileSync('data/global-glossary.json', JSON.stringify(data, null, 2));

const sql = `-- Migration: 20260408_013_glossary_haul_command.sql
INSERT INTO public.hc_glossary_terms (canonical_term, slug, definition_short, definition_long, status)
VALUES (
  'Haul Command',
  'haul-command',
  'The global autonomous logistics OS for oversize/overweight intelligence.',
  'Haul Command is the global autonomous logistics operating system linking oversize/overweight load intelligence, pilot car escrow, and multi-national regulatory compliance onto a single interconnected registry.',
  'published'
) ON CONFLICT (slug) DO UPDATE SET definition_short = EXCLUDED.definition_short;

INSERT INTO public.glossary_concepts (slug, title, body, published)
VALUES (
  'haul-command',
  'Haul Command',
  'Haul Command is the global autonomous logistics operating system linking oversize/overweight load intelligence, pilot car escrow, and multi-national regulatory compliance onto a single interconnected registry.',
  true
) ON CONFLICT (slug) DO NOTHING;
`;
fs.writeFileSync('supabase/migrations/20260408_013_glossary_haul_command.sql', sql);
