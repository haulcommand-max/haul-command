const Typesense = require('typesense');

const client = new Typesense.Client({
  nodes: [{ host: process.env.TYPESENSE_HOST || 'localhost', port: process.env.TYPESENSE_PORT || 8108, protocol: process.env.TYPESENSE_PROTOCOL || 'http' }],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 5
});

const schemas = [
  {
    name: 'hc_profiles',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'entity_type', type: 'string', facet: true },
      { name: 'display_name', type: 'string' },
      { name: 'country_code', type: 'string', facet: true },
      { name: 'region_code', type: 'string', facet: true },
      { name: 'city', type: 'string', facet: true },
      { name: 'location', type: 'geopoint' },
      { name: 'services', type: 'string[]', facet: true },
      { name: 'certifications', type: 'string[]', facet: true },
      { name: 'equipment_tags', type: 'string[]', facet: true },
      { name: 'has_images', type: 'bool', facet: true },
      { name: 'has_video', type: 'bool', facet: true },
      { name: 'has_reviews', type: 'bool', facet: true },
      { name: 'claimed', type: 'bool', facet: true },
      { name: 'trust_score', type: 'float', sort: true },
      { name: 'profile_completeness_score', type: 'float', sort: true },
      { name: 'freshness_score', type: 'float', sort: true },
      { name: 'review_count', type: 'int32', sort: true },
      { name: 'availability_status', type: 'string', facet: true },
      { name: 'canonical_url', type: 'string' }
    ],
    default_sorting_field: 'trust_score'
  },
  {
    name: 'hc_glossary',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'canonical_term', type: 'string' },
      { name: 'synonyms', type: 'string[]' },
      { name: 'country_code', type: 'string', facet: true, optional: true },
      { name: 'language', type: 'string', facet: true },
      { name: 'term_family', type: 'string', facet: true },
      { name: 'popularity_score', type: 'int32', sort: true },
      { name: 'canonical_url', type: 'string' }
    ],
    default_sorting_field: 'popularity_score'
  },
  {
    name: 'hc_regulations',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'country_code', type: 'string', facet: true },
      { name: 'region_code', type: 'string', facet: true, optional: true },
      { name: 'language', type: 'string', facet: true },
      { name: 'rule_type', type: 'string', facet: true },
      { name: 'is_current', type: 'bool', facet: true },
      { name: 'effective_date', type: 'int64', sort: true, optional: true },
      { name: 'canonical_url', type: 'string' }
    ]
  },
  {
    name: 'hc_tools',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'tool_name', type: 'string' },
      { name: 'tool_family', type: 'string', facet: true },
      { name: 'country_code', type: 'string', facet: true, optional: true },
      { name: 'language', type: 'string', facet: true },
      { name: 'supported_regions', type: 'string[]', facet: true },
      { name: 'requires_login', type: 'bool', facet: true },
      { name: 'canonical_url', type: 'string' }
    ]
  }
];

async function initCollections() {
  for (const schema of schemas) {
    try {
      await client.collections(schema.name).retrieve();
      console.log(`Collection ${schema.name} already exists.`);
      // Optionally could drop/recreate or update schema fields
    } catch(err) {
      if(err.httpStatus === 404) {
        console.log(`Creating collection ${schema.name}...`);
        await client.collections().create(schema);
        console.log(`Created collection ${schema.name}.`);
      } else {
        console.error(`Error for ${schema.name}:`, err);
      }
    }
  }
}

if (require.main === module) {
  initCollections().catch(console.error);
}

module.exports = { initCollections, schemas, client };
