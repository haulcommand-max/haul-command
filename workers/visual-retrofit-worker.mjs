#!/usr/bin/env node
/**
 * Haul Command — Visual Retrofit Worker
 * 
 * Autonomous content imaging pipeline that:
 * 1. Reads blog articles missing hero images from hc_blog_articles
 * 2. Generates industrial-grade visuals using an imaging API
 * 3. Uploads to Supabase Storage (blog-visuals bucket)
 * 4. Updates the article with hero_image_url and og_image_url
 * 5. Marks the content generation queue task as completed
 * 
 * Usage:
 *   node workers/visual-retrofit-worker.mjs
 *   node workers/visual-retrofit-worker.mjs --dry-run
 *   node workers/visual-retrofit-worker.mjs --limit 5
 * 
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY (for DALL-E 3) or REPLICATE_API_TOKEN (for Flux)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CLI Args ──────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = parseInt(args.find(a => a.startsWith('--limit'))?.split('=')?.[1] || args[args.indexOf('--limit') + 1] || '10');

// ─── Visual Prompt Templates ──────────────────────────────
const PROMPT_TEMPLATES = {
  default: (title, category) => 
    `Professional industrial photography: ${title}. Heavy haul logistics, oversize load escort vehicles, American highways. Dark moody sky, golden hour lighting, cinematic composition. Category: ${category}. Photorealistic, 4K quality, no text overlays.`,
  
  corridor: (title) =>
    `Aerial drone photography of a freight corridor: ${title}. Wide interstate highway with oversized load being escorted by pilot cars with amber lights. Industrial landscape, dramatic clouds, professional logistics photography. Photorealistic, 4K.`,
  
  safety: (title) =>
    `Professional safety documentation photography: ${title}. Heavy haul safety equipment, escort vehicles with height poles, warning signs, reflective gear. Clean professional lighting, industrial background. Photorealistic, 4K.`,
  
  regulatory: (title) =>
    `Professional document/regulatory photography: ${title}. State DOT office, permit documents on desk, computer screens showing logistics data. Professional office environment with maps and route planning. Clean lighting, 4K.`,
  
  equipment: (title) =>
    `Professional equipment photography: ${title}. Close-up of specialized heavy haul equipment, escort vehicle accessories, GPS trackers, height poles, arrow boards. Industrial workshop background. Product photography style, 4K.`,
  
  market: (title) =>
    `Data visualization heatmap overlay on US map: ${title}. Dark background, glowing data points in amber/gold representing freight density. Industrial data dashboard aesthetic. Professional infographic style, 4K.`,
};

/**
 * Select the best prompt template based on article slug/category
 */
function selectPromptTemplate(slug, category) {
  if (slug.includes('corridor') || slug.includes('route') || slug.includes('lane')) return 'corridor';
  if (slug.includes('safety') || slug.includes('hazard') || slug.includes('compliance')) return 'safety';
  if (slug.includes('permit') || slug.includes('regulation') || slug.includes('law')) return 'regulatory';
  if (slug.includes('equipment') || slug.includes('gear') || slug.includes('tech')) return 'equipment';
  if (slug.includes('market') || slug.includes('index') || slug.includes('pricing') || slug.includes('rate')) return 'market';
  return 'default';
}

/**
 * Generate image via OpenAI DALL-E 3
 */
async function generateImageDALLE(prompt) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024', // Landscape for hero images
      quality: 'hd',
      response_format: 'url',
    }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`DALL-E error: ${res.status} ${err.error?.message || res.statusText}`);
  }
  
  const data = await res.json();
  return data.data[0].url;
}

/**
 * Generate image via Replicate (Flux Pro)
 */
async function generateImageReplicate(prompt) {
  if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not set');
  
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'black-forest-labs/flux-1.1-pro',
      input: {
        prompt,
        width: 1792,
        height: 1024,
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 90,
      },
    }),
  });
  
  if (!res.ok) throw new Error(`Replicate error: ${res.status}`);
  const prediction = await res.json();
  
  // Poll for completion
  let result = prediction;
  while (result.status === 'starting' || result.status === 'processing') {
    await new Promise(r => setTimeout(r, 2000));
    const poll = await fetch(result.urls.get, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
    });
    result = await poll.json();
  }
  
  if (result.status !== 'succeeded') throw new Error(`Replicate failed: ${result.status}`);
  return result.output[0];
}

/**
 * Download image from URL and upload to Supabase Storage
 */
async function uploadToStorage(imageUrl, slug) {
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to download image: ${imageRes.status}`);
  
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const contentType = imageRes.headers.get('content-type') || 'image/webp';
  const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'webp';
  const path = `heroes/${slug}.${ext}`;
  
  // Ensure bucket exists
  const { error: bucketError } = await supabase.storage.createBucket('blog-visuals', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg'],
  });
  
  if (bucketError && !bucketError.message?.includes('already exists')) {
    console.warn('  ⚠ Bucket creation warning:', bucketError.message);
  }
  
  const { data, error } = await supabase.storage
    .from('blog-visuals')
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });
  
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('blog-visuals')
    .getPublicUrl(path);
  
  return urlData.publicUrl;
}

/**
 * Generate OG image (1200x630) from the hero image
 * For now, reuse the hero — future: use image resize API
 */
function deriveOGUrl(heroUrl) {
  // Supabase Storage supports on-the-fly transforms if enabled
  // Append transform params if available, otherwise use same URL
  try {
    const url = new URL(heroUrl);
    if (url.hostname.includes('supabase')) {
      // Supabase Image Transformation API
      url.searchParams.set('width', '1200');
      url.searchParams.set('height', '630');
      url.searchParams.set('resize', 'cover');
      return url.toString();
    }
  } catch {}
  return heroUrl;
}

// ─── Main Worker Loop ──────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Haul Command — Visual Retrofit Worker');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Limit: ${LIMIT}`);
  console.log(`  API: ${OPENAI_API_KEY ? 'DALL-E 3' : REPLICATE_API_TOKEN ? 'Replicate Flux' : '⚠ NO API KEY'}`);
  console.log('═══════════════════════════════════════════\n');
  
  // 1. Fetch articles missing hero images
  const { data: articles, error } = await supabase
    .from('hc_blog_articles')
    .select('id, title, slug, category, status')
    .is('hero_image_url', null)
    .order('created_at', { ascending: true })
    .limit(LIMIT);
  
  if (error) {
    console.error('❌ Failed to fetch articles:', error.message);
    process.exit(1);
  }
  
  if (!articles || articles.length === 0) {
    console.log('✅ No articles need visual retrofit. All heroes generated!');
    return;
  }
  
  console.log(`📸 Found ${articles.length} articles missing hero images:\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const article of articles) {
    const templateKey = selectPromptTemplate(article.slug, article.category);
    const template = PROMPT_TEMPLATES[templateKey];
    const prompt = template(article.title, article.category || 'logistics');
    
    console.log(`  [${success + failed + 1}/${articles.length}] ${article.title}`);
    console.log(`    Template: ${templateKey}`);
    console.log(`    Slug: ${article.slug}`);
    
    if (DRY_RUN) {
      console.log(`    Prompt: ${prompt.substring(0, 100)}...`);
      console.log(`    ⏭ SKIP (dry run)\n`);
      success++;
      continue;
    }
    
    try {
      // Generate image
      let imageUrl;
      if (OPENAI_API_KEY) {
        imageUrl = await generateImageDALLE(prompt);
      } else if (REPLICATE_API_TOKEN) {
        imageUrl = await generateImageReplicate(prompt);
      } else {
        console.log('    ⚠ No imaging API key set. Skipping.\n');
        failed++;
        continue;
      }
      
      console.log(`    📥 Generated: ${imageUrl.substring(0, 60)}...`);
      
      // Upload to Supabase Storage
      const publicUrl = await uploadToStorage(imageUrl, article.slug);
      console.log(`    📤 Uploaded: ${publicUrl.substring(0, 60)}...`);
      
      // Derive OG image URL
      const ogUrl = deriveOGUrl(publicUrl);
      
      // Update article
      const { error: updateError } = await supabase
        .from('hc_blog_articles')
        .update({
          hero_image_url: publicUrl,
          og_image_url: ogUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      // Mark content queue task as completed (if exists)
      await supabase
        .from('hc_content_generation_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { hero_url: publicUrl, og_url: ogUrl },
        })
        .eq('target_table', 'hc_blog_articles')
        .eq('target_id', article.id)
        .eq('task_type', 'visual');
      
      console.log(`    ✅ Article updated with hero + OG image\n`);
      success++;
      
      // Rate limit: 1 image per 3 seconds
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (err) {
      console.error(`    ❌ Failed: ${err.message}\n`);
      failed++;
      
      // Log failure to queue
      await supabase
        .from('hc_content_generation_queue')
        .update({
          status: 'failed',
          attempts: supabase.rpc ? undefined : 1, // increment if possible
          error_message: err.message,
          updated_at: new Date().toISOString(),
        })
        .eq('target_table', 'hc_blog_articles')
        .eq('target_id', article.id)
        .eq('task_type', 'visual');
    }
  }
  
  console.log('═══════════════════════════════════════════');
  console.log(`  Results: ${success} success, ${failed} failed`);
  console.log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
