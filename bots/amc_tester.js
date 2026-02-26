const { chromium } = require('playwright');

(async () => {
    console.log('Starting AMC Pilot Car Supply Dropship Test...');

    // Launch browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    try {
        // Direct navigation to the target product (The Rattler)
        const productUrl = 'https://amcpilotcarsupply.com/products/the-rattler-pilot-car-high-pole-package';
        console.log(`Navigating directly to product: ${productUrl}`);
        await page.goto(productUrl, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');
        await page.screenshot({ path: 'bots/step1_product_page_direct.png' });
        console.log('Product page loaded.');

        // Handle Variants (Color Selection) - if required
        // Look for a select dropdown or radio buttons for options
        const variantSelect = page.locator('select, input[type="radio"]').first();
        if (await variantSelect.isVisible()) {
            console.log('Variants detected. Attempting to select first simplified option...');
            // Logic to select an option would go here. For now, we try to see if we can add to cart.
            // Many Shopify/WooCommerce sites default to the first option.
            // If it's a select box:
            const selectTag = await page.$('select');
            if (selectTag) {
                await selectTag.selectOption({ index: 1 }); // Select 2nd option (index 1) to be safe, or 0
                console.log('Selected an option from dropdown.');
            }
        }

        // Add to Cart
        // Try multiple common selectors for "Add to Cart"
        const addToCartSelectors = [
            'button[name="add"]',
            'button[type="submit"]:has-text("Add to cart")',
            'button:has-text("Add to cart")',
            '.product-form__submit',
            '#AddToCart'
        ];

        let added = false;
        for (const selector of addToCartSelectors) {
            const btn = page.locator(selector).first();
            if (await btn.isVisible()) {
                console.log(`Found Add to Cart button with selector: ${selector}`);
                await btn.click();
                added = true;
                break;
            }
        }

        if (!added) {
            console.log('Could not find standard "Add to Cart" button. Dumping page text for debug...');
            const bodyText = await page.innerText('body');
            console.log(bodyText.substring(0, 500) + '...');
            throw new Error('Add to Cart button not found.');
        }

        console.log('Clicked "Add to Cart". Waiting for feedback...');
        await page.waitForTimeout(4000); // Wait for extraction/cart drawer
        await page.screenshot({ path: 'bots/step2_after_add_to_cart.png' });

        // Go to Checkout
        // Often a new modal or cart page appears.
        // We can force navigate to /checkout or /cart
        console.log('Navigating to Checkout...');
        await page.goto('https://amcpilotcarsupply.com/checkout', { timeout: 60000 });
        // Fallback if /checkout redirects to /cart
        if (page.url().includes('/cart')) {
            console.log('Landed on Cart page. clicking Checkout...');
            const checkoutBtn = page.locator('button[name="checkout"], input[name="checkout"], a[href="/checkout"]').first();
            if (await checkoutBtn.isVisible()) {
                await checkoutBtn.click();
            }
        }

        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'bots/step3_checkout_page.png' });
        console.log(`Reached Checkout URL: ${page.url()}`);
        console.log('Ghost Order Test Successful!');

    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: 'bots/error_snapshot_v2.png' });
    } finally {
        await browser.close();
        console.log('Test complete.');
    }
})();
