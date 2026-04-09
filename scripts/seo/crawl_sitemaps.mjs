import fs from 'fs';
import fetch from 'node-fetch'; // assuming node 18+ anyway

const DOMAIN = 'https://www.haulcommand.com';
const START_SITEMAP = `${DOMAIN}/sitemap.xml`;

async function fetchSitemapUrls(sitemapUrl) {
    const res = await fetch(sitemapUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${sitemapUrl}`);
    const xml = await res.text();
    
    const urls = [];
    // Super simple regex to extract locs
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        if(match[1].endsWith('.xml')) {
            // It's a sitemap index, fetch children
            const childUrls = await fetchSitemapUrls(match[1]);
            urls.push(...childUrls);
        } else {
            urls.push(match[1]);
        }
    }
    return urls;
}

async function runCrawler() {
    console.log(`📡 Fetching sitemaps from ${START_SITEMAP}...`);
    let urls = [];
    try {
        urls = await fetchSitemapUrls(START_SITEMAP);
        console.log(`✅ Found ${urls.length} URLs to crawl.`);
    } catch(e) {
        console.error('❌ Sitemap fetch failed:', e);
        process.exit(1);
    }
    
    // De-dupe URLs
    urls = [...new Set(urls)];
    
    console.log(`🚀 Initiating HEAD swarm for ${urls.length} endpoints (Concurrency: 50)...`);
    
    const BATCH_SIZE = 50;
    let errors = [];
    let completed = 0;
    
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (url) => {
            try {
                // Using GET with abort to mimic real browser request closely, HEAD is sometimes blocked
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const res = await fetch(url, { 
                    method: 'GET', 
                    signal: controller.signal,
                    headers: { 'User-Agent': 'HaulCommand-SwarmCrawler/1.0' }
                });
                clearTimeout(timeoutId);
                
                if (res.status >= 400 && res.status !== 405) {
                    errors.push({ url, status: res.status });
                }
            } catch(e) {
                if(e.name === 'AbortError') {
                    errors.push({ url, status: 'TIMEOUT' });
                } else {
                    errors.push({ url, status: e.message });
                }
            }
            completed++;
            if (completed % 100 === 0) {
                console.log(`⏳ Progress: ${completed}/${urls.length}`);
            }
        });
        await Promise.allSettled(promises);
    }
    
    console.log(`\n🏁 Crawl Complete.`);
    console.log(`✅ Total URLs Scanned: ${urls.length}`);
    if (errors.length > 0) {
        console.log(`❌ Found ${errors.length} broken endpoints:`);
        errors.slice(0, 50).forEach(err => console.log(`   [${err.status}] ${err.url}`));
        if(errors.length > 50) console.log(`   ...and ${errors.length - 50} more.`);
    } else {
        console.log(`🎉 100% HEALTHY. Zero 404 dead ends across the entire map.`);
    }
}

runCrawler();
