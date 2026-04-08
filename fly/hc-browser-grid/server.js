import http from 'http';
import { chromium } from 'playwright';

const PORT = 8080;

// Simple authentication token verification
const AUTH_TOKEN = process.env.GRID_SECRET || 'dev-local-secret';

const server = http.createServer(async (req, res) => {
    // 1. Health check for Fly config
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', worker: 'Browser Grid Edge Node' }));
        return;
    }

    // 2. Action Endpoint
    if (req.method === 'POST' && req.url === '/execute') {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
            res.writeHead(401);
            res.end('Unauthorized');
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const { url, selectors = [], wait_for = null } = payload;
                
                if (!url) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing required field: url' }));
                    return;
                }

                console.log(`[BrowserGrid] Spinning up incognito context for: ${url}`);
                // Launch lightweight headless browser
                const browser = await chromium.launch({
                    headless: true,
                    args: [
                        '--disable-gpu',
                        '--disable-dev-shm-usage',
                        '--disable-setuid-sandbox',
                        '--no-sandbox'
                    ]
                });
                
                const context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                });
                const page = await context.newPage();

                // Go to page
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                
                if (wait_for) {
                    await page.waitForSelector(wait_for, { timeout: 15000 }).catch(e => console.log('Timeout waiting for selector'));
                }

                const extractions = {};
                if (selectors.length > 0) {
                    for (const s of selectors) {
                        try {
                            const elements = await page.$$(s.query);
                            extractions[s.key] = await Promise.all(
                                elements.map(async el => {
                                    if (s.type === 'attribute') {
                                        return await el.getAttribute(s.attribute);
                                    }
                                    return await el.innerText();
                                })
                            );
                        } catch (e) {
                            extractions[s.key] = [];
                        }
                    }
                }

                // Default return: page title and html
                const title = await page.title();
                const content = await page.content();
                
                await browser.close();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    title, 
                    extractions,
                    // content: content.substring(0, 5000) // Truncate content for bandwidth if needed
                }));

            } catch (err) {
                console.error('[BrowserGrid] Execution error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Default 404
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`[BrowserGrid] Edge execution node listening on port ${PORT}`);
});
