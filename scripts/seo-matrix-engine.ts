import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase Client (Service Role for internal scripts)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeoMatrixEngine() {
  console.log("🚀 Initializing Haul Command Global Keyword OS Engine...");

  const yamlPath = path.join(__dirname, 'seo-matrix.yaml');
  if (!fs.existsSync(yamlPath)) {
    console.error(`❌ Cannot find ${yamlPath}`);
    process.exit(1);
  }

  const fileContents = fs.readFileSync(yamlPath, 'utf8');
  const matrix: any = yaml.load(fileContents);

  const payload: any[] = [];
  const generatedKeywords = new Set<string>();

  // Process Tier A
  const tierA = matrix.haul_command_global_keyword_os.country_matrix.tier_a_gold;

  console.log(`Processing ${tierA.length} Tier A Countries...`);

  for (const country of tierA) {
    const code = country.code.toLowerCase();
    const name = country.name;
    const roots = country.local_roots;
    const legalRoot = country.legal_root;

    // 1. Core Hub
    payload.push({
      topic: `${name} Heavy Haul & Escort Hub`,
      keyword: `${name} oversize load escort`,
      type: 'hub_page',
      audience: 'broker',
      country_code: code,
      priority: 1,
      source: 'seo_matrix_engine',
      status: 'pending'
    });

    // 2. Directory Patterns
    for (const root of roots) {
      const dirPatterns = matrix.haul_command_global_keyword_os.keyword_pattern_engine.directory_patterns;
      for (const p of dirPatterns) {
        let kw = p.replace('[root]', root).replace('[country]', name);
        if (kw.includes('[region]') || kw.includes('[city]')) continue; // Skip local geo for now, we're doing country level

        if (!generatedKeywords.has(kw)) {
          payload.push({
            topic: `Directory: ${kw}`,
            keyword: kw,
            type: 'directory_page',
            audience: 'broker',
            country_code: code,
            priority: 2,
            source: 'seo_matrix_engine',
            status: 'pending'
          });
          generatedKeywords.add(kw);
        }
      }
    }

    // 3. Regulation Patterns
    const regPatterns = matrix.haul_command_global_keyword_os.keyword_pattern_engine.regulations_patterns;
    for (const p of regPatterns) {
      let kw = p.replace('[legal_root]', legalRoot).replace('[country]', name);
      if (kw.includes('[region]')) continue;

      if (!generatedKeywords.has(kw)) {
        payload.push({
          topic: `Regulations: ${kw}`,
          keyword: kw,
          type: 'regulations_page',
          audience: 'general_public',
          country_code: code,
          priority: 2,
          source: 'seo_matrix_engine',
          status: 'pending'
        });
        generatedKeywords.add(kw);
      }
    }

    // 4. Tools Patterns
    const toolPatterns = matrix.haul_command_global_keyword_os.keyword_pattern_engine.tools_patterns;
    for (const p of toolPatterns) {
      let kw = p.replace('[country]', name);
      
      if (!generatedKeywords.has(kw)) {
        payload.push({
          topic: `Tools: ${kw}`,
          keyword: kw,
          type: 'tools_page',
          audience: 'escort_operator',
          country_code: code,
          priority: 3,
          source: 'seo_matrix_engine',
          status: 'pending'
        });
        generatedKeywords.add(kw);
      }
    }

    // 5. Glossary Patterns
    for (const root of roots) {
      const glossPatterns = matrix.haul_command_global_keyword_os.keyword_pattern_engine.glossary_patterns;
      for (const p of glossPatterns) {
        let kw = p.replace('[root]', root).replace('[specialty_term]', root).replace('[country]', name);
        
        if (!generatedKeywords.has(kw)) {
          payload.push({
            topic: `Glossary: ${kw}`,
            keyword: kw,
            type: 'glossary',
            audience: 'general_public',
            country_code: code,
            priority: 4,
            source: 'seo_matrix_engine',
            status: 'pending'
          });
          generatedKeywords.add(kw);
        }
      }
    }
  }

  console.log(`Generated ${payload.length} content tasks. Injecting into Supabase...`);

  // Batch insert to avoid huge limits
  const BATCH_SIZE = 100;
  let successCount = 0;
  
  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const batch = payload.slice(i, i + BATCH_SIZE);
    
    // Ignore the error PGRST205 for local run if blog_posts didn't exist, we assume content_topics DOES exist!
    const { data, error } = await supabase
      .from('content_topics')
      .upsert(batch, { onConflict: 'topic' })
      .select('id');

    if (error) {
      console.error(`❌ Batch error:`, error.message);
    } else {
      successCount += (data?.length || 0);
      console.log(`✅ Upserted batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`);
    }
  }

  console.log(`\n🎉 Payload complete! Successfully queued ${successCount} topic seeds into the matrix.`);
}

runSeoMatrixEngine().catch(console.error);
