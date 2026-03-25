import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const STATE_PAGES = [
  "https://uspilotcars.com/alabama_pilot_car.html",
  "https://uspilotcars.com/alaska_pilot_car.html",
  "https://uspilotcars.com/arizona_pilot_car.html",
  "https://uspilotcars.com/arkansas_pilot_car.html",
  "https://uspilotcars.com/california_pilot_car.html",
  "https://uspilotcars.com/colorado_pilot_car.html",
  "https://uspilotcars.com/connecticut_pilot_car.html",
  "https://uspilotcars.com/delaware_pilot_car.html",
  "https://uspilotcars.com/florida_pilot_car.html",
  "https://uspilotcars.com/georgia_pilot_car.html",
  "https://uspilotcars.com/idaho_pilot_car.html",
  "https://uspilotcars.com/illinois_pilot_car.html",
  "https://uspilotcars.com/indiana_pilot_car.html",
  "https://uspilotcars.com/iowa_pilot_car.html",
  "https://uspilotcars.com/kansas_pilot_car.html",
  "https://uspilotcars.com/kentucky_pilot_car.html",
  "https://uspilotcars.com/louisiana_pilot_car.html",
  "https://uspilotcars.com/maine_pilot_car.html",
  "https://uspilotcars.com/maryland_pilot_car.html",
  "https://uspilotcars.com/massachusetts_pilot_car.html",
  "https://uspilotcars.com/michigan_pilot_car.html",
  "https://uspilotcars.com/minnesota_pilot_car.html",
  "https://uspilotcars.com/mississippi_pilot_car.html",
  "https://uspilotcars.com/missouri_pilot_car.html",
  "https://uspilotcars.com/montana_pilot_car.html",
  "https://uspilotcars.com/nebraska_pilot_car.html",
  "https://uspilotcars.com/nevada_pilot_car.html",
  "https://uspilotcars.com/new_hampshire_pilot_car.html",
  "https://uspilotcars.com/new_jersey_pilot_car.html",
  "https://uspilotcars.com/new_mexico_pilot_car.html",
  "https://uspilotcars.com/new_york_pilot_car.html",
  "https://uspilotcars.com/north_carolina_pilot_car.html",
  "https://uspilotcars.com/north_dakota_pilot_car.html",
  "https://uspilotcars.com/ohio_pilot_car.html",
  "https://uspilotcars.com/oklahoma_pilot_car.html",
  "https://uspilotcars.com/oregon_pilot_car.html",
  "https://uspilotcars.com/pennsylvania_pilot_car.html",
  "https://uspilotcars.com/rhode_island_pilot_car.html",
  "https://uspilotcars.com/south_carolina_pilot_car.html",
  "https://uspilotcars.com/south_dakota_pilot_car.html",
  "https://uspilotcars.com/tennesee_pilot_car.html",
  "https://uspilotcars.com/texas_pilot_car.html",
  "https://uspilotcars.com/utah_pilot_car.html",
  "https://uspilotcars.com/vermont_pilot_cars.html",
  "https://uspilotcars.com/virginia_pilot_car.html",
  "https://uspilotcars.com/washington_pilot_car.html",
  "https://uspilotcars.com/west_virginia_pilot_car.html",
  "https://uspilotcars.com/wisconsin_pilot_car.html",
  "https://uspilotcars.com/wyoming_pilot_car.html",
  "https://uspilotcars.com/alberta_pilot_cars.html",
  "https://uspilotcars.com/british_columbia_pilot_cars.html",
  "https://uspilotcars.com/nova_scotia_pilot_cars.html",
  "https://uspilotcars.com/ontario_pilot_car.html",
  "https://uspilotcars.com/quebec_pilot_cars.html",
  "https://uspilotcars.com/saskatchewan_pilot_cars.html"
];

function extractPhones(text) {
  const rx = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return Array.from(new Set(text.match(rx) || []));
}

function extractEmails(text) {
  const rx = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return Array.from(new Set(text.match(rx) || []));
}

function stateFromUrl(url) {
  const match = url.match(/\/([a-z_]+)_pilot_car/);
  if (match) return match[1].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const match2 = url.match(/\/([a-z_]+)_pilot_cars/);
  if (match2) return match2[1].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return 'Unknown';
}

async function scrapeStatePage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 HaulCommandBot/1.0' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Remove navigation noise
    $('script, style, noscript, iframe, svg').remove();
    const bodyText = $('body').text();
    
    const state = stateFromUrl(url);
    const operators = [];
    const allOutbound = [];
    
    // Extract all outbound operator websites
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http') && !href.includes('uspilotcars.com') && !href.includes('paypal.com') && !href.includes('accuweather') && !href.includes('sunrisesunset')) {
        allOutbound.push(href);
      }
    });
    
    // Strategy: Parse the body text line by line looking for CITY + NAME + PHONE patterns
    // The site uses a pattern: CITY_NAME\nCOMPANY_NAME service_codes\nPHONE_NUMBER
    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let currentCity = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const phones = extractPhones(line);
      
      if (phones.length > 0) {
        // This line has a phone. The previous non-phone line is likely the company name.
        // Look backwards for the company name
        let companyName = null;
        let city = currentCity;
        
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const prev = lines[j];
          if (extractPhones(prev).length === 0 && prev.length > 2 && prev.length < 100) {
            // Check if it looks like a city (ALL CAPS, short) vs company name
            if (prev === prev.toUpperCase() && prev.length < 30 && !prev.includes('PILOT') && !prev.includes('SERVICE') && !prev.includes('ESCORT') && !prev.includes('LLC') && !prev.includes('INC')) {
              city = prev;
            } else if (!companyName) {
              // Strip service superscript codes like "1 2 3 4"
              companyName = prev.replace(/\s+[1-5]\s*/g, ' ').replace(/\s+WITPAC/g, '').replace(/\s+CEVO/g, '').replace(/\s+WINPAC/g, '').trim();
            }
          }
        }
        
        if (companyName && companyName.length > 2) {
          // Detect services from the line context
          const services = [];
          const context = (lines[i-1] || '') + ' ' + line;
          if (context.includes('1') || context.includes('Height') || context.includes('HEIGHT')) services.push('Height Pole');
          if (context.includes('2') || context.includes('Route') || context.includes('ROUTE')) services.push('Route Survey');
          if (context.includes('3') || context.includes('Multiple') || context.includes('MULTI')) services.push('Multiple Cars');
          if (context.includes('4') || context.includes('Steer') || context.includes('STEER')) services.push('Steering');
          
          operators.push({
            name: companyName,
            phone: phones[0],
            allPhones: phones,
            city: city,
            region: state,
            services: services,
            sourceUrl: url
          });
        }
      } else if (line === line.toUpperCase() && line.length > 2 && line.length < 35 && !line.includes('PILOT') && !line.includes('SERVICE') && !line.includes('ESCORT')) {
        // Likely a city header
        currentCity = line;
      }
    }
    
    return { state, operators, outboundLinks: [...new Set(allOutbound)] };
  } catch (e) {
    console.error(`Failed: ${url} - ${e.message}`);
    return { state: stateFromUrl(url), operators: [], outboundLinks: [] };
  }
}

async function main() {
  console.log(`[Anti-Gravity] 🚀 FULL DIRECTORY SCRAPE - ${STATE_PAGES.length} state/province pages`);
  
  const allOperators = [];
  const allOutbound = [];
  const stateStats = {};
  
  // Process in batches of 5 to not overload
  for (let i = 0; i < STATE_PAGES.length; i += 5) {
    const batch = STATE_PAGES.slice(i, i + 5);
    const results = await Promise.all(batch.map(url => scrapeStatePage(url)));
    
    for (const result of results) {
      if (result.operators) {
        allOperators.push(...result.operators);
        stateStats[result.state] = result.operators.length;
      }
      if (result.outboundLinks) {
        allOutbound.push(...result.outboundLinks);
      }
    }
    
    console.log(`  ✅ Batch ${Math.floor(i/5)+1}/${Math.ceil(STATE_PAGES.length/5)} done (${allOperators.length} operators so far)`);
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Deduplicate operators by phone number
  const seen = new Set();
  const dedupedOperators = [];
  for (const op of allOperators) {
    const key = op.phone?.replace(/\D/g, '');
    if (key && seen.has(key)) {
      // Find existing and merge coverage
      const existing = dedupedOperators.find(e => e.phone?.replace(/\D/g, '') === key);
      if (existing && op.city && !existing.coverageCities?.includes(op.city)) {
        existing.coverageCities = existing.coverageCities || [existing.city];
        existing.coverageCities.push(op.city);
        if (!existing.coverageStates) existing.coverageStates = [existing.region];
        if (!existing.coverageStates.includes(op.region)) existing.coverageStates.push(op.region);
      }
      continue;
    }
    if (key) seen.add(key);
    dedupedOperators.push(op);
  }
  
  const uniqueOutbound = [...new Set(allOutbound)];
  
  const output = {
    meta: {
      source: "https://uspilotcars.com/pilot_car_directory.html",
      extractedAt: new Date().toISOString(),
      totalStatesScraped: Object.keys(stateStats).length,
      totalRawOperators: allOperators.length,
      totalDedupedOperators: dedupedOperators.length,
      totalOutboundWebsites: uniqueOutbound.length,
      stateBreakdown: stateStats
    },
    operators: dedupedOperators,
    outboundWebsites: uniqueOutbound
  };
  
  const outDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  const outPath = path.join(outDir, 'uspilotcars_all_contacts.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  
  console.log(`\n[Anti-Gravity] ====== EXTRACTION COMPLETE ======`);
  console.log(`  📊 States scraped: ${Object.keys(stateStats).length}`);
  console.log(`  👥 Raw operators found: ${allOperators.length}`);
  console.log(`  🎯 After dedup: ${dedupedOperators.length}`);
  console.log(`  🌐 Outbound websites: ${uniqueOutbound.length}`);
  console.log(`  💾 Saved to: data/uspilotcars_all_contacts.json`);
  
  // Print top states
  const sorted = Object.entries(stateStats).sort((a, b) => b[1] - a[1]);
  console.log(`\n  📈 Top states by operator count:`);
  for (const [state, count] of sorted.slice(0, 15)) {
    console.log(`     ${state}: ${count}`);
  }
}

main();
