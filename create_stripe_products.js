const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function run() {
    try {
        const p1 = await stripe.products.create({ name: 'HC Certified Operator' });
        const pr1 = await stripe.prices.create({ product: p1.id, unit_amount: 19900, currency: 'usd' });

        const p2 = await stripe.products.create({ name: 'AV Ready Certification' });
        const pr2 = await stripe.prices.create({ product: p2.id, unit_amount: 9900, currency: 'usd' });

        const p3 = await stripe.products.create({ name: 'HC Elite Certification' });
        const pr3 = await stripe.prices.create({ product: p3.id, unit_amount: 29900, currency: 'usd' });

        console.log(`\nSTRIPE_PRICE_HC_CERTIFIED="${pr1.id}"`);
        console.log(`STRIPE_PRICE_AV_READY="${pr2.id}"`);
        console.log(`STRIPE_PRICE_HC_ELITE="${pr3.id}"`);
    } catch(e) {
        console.log("Error:", e);
    }
}
run();
