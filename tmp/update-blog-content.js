/**
 * update-blog-content.js
 *
 * Updates the escort-reciprocity-guide blog post with:
 * 1. Question-based H2 headings for AI search optimization
 * 2. Contextual internal links (glossary, requirements)
 * 3. External authority links (FHWA, ESCA, state DOTs)
 *
 * Run: node tmp/update-blog-content.js
 * 
 * NOTE: If PostgREST schema cache doesn't have blog_posts exposed,
 * you'll need to either:
 *   a) Reload the schema cache in Supabase Dashboard → Database → Reloading
 *   b) Apply this update via the Supabase SQL editor
 */
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function tryUpdateViaREST() {
  // First, try to fetch the existing post
  const fetchResp = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.escort-reciprocity-guide&select=id,slug,content_html`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (fetchResp.status === 404 || fetchResp.status === 400) {
    console.log('❌ blog_posts table not accessible via REST API (PostgREST schema cache issue)');
    console.log('');
    console.log('To fix, run in Supabase SQL Editor:');
    console.log('  NOTIFY pgrst, \'reload schema\';');
    console.log('');
    console.log('Or apply the content update SQL directly in the SQL Editor:');
    generateSQLUpdate();
    return false;
  }

  const posts = await fetchResp.json();
  if (!posts || posts.length === 0) {
    console.log('❌ Post "escort-reciprocity-guide" not found');
    return false;
  }

  const post = posts[0];
  console.log(`✅ Found post: ${post.id}`);
  console.log(`   Content length: ${post.content_html?.length || 0} chars`);

  // Apply heading transformations
  let html = post.content_html;
  html = transformHeadings(html);
  html = addInternalLinks(html);
  html = addExternalLinks(html);

  // Update the post
  const updateResp = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${post.id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        content_html: html,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (updateResp.ok) {
    console.log('✅ Blog post content updated successfully!');
    return true;
  } else {
    const err = await updateResp.text();
    console.log('❌ Update failed:', updateResp.status, err);
    return false;
  }
}

function transformHeadings(html) {
  const headingMap = [
    [/(<h2[^>]*>)\s*(?:THE\s+PROBLEM:?\s*)?50\s+STATES,?\s*50\s+RULE\s+SETS\s*(<\/h2>)/gi,
     '$1Why are there 50 different escort certification standards?$2\n<p>Every U.S. state maintains its own escort vehicle operator certification program, creating a patchwork of requirements that costs multi-state operators thousands in duplicate training and fees.</p>'],

    [/(<h2[^>]*>)\s*FULL\s+RECIPROCITY\s+STATES\s*(<\/h2>)/gi,
     '$1Which states offer full escort certification reciprocity?$2\n<p>Eight states currently accept any valid P/EVO certification from another state, making them the easiest for multi-state operators to work in without additional training or fees.</p>'],

    [/(<h2[^>]*>)\s*PARTIAL\s+RECIPROCITY\s+STATES\s*(<\/h2>)/gi,
     '$1Which states have partial P/EVO certification reciprocity?$2\n<p>Several states accept certifications from neighboring or specific states, but require additional steps—like refresher courses or written exams—from operators certified elsewhere.</p>'],

    [/(<h2[^>]*>)\s*NO\s+CERTIFICATION\s+REQUIRED\s+STATES\s*(<\/h2>)/gi,
     '$1Which states don\'t require escort vehicle certification?$2\n<p>A handful of states have no formal P/EVO certification requirement, though operators must still meet equipment and insurance standards.</p>'],

    [/(<h2[^>]*>)\s*STATES\s+WITH\s+NO\s+RECIPROCITY\s*\(?STATE[- ]SPECIFIC\s+ONLY\)?\s*(<\/h2>)/gi,
     '$1Which states require their own state-specific escort certification?$2\n<p>These states do not honor any out-of-state certifications. Operators must complete the state\'s approved training program and pass their exam to operate legally.</p>'],

    [/(<h2[^>]*>)\s*COST\s+COMPARISON\s*(<\/h2>)/gi,
     '$1How much does certification cost with vs. without reciprocity?$2\n<p>Leveraging reciprocity agreements can save operators thousands of dollars annually compared to obtaining individual state certifications.</p>'],

    [/(<h2[^>]*>)\s*THE\s+ESCA\s+PUSH\s+FOR\s+NATIONAL\s+STANDARDS\s*(<\/h2>)/gi,
     '$1What is ESCA doing to create national escort certification standards?$2\n<p>The Escort Service Coordinators Association has been lobbying since 2023 for a federally recognized national certification, which would eliminate the reciprocity patchwork entirely.</p>'],

    [/(<h2[^>]*>)\s*WHAT\s+YOU\s+SHOULD\s+DO\s+NOW\s*(<\/h2>)/gi,
     '$1What steps should escort operators take in 2026?$2\n<p>Five concrete actions to minimize certification costs and maximize your operating coverage across state lines.</p>'],
  ];

  for (const [pattern, replacement] of headingMap) {
    html = html.replace(pattern, replacement);
  }

  return html;
}

function addInternalLinks(html) {
  // Link glossary terms
  html = html.replace(
    /\bP\/EVO\b(?![^<]*<\/a>)/g,
    '<a href="/glossary/pevo" title="Pilot/Escort Vehicle Operator - Haul Command Glossary">P/EVO</a>'
  );

  // Only replace first instance of certain terms to avoid over-linking
  html = html.replace(
    /\bCDL\b(?![^<]*<\/a>)/,
    '<a href="/glossary/cdl" title="Commercial Driver\'s License - Haul Command Glossary">CDL</a>'
  );

  // Link state-specific requirements (first occurrence only)
  const stateLinks = {
    'Oregon': '/requirements?state=OR',
    'Washington': '/requirements?state=WA',
    'Montana': '/requirements?state=MT',
    'Texas': '/requirements?state=TX',
    'California': '/requirements?state=CA',
    'New York': '/requirements?state=NY',
    'Florida': '/requirements?state=FL',
    'Pennsylvania': '/requirements?state=PA',
  };

  for (const [state, url] of Object.entries(stateLinks)) {
    // Only link first bold occurrence to avoid cluttering
    const pattern = new RegExp(`<strong>${state}</strong>(?![^<]*</a>)`);
    html = html.replace(
      pattern,
      `<strong><a href="${url}" title="${state} escort requirements">${state}</a></strong>`
    );
  }

  return html;
}

function addExternalLinks(html) {
  // Link ODOT
  html = html.replace(
    /\bODOT\b(?![^<]*<\/a>)/,
    '<a href="https://www.oregon.gov/odot/" target="_blank" rel="noopener noreferrer" title="Oregon Department of Transportation">ODOT</a>'
  );

  // Link TxDMV
  html = html.replace(
    /\bTxDMV\b(?![^<]*<\/a>)/,
    '<a href="https://www.txdmv.gov/" target="_blank" rel="noopener noreferrer" title="Texas Department of Motor Vehicles">TxDMV</a>'
  );

  // Link ESCA (first occurrence)
  html = html.replace(
    /\bESCA\b(?![^<]*<\/a>)/,
    '<a href="https://www.escortservicecoordinators.org/" target="_blank" rel="noopener noreferrer" title="Escort Service Coordinators Association">ESCA</a>'
  );

  // Link CHP
  html = html.replace(
    /\bCHP\b(?![^<]*<\/a>)/,
    '<a href="https://www.chp.ca.gov/" target="_blank" rel="noopener noreferrer" title="California Highway Patrol">CHP</a>'
  );

  // Link ADOT
  html = html.replace(
    /\bADOT\b(?![^<]*<\/a>)/,
    '<a href="https://azdot.gov/" target="_blank" rel="noopener noreferrer" title="Arizona Department of Transportation">ADOT</a>'
  );

  // Link FHWA
  html = html.replace(
    /\bFHWA\b(?![^<]*<\/a>)/,
    '<a href="https://www.fhwa.dot.gov/specialpermits/" target="_blank" rel="noopener noreferrer" title="Federal Highway Administration - Special Permits">FHWA</a>'
  );

  return html;
}

function generateSQLUpdate() {
  console.log('========================================');
  console.log('ALTERNATIVE: Run this SQL in Supabase SQL Editor');
  console.log('========================================');
  console.log(`
-- First reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Then update the blog post content
-- (Run a SELECT first to get the current content_html, apply transforms, and UPDATE)
UPDATE blog_posts 
SET updated_at = NOW()
WHERE slug = 'escort-reciprocity-guide';

-- NOTE: The heading transformations and link additions 
-- should be applied programmatically using the script above
-- after the schema cache is reloaded.
`);
}

// Run
tryUpdateViaREST().then(success => {
  if (!success) {
    console.log('\n💡 If the REST API fails, run this in the Supabase SQL Editor:');
    console.log("   NOTIFY pgrst, 'reload schema';");
    console.log('   Then re-run this script.');
  }
});
