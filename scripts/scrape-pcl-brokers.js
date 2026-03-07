/**
 * ═══════════════════════════════════════════════════════════════════
 * PILOT CAR LOADS — Broker Scraper
 * ═══════════════════════════════════════════════════════════════════
 * 
 * HOW TO USE:
 * 1. Log in to https://pilotcarloads.com/dashboard/loads in your browser
 * 2. Open DevTools (F12) → Console tab
 * 3. Paste this entire script and hit Enter
 * 4. Wait for it to finish (may take 5-10 minutes for ~95 pages)
 * 5. It will auto-download a JSON file with all brokers
 * 
 * The script:
 * - Scrolls through all load board pages
 * - Extracts company name, phone, origin, destination, date, tags
 * - Deduplicates by company name (case-insensitive)
 * - Filters out the user's own phone number
 * - Downloads results as JSON
 * ═══════════════════════════════════════════════════════════════════
 */

(async function scrapePCLBrokers() {
    const EXCLUDED_PHONES = ['(254) 245-0192', '2542450192', '254-245-0192'];
    const MAX_PAGES = 200; // Safety cap
    const DELAY_MS = 1500; // Polite delay between pages
    const allLoads = [];
    const seenCompanies = new Map(); // company_name_lower -> broker object

    console.log('🚀 PCL Broker Scraper starting...');
    console.log('Will scrape all pages from the load board.');

    // ─── Helper: wait ───
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ─── Helper: clean phone ───
    function cleanPhone(raw) {
        if (!raw) return '';
        return raw.replace(/[^0-9+]/g, '');
    }

    // ─── Helper: extract loads from current page DOM ───
    function extractLoadsFromPage() {
        const loads = [];

        // Try multiple selectors based on common load board patterns
        // Looking at the screenshots, each load is a card/row with:
        // - Company name (link, colored teal/green)
        // - ID Verified badge
        // - Origin → Destination
        // - Phone number
        // - Date
        // - Tags (High Pole, Route Survey, Quick Pay, Text Only)
        // - Open/Covered status button

        // Strategy 1: Find all load card containers
        const cards = document.querySelectorAll(
            '.load-card, .load-item, .load-row, ' +
            '[class*="load"], [class*="Load"], ' +
            'tr[class*="load"], div[class*="load"], ' +
            '.card, .list-item, ' +
            // Nuxt/Vue common patterns
            '[data-v-], .v-card, .v-list-item'
        );

        if (cards.length > 0) {
            console.log(`  Found ${cards.length} card elements`);
            cards.forEach(card => {
                const load = parseCard(card);
                if (load && load.company) loads.push(load);
            });
        }

        // Strategy 2: If cards approach didn't work, try finding by text patterns
        if (loads.length === 0) {
            console.log('  Card selectors missed, trying text-based extraction...');
            // Find all elements containing "ID Verified" or "Open" badges
            const allElements = document.querySelectorAll('*');
            const containers = new Set();

            allElements.forEach(el => {
                const text = el.textContent || '';
                if ((text.includes('ID Verified') || text.includes('Open') || text.includes('Covered'))
                    && text.includes('→')
                    && el.children.length > 0
                    && el.offsetHeight > 50
                    && el.offsetHeight < 400) {
                    // Find the closest reasonable parent container
                    let container = el;
                    while (container.parentElement && container.parentElement.offsetHeight < 500) {
                        if (container.parentElement.children.length > 1) {
                            break;
                        }
                        container = container.parentElement;
                    }
                    containers.add(container);
                }
            });

            console.log(`  Found ${containers.size} potential load containers via text matching`);
            containers.forEach(container => {
                const load = parseCard(container);
                if (load && load.company) loads.push(load);
            });
        }

        // Strategy 3: Just grab all visible text blocks that look like loads
        if (loads.length === 0) {
            console.log('  Falling back to full-page text extraction...');
            const bodyText = document.body.innerText;
            const loadBlocks = bodyText.split(/\n{2,}/);

            loadBlocks.forEach(block => {
                if (block.includes('→') && (block.includes('mi') || block.includes('miles'))) {
                    const load = parseTextBlock(block);
                    if (load && load.company) loads.push(load);
                }
            });
        }

        return loads;
    }

    // ─── Helper: parse a DOM card element ───
    function parseCard(card) {
        const text = card.innerText || '';
        const html = card.innerHTML || '';

        if (!text || text.length < 20) return null;

        const load = {
            company: '',
            id_verified: false,
            origin: '',
            destination: '',
            est_miles: '',
            rate: '',
            phone: '',
            date: '',
            posted_ago: '',
            status: '',
            tags: [],
            raw_text: text.substring(0, 500)
        };

        // Company name: usually the first link or bold text
        const links = card.querySelectorAll('a');
        for (const link of links) {
            const linkText = link.textContent.trim();
            if (linkText.length > 2 && linkText.length < 100 &&
                !linkText.match(/^(Open|Covered|Next|Prev|Load|High|Quick|Text|Route)/)) {
                load.company = linkText.replace(/\s*[-–]\s*$/, '').trim();
                break;
            }
        }

        // If no link found, try first heading or bold element
        if (!load.company) {
            const heading = card.querySelector('h1, h2, h3, h4, h5, h6, strong, b, .font-bold, .font-semibold');
            if (heading) {
                load.company = heading.textContent.trim().split('\n')[0].trim();
            }
        }

        // ID Verified
        load.id_verified = text.includes('ID Verified');

        // Origin → Destination
        const arrowMatch = text.match(/([A-Za-z\s,.']+(?:USA|Canada|CA|US)?)\s*→\s*([A-Za-z\s,.']+(?:USA|Canada|CA|US)?)/);
        if (arrowMatch) {
            load.origin = arrowMatch[1].trim();
            load.destination = arrowMatch[2].trim();
        }

        // Estimated miles
        const milesMatch = text.match(/Est\.?\s*:?\s*([\d,]+)\s*mi/i);
        if (milesMatch) load.est_miles = milesMatch[1].replace(',', '');

        // Phone number
        const phoneMatch = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (phoneMatch) {
            load.phone = phoneMatch[0];
        }

        // Rate
        const rateMatch = text.match(/(?:Contact for rate|(\$[\d,.]+\s*(?:\/\s*(?:mi|mile|day|hr|hour))?))/i);
        if (rateMatch) {
            load.rate = rateMatch[0];
        }

        // Date
        const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
        if (dateMatch) load.date = dateMatch[0];

        // Posted ago
        const agoMatch = text.match(/about\s+(\d+ (?:hour|minute|day|week)s?\s*ago)/i);
        if (agoMatch) load.posted_ago = agoMatch[1];

        // Status
        if (text.includes('Open')) load.status = 'open';
        else if (text.includes('Covered')) load.status = 'covered';

        // Tags
        const TAG_PATTERNS = ['High Pole', 'Route Survey', 'Quick Pay', 'Text Only',
            'Lead', 'Chase', 'Third Car', 'Fourth Car', 'Covered Loads'];
        TAG_PATTERNS.forEach(tag => {
            if (text.includes(tag)) load.tags.push(tag);
        });

        return load;
    }

    // ─── Helper: parse from raw text block ───
    function parseTextBlock(block) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const load = {
            company: lines[0] || '',
            id_verified: block.includes('ID Verified'),
            origin: '',
            destination: '',
            est_miles: '',
            rate: '',
            phone: '',
            date: '',
            posted_ago: '',
            status: block.includes('Open') ? 'open' : block.includes('Covered') ? 'covered' : '',
            tags: [],
            raw_text: block.substring(0, 500)
        };

        const arrowMatch = block.match(/([A-Za-z\s,.']+)\s*→\s*([A-Za-z\s,.']+)/);
        if (arrowMatch) {
            load.origin = arrowMatch[1].trim();
            load.destination = arrowMatch[2].trim();
        }

        const phoneMatch = block.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (phoneMatch) load.phone = phoneMatch[0];

        const milesMatch = block.match(/Est\.?\s*:?\s*([\d,]+)\s*mi/i);
        if (milesMatch) load.est_miles = milesMatch[1];

        const dateMatch = block.match(/\d{2}\/\d{2}\/\d{4}/);
        if (dateMatch) load.date = dateMatch[0];

        return load;
    }

    // ─── Helper: navigate to page N ───
    async function goToPage(pageNum) {
        // Try clicking the "Next" button/link
        const nextLinks = [...document.querySelectorAll('a, button')].filter(el => {
            const txt = el.textContent.trim().toLowerCase();
            return txt === 'next' || txt === 'next →' || txt === '→' || txt === 'next page' || txt.includes('next');
        });

        if (nextLinks.length > 0) {
            nextLinks[0].click();
            await wait(DELAY_MS);
            // Wait for new content to load
            await wait(1000);
            return true;
        }

        // Try page number links
        const pageLinks = [...document.querySelectorAll('a, button')].filter(el => {
            return el.textContent.trim() === String(pageNum);
        });

        if (pageLinks.length > 0) {
            pageLinks[0].click();
            await wait(DELAY_MS);
            await wait(1000);
            return true;
        }

        // Try URL manipulation
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageNum);
        window.location.href = url.toString();
        await wait(3000);
        return true;
    }

    // ─── Helper: get current page number ───
    function getCurrentPage() {
        const body = document.body.innerText;
        const pageMatch = body.match(/(\d+)\s+of\s+(\d+)/i);
        if (pageMatch) {
            return { current: parseInt(pageMatch[1]), total: parseInt(pageMatch[2]) };
        }

        // Try URL
        const url = new URL(window.location.href);
        const page = url.searchParams.get('page');
        return { current: page ? parseInt(page) : 1, total: MAX_PAGES };
    }

    // ─── MAIN SCRAPING LOOP ───
    let pageNum = 1;
    let totalPages = MAX_PAGES;
    let consecutiveEmpty = 0;

    const pageInfo = getCurrentPage();
    totalPages = pageInfo.total || MAX_PAGES;
    console.log(`📊 Detected pagination: page ${pageInfo.current} of ${totalPages}`);

    while (pageNum <= totalPages && consecutiveEmpty < 3) {
        console.log(`\n📄 Scraping page ${pageNum}/${totalPages}...`);

        const loads = extractLoadsFromPage();
        console.log(`  Found ${loads.length} loads on this page`);

        if (loads.length === 0) {
            consecutiveEmpty++;
            console.log(`  ⚠️ Empty page (${consecutiveEmpty}/3 before stopping)`);
        } else {
            consecutiveEmpty = 0;
        }

        for (const load of loads) {
            allLoads.push({ ...load, page: pageNum });

            // Dedupe brokers by company name
            if (load.company) {
                const key = load.company.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!seenCompanies.has(key)) {
                    // Filter out user's phone
                    const isUserPhone = EXCLUDED_PHONES.some(p =>
                        cleanPhone(load.phone) === cleanPhone(p)
                    );

                    seenCompanies.set(key, {
                        company: load.company,
                        id_verified: load.id_verified,
                        phone: isUserPhone ? '[REDACTED - Owner]' : load.phone,
                        origin_seen: load.origin,
                        destination_seen: load.destination,
                        status: load.status,
                        tags: load.tags,
                        first_seen_page: pageNum,
                        date: load.date,
                        rate: load.rate,
                        est_miles: load.est_miles,
                        load_count: 1
                    });
                } else {
                    // Increment load count for this broker
                    const existing = seenCompanies.get(key);
                    existing.load_count++;
                    // Collect all unique tags
                    load.tags.forEach(t => {
                        if (!existing.tags.includes(t)) existing.tags.push(t);
                    });
                }
            }
        }

        // Navigate to next page
        if (pageNum < totalPages) {
            const navigated = await goToPage(pageNum + 1);
            if (!navigated) {
                console.log('❌ Could not navigate to next page. Stopping.');
                break;
            }
        }

        pageNum++;
    }

    // ─── BUILD RESULTS ───
    const brokers = [...seenCompanies.values()];

    const results = {
        scrape_date: new Date().toISOString(),
        source: 'pilotcarloads.com',
        total_loads_scraped: allLoads.length,
        total_unique_brokers: brokers.length,
        pages_scraped: pageNum - 1,
        brokers: brokers.sort((a, b) => b.load_count - a.load_count),
        // Also include all raw loads for analysis
        all_loads: allLoads
    };

    console.log('\n═══════════════════════════════════════════');
    console.log(`✅ SCRAPING COMPLETE`);
    console.log(`   Pages scraped: ${pageNum - 1}`);
    console.log(`   Total loads:   ${allLoads.length}`);
    console.log(`   Unique brokers: ${brokers.length}`);
    console.log('═══════════════════════════════════════════');

    // ─── DOWNLOAD AS JSON ───
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcl_brokers_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 JSON file downloaded!');
    console.log('\nTop 10 most active brokers:');
    brokers.slice(0, 10).forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.company} (${b.load_count} loads) — ${b.phone}`);
    });

    // Also make results available in console
    window.__PCL_BROKERS = results;
    console.log('\n💡 Results also available as window.__PCL_BROKERS');

    return results;
})();
