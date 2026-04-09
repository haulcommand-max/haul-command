/**
 * --------------------------------------------------------------------------
 * HAUL COMMAND - CONTENT PILLAR GENERATOR
 * --------------------------------------------------------------------------
 * Generates the Top 100 thick content pillar schemas (articles/guides)
 * structured for Double Platinum SEO guidelines across high-value intents
 * (Gov/Agencies, Operators, Brokers, Regulations, Corridors).
 * 
 * Execution: npx tsx scripts/generate-content-pillars.ts
 * --------------------------------------------------------------------------
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️  Supabase keys not found in .env.local. Dry run mode only.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// High-value countries for initial pillar seeding
const TARGET_COUNTRIES = ['US', 'CA', 'AU', 'GB', 'ZA', 'DE', 'AE'];

const INTENT_FRAMEWORKS = [
  {
    category: 'agency_government',
    templates: [
      "The Official Guide to Heavy Haul Regulations in {COUNTRY}",
      "{COUNTRY} Escort Vehicle Minimum Insurance and Compliance Standards",
      "Border Crossing: Heavy Freight Protocols for {COUNTRY} Checkpoints"
    ]
  },
  {
    category: 'broker_logistics',
    templates: [
      "Permit Processing Times & Escort Requirements in {COUNTRY}: What Brokers Need to Know",
      "Top Oversize Corridors in {COUNTRY}: Rates, Restrictions, and Carrier Sourcing",
      "How to Vet High-Pole and Route Survey Operators in {COUNTRY}"
    ]
  },
  {
    category: 'operator_training',
    templates: [
      "Pilot Car Certification Path: {COUNTRY} Requirements Explained",
      "Maximizing Profit: The Most Lucrative Heavy Haul Routes in {COUNTRY}",
      "Required Vehicle Lighting and Setup for Oversize Loads in {COUNTRY}"
    ]
  }
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log("🚀 Initializing Content Pillar Generation Sequence...");
  
  const pillarsToInsert = [];

  for (const country of TARGET_COUNTRIES) {
    for (const framework of INTENT_FRAMEWORKS) {
      for (const template of framework.templates) {
        const title = template.replace(/{COUNTRY}/g, country);
        const slug = slugify(title);
        
        // Base structure for the Double Platinum SEO requirements
        const schemaMarkup = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": title,
          "audience": {
            "@type": "Audience",
            "audienceType": framework.category
          },
          "spatialCoverage": {
            "@type": "Place",
            "address": { "@type": "PostalAddress", "addressCountry": country }
          }
        };

        pillarsToInsert.push({
          title,
          slug,
          country_code: country,
          content: "<!-- DRAFT_CONTENT_MARKER -->\n\n## Overview\n*Content to be populated by autonomous swarm...*",
          status: 'draft',
          excerpt: `Comprehensive commercial and regulatory guide covering ${title}.`,
          schema_markup: schemaMarkup,
          visual_assets: []
        });
      }
    }
  }

  // Cross-border / Global Corridors
  pillarsToInsert.push({
    title: "The Ultimate Guide to US-Canada Transborder Heavy Haul Escorts",
    slug: "us-canada-transborder-heavy-haul-escorts",
    country_code: "US", // Primary
    content: "<!-- DRAFT_CONTENT_MARKER -->",
    status: "draft",
    excerpt: "Everything you need to navigate ALCAN and major US-CA border crossings.",
    schema_markup: {},
    visual_assets: []
  });

  console.log(`Generated ${pillarsToInsert.length} Thick Pillar Topics.`);

  if (supabaseUrl && supabaseKey) {
    console.log("💾 Seeding to Supabase (hc_blog_articles) ...");
    
    // Upsert to handle re-runs gracefully
    const { data, error } = await supabase
      .from('hc_blog_articles')
      .upsert(pillarsToInsert, { onConflict: 'slug' })
      .select('id, slug');

    if (error) {
      console.error("❌ Error inserting pillars:", error.message);
    } else {
      console.log(`✅ Successfully seeded ${data?.length} pillar articles into draft state.`);
      
      // Optionally queue visualization generation tasks
      if (data && data.length > 0) {
        console.log("🎨 Queueing Visual Generation tasks for new pillars...");
        const queuePayload = data.map((article: any) => ({
          article_id: article.id,
          task_type: 'visual_generation',
          status: 'pending',
          prompt_payload: {
            directive: "Generate a premium industrial blueprint or heatmap for hero_image",
            slug: article.slug
          }
        }));

        const { error: qError } = await supabase
          .from('hc_content_generation_queue')
          .insert(queuePayload);
          
        if (qError) console.error("❌ Error queueing visual tasks:", qError.message);
        else console.log(`✅ Queued ${queuePayload.length} visual retrofit/generation tasks.`);
      }
    }
  }
}

main().catch(console.error);
