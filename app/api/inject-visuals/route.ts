import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Use Production Env Vars exactly as Vercel runs them
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching live blog posts from Supabase...', supabaseUrl);
  
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, content_html, cover_image');

  if (error) {
    return NextResponse.json({ success: false, error });
  }

  let updatedCount = 0;

  for (const post of posts || []) {
    let updatedHtml = post.content_html || '';
    let updatedContent = false;
    
    // Inject Interactive Tools
    if (!updatedHtml.includes('[INJECT_BRIDGE_CLEARANCE]')) {
      updatedHtml += '\n\n<h2>Live Routing Analytics</h2>\n[INJECT_BRIDGE_CLEARANCE]\n';
      updatedContent = true;
    }
    
    if (!updatedHtml.includes('[INJECT_AXLE_WEIGHT_TOOL]')) {
      updatedHtml += '\n[INJECT_AXLE_WEIGHT_TOOL]\n';
      updatedContent = true;
    }
    
    const randomImageId = Math.floor(Math.random() * 1000) + 1;
    const coverImage = post.cover_image || `https://picsum.photos/id/${randomImageId}/1200/630`;
    
    if (!updatedHtml.includes('<img')) {
      updatedHtml = `<figure><img src="${coverImage}" alt="Heavy Haul Transport in ${post.slug}" class="rounded-xl my-6" /><figcaption class="text-xs text-gray-500 text-center">AI-Enhanced Heavy Haul Visual Simulation</figcaption></figure>` + updatedHtml;
      updatedContent = true;
    }

    if (updatedContent || !post.cover_image) {
      await supabase
        .from('blog_posts')
        .update({ 
          content_html: updatedHtml,
          cover_image: coverImage
        })
        .eq('id', post.id);
      
      updatedCount++;
    }
  }

  return NextResponse.json({ success: true, updatedCount, totalFound: posts?.length });
}
