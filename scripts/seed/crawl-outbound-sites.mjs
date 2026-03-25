import * as fs from 'fs';
import * as path from 'path';

// Load the 105 outbound websites from our extraction
const seedPath = path.join(process.cwd(), 'data', 'uspilotcars_all_contacts.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
const outboundUrls = seed.outboundWebsites || [];

function extractPhones(text) {
  const rx = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return Array.from(new Set(text.match(rx) || []));
}

function extractEmails(text) {
  const rx = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(rx) || [];
  // Filter noise
  return Array.from(new Set(found.filter(e => 
    !e.includes('example.com') && 
    !e.includes('sentry') && 
    !e.includes('wixpress') &&
    !e.includes('schema.org') &&
    !e.endsWith('.png') &&
    !e.endsWith('.jpg')
  )));
}

function extractSocials(text, links) {
  const socials = {};
  const patterns = [
    { key: 'facebook', rx: /(?:facebook\.com|fb\.com)\/[^\s"'<>]+/gi },
    { key: 'instagram', rx: /instagram\.com\/[^\s"'<>]+/gi },
    { key: 'linkedin', rx: /linkedin\.com\/(?:company|in)\/[^\s"'<>]+/gi },
    { key: 'twitter', rx: /(?:twitter\.com|x\.com)\/[^\s"'<>]+/gi },
    { key: 'youtube', rx: /youtube\.com\/[^\s"'<>]+/gi },
    { key: 'tiktok', rx: /tiktok\.com\/@[^\s"'<>]+/gi },
  ];

  const fullText = text + ' ' + links.join(' ');
  for (const { key, rx } of patterns) {
    const matches = fullText.match(rx);
    if (matches && matches.length > 0) {
      socials[key] = [...new Set(matches)];
    }
  }
  return socials;
}

async function crawlOperatorSite(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 HaulCommandBot/1.0' },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);
    
    if (!res.ok) return { url, success: false, status: res.status };
    
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    
    // Extract all href links
    const linkRx = /href=["']([^"']+)["']/gi;
    const links = [];
    let m;
    while ((m = linkRx.exec(html)) !== null) {
      links.push(m[1]);
    }
    
    const phones = extractPhones(text);
    const emails = extractEmails(text);
    const socials = extractSocials(html, links);
    
    // Extract company name from title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || null;
    
    // Extract address patterns
    const addressRx = /\d{1,5}\s+[\w\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Hwy|Highway)[.,]?\s*(?:\w+[.,]?\s*)?(?:[A-Z]{2}\s*\d{5})/gi;
    const addresses = text.match(addressRx) || [];
    
    // Extract service descriptions
    const serviceKeywords = ['pilot car', 'escort', 'height pole', 'route survey', 'oversize', 'overweight', 
      'wide load', 'heavy haul', 'steering', 'permits', 'flagging', 'bucket truck', 'crane'];
    const detectedServices = serviceKeywords.filter(kw => text.toLowerCase().includes(kw));
    
    // Extract state certifications
    const certRx = /(?:certified|certification|cert)\s*(?:in\s+)?(?:[\w\s,]+(?:state|NY|CA|TX|FL|WA|OR|OH|PA|IL|GA|CO|AZ|NM|UT|NV|ID|MT|WY|ND|SD|NE|KS|OK|AR|LA|MS|AL|TN|KY|WV|VA|NC|SC|MO|IA|MN|WI|MI|IN|ME|VT|NH|MA|RI|CT|NJ|DE|MD|DC))/gi;
    const certMatches = text.match(certRx) || [];
    
    return {
      url,
      success: true,
      title,
      phones,
      emails,
      socials,
      addresses: [...new Set(addresses)].slice(0, 3),
      detectedServices,
      certifications: [...new Set(certMatches)].slice(0, 10),
      totalLinks: links.length
    };
  } catch (e) {
    return { url, success: false, error: e.message };
  }
}

async function main() {
  console.log(`[Anti-Gravity] 🌐 OUTBOUND EXPANSION CRAWL - ${outboundUrls.length} operator websites`);
  
  const results = [];
  let successCount = 0;
  let emailsFound = 0;
  let socialsFound = 0;
  
  // Process in batches of 5
  for (let i = 0; i < outboundUrls.length; i += 5) {
    const batch = outboundUrls.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(url => crawlOperatorSite(url)));
    
    for (const r of batchResults) {
      results.push(r);
      if (r.success) {
        successCount++;
        emailsFound += r.emails?.length || 0;
        socialsFound += Object.keys(r.socials || {}).length;
      }
    }
    
    console.log(`  ✅ Batch ${Math.floor(i/5)+1}/${Math.ceil(outboundUrls.length/5)} (${successCount} live, ${emailsFound} emails, ${socialsFound} social profiles)`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  const output = {
    meta: {
      source: "uspilotcars.com outbound expansion",
      extractedAt: new Date().toISOString(),
      totalSitesCrawled: outboundUrls.length,
      successfulCrawls: successCount,
      failedCrawls: outboundUrls.length - successCount,
      totalEmailsFound: emailsFound,
      totalSocialProfiles: socialsFound
    },
    sites: results
  };
  
  const outPath = path.join(process.cwd(), 'data', 'outbound_expansion_results.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  
  console.log(`\n[Anti-Gravity] ====== EXPANSION CRAWL COMPLETE ======`);
  console.log(`  🌐 Sites crawled: ${outboundUrls.length}`);
  console.log(`  ✅ Live sites: ${successCount}`);
  console.log(`  📧 Emails found: ${emailsFound}`);
  console.log(`  📱 Social profiles: ${socialsFound}`);
  console.log(`  💾 Saved to: data/outbound_expansion_results.json`);
  
  // Print email summary
  const allEmails = results.flatMap(r => r.emails || []);
  if (allEmails.length > 0) {
    console.log(`\n  📧 Extracted Emails:`);
    for (const email of [...new Set(allEmails)]) {
      console.log(`     ${email}`);
    }
  }
}

main();
