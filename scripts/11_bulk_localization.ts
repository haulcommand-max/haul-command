import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// Use Google Generative AI for translations
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Tier A Translation targets
const targetLocales = ['es-MX', 'de-DE', 'pt-BR', 'fr-CA', 'en-AU', 'en-GB'];

async function runBulkLocalization() {
  console.log("🚀 Initializing Bulk Localization Matrix...");

  // Assume there is a table for visuals or blog_posts with visual content that needs alt_texts
  // For the sake of this OS script, we'll fetch existing rows and translate them.
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, metadata')
    .limit(10); // Batch example

  if (error || !posts) {
    console.warn("⚠️ Could not fetch from blog_posts. Ensure table exists.", error?.message);
    return;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  for (const post of posts) {
    let metadata = post.metadata || {};
    let localizedHeaders: Record<string, string> = {};
    let localizedAltTexts: Record<string, string> = {};

    console.log(`Processing: ${post.title}`);

    for (const locale of targetLocales) {
      if (metadata.localized?.[locale]) continue; // Skip if already translated
      
      try {
        const prompt = `Translate the following SEO title and Alt text to ${locale}:
        Title: "${post.title}"
        Alt Text: "Heavy haul transport and escort vehicle on a highway."
        Provide response strictly in JSON format: {"translated_title": "...", "translated_alt": "..."}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{.*\}/s);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          localizedHeaders[locale] = parsed.translated_title;
          localizedAltTexts[locale] = parsed.translated_alt;
          console.log(`  ✅ Translated into ${locale}`);
        }
      } catch (err: any) {
        console.error(`  ❌ Failed translation to ${locale}:`, err.message);
      }
      
      // Intentional delay to avoid rate limits
      await new Promise(res => setTimeout(res, 500));
    }

    // Save back to DB
    const newMetadata = {
      ...metadata,
      localized: {
        ...(metadata.localized || {}),
        headers: localizedHeaders,
        alt_texts: localizedAltTexts
      }
    };

    await supabase.from('blog_posts').update({ metadata: newMetadata }).eq('id', post.id);
  }

  console.log("🎉 Bulk Localization Complete!");
}

runBulkLocalization().catch(console.error);
