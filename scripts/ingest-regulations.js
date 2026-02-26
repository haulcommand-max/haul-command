
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 0. Manual Env Loader
try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
        console.log("Loaded .env.local");
    }
} catch (e) {
    console.warn("No .env.local");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing DB credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const urlsPath = path.join(__dirname, '../seed/regulation-urls.json');
const urls = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

// Mappings
const STATE_MAP = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD', 'massachusetts': 'MA',
    'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT',
    'nebraska': 'NE', 'nevada': 'NV', 'new_hampshire': 'NH', 'new_jersey': 'NJ', 'new_mexico': 'NM',
    'new_york': 'NY', 'north_carolina': 'NC', 'north_dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode_island': 'RI', 'south_carolina': 'SC', 'south_dakota': 'SD',
    'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA',
    'washington': 'WA', 'west_virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',

    // Canada
    'alberta': 'AB', 'british_columbia': 'BC', 'manitoba': 'MB', 'new_brunswick': 'NB',
    'newfoundland': 'NL', 'northwest_territories': 'NT', 'nova_scotia': 'NS', 'ontario': 'ON',
    'quebec': 'QC', 'saskatchewan': 'SK', 'yukon': 'YT'
};

async function scrapeUrl(url) {
    console.log(`\nScraping: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        // Cleaning strategy
        // We want the main text.
        // Strip <script>, <style>, <nav>, headers

        let content = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "")
            .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gmi, "")
            .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gmi, "")
            .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gmi, "")
            .replace(/<!--[\s\S]*?-->/g, "");

        // Extract Body
        const bodyMatch = content.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) content = bodyMatch[1];

        // Naive HTML to Markdownish text
        // Replace <br> with newline
        const textStats = content
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/tr>/gi, '\n')
            .replace(/<[^>]+>/g, ' ') // Strip remaining tags
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();

        // Metadata
        const filename = url.split('/').pop();
        const stateKey = filename.split('_pilot_car')[0]; // 'alabama', 'new_york'

        const stateCode = STATE_MAP[stateKey] || 'XX';
        const stateName = stateKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const country = ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'ON', 'QC', 'SK', 'YT'].includes(stateCode) ? 'CA' : 'US';

        return {
            state_code: stateCode,
            state_name: stateName,
            country: country,
            content: textStats.substring(0, 100000), // Limit size
            url: url
        };

    } catch (err) {
        console.error(`Error: ${err.message}`);
        return null;
    }
}

async function run() {
    for (const url of urls) {
        const data = await scrapeUrl(url);
        if (data && data.state_code !== 'XX') {
            const { error } = await supabase.from('state_regulations')
                .upsert({
                    state_code: data.state_code,
                    country: data.country,
                    state_name: data.state_name,
                    content_markdown: data.content,
                    source_url: data.url
                }, { onConflict: 'state_code, country' });

            if (error) console.error("DB Error:", error.message);
            else console.log(`   Saved ${data.state_name} (${data.state_code})`);
        }
        await new Promise(r => setTimeout(r, 600));
    }
    console.log("Done.");
}

run();
