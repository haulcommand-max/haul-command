const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto('https://uspilotcars.com/state_pilot_car_guidelines.html', { waitUntil: 'domcontentloaded' });
        const text = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('guidelines_dump.txt', text);
        console.log("Dumped guidelines.");
    } catch(e) {
        console.error(e);
    }
    await browser.close();
}
run();
