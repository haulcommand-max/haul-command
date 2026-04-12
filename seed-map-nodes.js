const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');

async function seedMapCaptureNodes() {
  const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
  await c.connect();

  console.log("🚀 STARTING: 100 Localized Map Capture Nodes Injection...");

  const baseMetros = [
    { name: "Houston", state: "TX", type: "port", slugPrefix: "tx/houston" },
    { name: "Miami", state: "FL", type: "port", slugPrefix: "fl/miami" },
    { name: "Los Angeles", state: "CA", type: "port", slugPrefix: "ca/los-angeles" },
    { name: "Dallas", state: "TX", type: "metro", slugPrefix: "tx/dallas" },
    { name: "Chicago", state: "IL", type: "metro", slugPrefix: "il/chicago" },
    { name: "Newark", state: "NJ", type: "port", slugPrefix: "nj/newark" },
    { name: "Savannah", state: "GA", type: "port", slugPrefix: "ga/savannah" },
    { name: "Seattle", state: "WA", type: "port", slugPrefix: "wa/seattle" },
    { name: "Atlanta", state: "GA", type: "metro", slugPrefix: "ga/atlanta" },
    { name: "Denver", state: "CO", type: "metro", slugPrefix: "co/denver" }
  ];

  const variants = [
    "heavy-haul-equipment",
    "pilot-car-routes",
    "escort-vehicle-staging",
    "permit-turnaround",
    "port-access-zones",
    "bridge-clearance-maps",
    "weigh-station-bypasses",
    "police-escort-handoffs",
    "night-travel-zones",
    "emergency-breakdown-bays"
  ];

  let nodes = [];
  let count = 0;

  for (let i = 0; i < baseMetros.length; i++) {
    for (let j = 0; j < variants.length; j++) {
      if (count >= 100) break;
      const m = baseMetros[i];
      const v = variants[j];
      
      const slug = `directory/${m.slugPrefix}/${v}`;
      const title = `${m.name} ${v.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} | Haul Command Map`;
      
      nodes.push({
        slug: slug,
        title: title,
        meta_description: `Live map data for ${v.replace(/-/g, ' ')} near ${m.name}, ${m.state}. Find verified operators and route intelligence for heavy haul transport.`,
        h1: `${m.name} ${v.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Map`,
        type: 'map_capture',
        page_type: 'map_capture',
        content_md: `# ${m.name} Area Map Capture\n\nDetailed infrastructure and staging zones for ${v.replace(/-/g, ' ')}...`,
        region: m.state,
        country: 'US',
        status: 'published',
        canonical_path: `/${slug}`,
        is_indexable: true
      });
      count++;
    }
  }

  let insertedCount = 0;
  try {
    for (const node of nodes) {
      await c.query(`
        INSERT INTO seo_pages (
          slug, title, meta_description, h1, type, page_type, content_md, region, country, status, canonical_path, is_indexable
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) ON CONFLICT (slug) DO NOTHING
      `, [
        node.slug, node.title, node.meta_description, node.h1, node.type, node.page_type, 
        node.content_md, node.region, node.country, node.status, node.canonical_path, node.is_indexable
      ]);
      insertedCount++;
    }
    console.log(`✅ Successfully injected 100 Map Capture Nodes into seo_pages.`);
  } catch (error) {
    console.error("❌ Node Injection Failed:", error);
  } finally {
    await c.end();
  }
}

seedMapCaptureNodes();
