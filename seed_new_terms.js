import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const NEW_TERMS = [
  // Miss Sarah Lingo
  {
    slug: 'four',
    term: 'Four',
    short_definition: "Any 4-wheeled passenger vehicle driven by a regular motorist.",
    long_definition: null,
    category: 'Lingo',
    synonyms: ["4s", "Fours"],
    published: true,
  },
  {
    slug: 'tag',
    term: 'Tag',
    short_definition: "A trailer being towed behind a vehicle.",
    example_usage: "4 with a tag on the shoulder.",
    category: 'Lingo',
    published: true,
  },
  {
    slug: 'alligator',
    term: 'Alligator',
    short_definition: "Shredded pieces of tires laying in or along the side of the road.",
    long_definition: "When the tread is facing up, they resemble the backs of alligators. Also known as Gators. These can be dangerous hazards for loads traveling behind.",
    category: 'Lingo',
    synonyms: ["Gator", "Gators", "Alligators"],
    published: true,
  },
  {
    slug: 'mustard',
    term: 'Mustard',
    short_definition: "The yellow striping to the left of the lane of travel.",
    category: 'Lingo',
    synonyms: ["Yellow Line"],
    published: true,
  },
  {
    slug: 'fog-line',
    term: 'Fog Line',
    short_definition: "A solid white line that divides the road from the shoulder.",
    category: 'Regulations / Infrastructure',
    published: true,
  },
  {
    slug: 'zipper',
    term: 'Zipper',
    short_definition: "The broken white or yellow lines separating lanes or two-way traffic.",
    category: 'Infrastructure',
    published: true,
  },
  {
    slug: 'up-callout',
    term: 'Up',
    short_definition: "Radio callout used by the Chase car to let the driver know a vehicle is going to pass the load.",
    example_usage: "4 and a tag 'up'.",
    category: 'Radio Callout',
    published: true,
  },
  {
    slug: 'eighteen',
    term: 'Eighteen',
    short_definition: "A Semi truck. Regular sized semi tractor/trailers have 18 wheels.",
    category: 'Lingo',
    synonyms: ["18", "Eighteens", "18s"],
    published: true,
  },
  {
    slug: 'wiggle-wagon',
    term: 'Wiggle Wagon',
    short_definition: "A semi with two trailers. Also referred to as a B-Train in Canada.",
    category: 'Lingo',
    synonyms: ["B-Train"],
    published: true,
  },
  {
    slug: 'parking-lot',
    term: 'Parking Lot',
    short_definition: "A semitruck hauling passenger vehicles/cars.",
    category: 'Lingo',
    published: true,
  },
  {
    slug: 'steerman',
    term: 'Steerman',
    short_definition: "A Chase pilot car located at the back of the load when rolling, whose responsibility includes aiding in steering the rear axles.",
    category: 'Roles',
    synonyms: ["Tillerman", "Steerperson"],
    published: true,
  },
  {
    slug: 'chicken-shack',
    term: 'Chicken Shack',
    short_definition: "Slang for a weigh station or scale.",
    category: 'Lingo',
    synonyms: ["Weigh Station", "Scale"],
    published: true,
  },
  {
    slug: 'pork-chop',
    term: 'Pork Chop',
    short_definition: "Small traffic islands that help separate oncoming turn lanes from passing lanes, often possessing stop signs.",
    category: 'Infrastructure',
    published: true,
  },
  {
    slug: 'shoo-fly',
    term: 'Shoo-Fly',
    short_definition: "A maneuver involving making a wrong-way turn into the oncoming traffic lane when an intersection is too tight to make legitimately.",
    category: 'Maneuver',
    published: true,
  },
  {
    slug: 'gypsy-wagon',
    term: 'Gypsy Wagon',
    short_definition: "An RV or towable camper rig.",
    category: 'Lingo',
    published: true,
  },
  {
    slug: 'center-up',
    term: 'Center Up',
    short_definition: "Maneuver driving straight down the exact middle of narrow roadways or bridges to ensure clearance.",
    category: 'Maneuver',
    published: true,
  },
  
  // ESC Official Terms
  {
    slug: 'deflection',
    term: 'Deflection',
    short_definition: "The amount the tip of the high pole bends back while traveling at high speed.",
    category: 'Equipment',
    published: true,
  },
  {
    slug: 'leapfrogging',
    term: 'Leapfrogging',
    short_definition: "When, on hilly or curvy terrain, the load must be stopped and traffic control measures put in place before proceeding.",
    category: 'Procedural',
    published: true,
  },
  {
    slug: 'gore-strip',
    term: 'Gore Strip',
    short_definition: "The physical chevron-painted area dividing two merging lanes.",
    category: 'Infrastructure',
    published: true,
  },
  {
    slug: 'retroreflective',
    term: 'Retroreflective',
    short_definition: "Material designed to reflect light directly back toward its source. Required for PEVO flagging duties.",
    category: 'Equipment',
    published: true,
  },
  {
    slug: 'traffic-control-plan',
    term: 'Traffic Control Plan',
    short_definition: "Depicts the route and specific procedures to be followed to provide safe movement along the route.",
    acronyms: ["TCP"],
    category: 'Regulations / Planning',
    published: true,
  },
  {
    slug: 'superload',
    term: 'Superload',
    short_definition: "Any load that would require special analysis and approval by one or more state permit offices due to extreme dimensions or weight.",
    category: 'Regulatory',
    published: true,
  },

  // Logistics / Freight Terms
  {
    slug: 'bill-of-lading',
    term: 'Bill of Lading',
    short_definition: "A legal document issued by a carrier to a shipper that details the type, quantity, and destination of the goods.",
    acronyms: ["BOL"],
    category: 'Documentation',
    published: true,
  },
  {
    slug: 'consignee',
    term: 'Consignee',
    short_definition: "The entity who is financially responsible (the buyer) for the receipt of a shipment. Generally, but not always, the receiver.",
    category: 'Roles',
    published: true,
  },
  {
    slug: 'consignor',
    term: 'Consignor',
    short_definition: "The person or company who ships the goods to the consignee.",
    category: 'Roles',
    published: true,
  },
  {
    slug: 'frost-laws',
    term: 'Frost Laws',
    short_definition: "Seasonal weight restrictions placed on certain highways so they are not damaged by heavy vehicles as the ground thaws.",
    category: 'Regulations',
    published: true,
  },
  {
    slug: 'ifta',
    term: 'IFTA',
    short_definition: "International Fuel Tax Agreement. An agreement between the lower 48 US states and Canadian provinces to simplify the reporting of fuel use by motor carriers.",
    acronyms: ["IFTA"],
    category: 'Regulations',
    published: true,
  },
  {
    slug: 'tire-chain-laws',
    term: 'Tire Chain Laws',
    short_definition: "State-specific regulations dictating when commercial vehicles must equip tire chains during winter weather events.",
    category: 'Regulations',
    published: true,
  }
];

async function seedNewTerms() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await client.connect();
  console.log("Connected to Supabase. Seeding new mined terms...");

  for (const t of NEW_TERMS) {
    const query = `
      INSERT INTO public.glossary_terms 
        (slug, term, short_definition, long_definition, category, synonyms, acronyms, example_usage, published)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (slug) DO UPDATE SET 
        term = EXCLUDED.term,
        short_definition = EXCLUDED.short_definition,
        long_definition = EXCLUDED.long_definition,
        category = EXCLUDED.category,
        synonyms = EXCLUDED.synonyms,
        acronyms = EXCLUDED.acronyms,
        example_usage = EXCLUDED.example_usage
    `;
    const values = [
      t.slug,
      t.term,
      t.short_definition,
      t.long_definition || null,
      t.category || null,
      t.synonyms || [],
      t.acronyms || [],
      t.example_usage || null,
      t.published
    ];
    try {
      await client.query(query, values);
      console.log(`Upserted: ${t.slug}`);
    } catch (err) {
      console.error(`Error on ${t.slug}:`, err.message);
    }
  }

  await client.end();
  console.log("Seeding complete.");
}

seedNewTerms();
