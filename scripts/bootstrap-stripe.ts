/**
 * scripts/bootstrap-stripe.ts
 * 
 * Creates all subscription products in Stripe via API.
 * Saves returned price_id values to billing_plans table in Supabase.
 * 
 * Run once: npx tsx scripts/bootstrap-stripe.ts
 *
 * Requires: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !STRIPE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-03-31.basil' as any });

interface PlanConfig {
  slug: string;
  name: string;
  description: string;
  features: string[];
  prices: {
    interval: 'month' | 'year' | 'one_time';
    amount_cents: number;
    label: string;
  }[];
}

const PLANS: PlanConfig[] = [
  {
    slug: 'verified-operator',
    name: 'Verified Operator',
    description: 'Get the verified badge ✓ — 5× more broker trust and faster booking.',
    features: [
      'Verified badge on profile',
      'Priority in search results',
      'Corridor ranking boost',
      'Compliance document vault',
      'Direct broker messages',
    ],
    prices: [
      { interval: 'one_time', amount_cents: 14900, label: '$149 one-time' },
    ],
  },
  {
    slug: 'pro-operator',
    name: 'Pro Operator',
    description: 'Full platform access with AdGrid boost, analytics, and priority matching.',
    features: [
      'Everything in Verified',
      'AdGrid boost credits ($50/mo)',
      'Corridor analytics dashboard',
      'Priority load matching',
      'Rate intelligence',
      'Multi-state coverage',
      'API access (100 req/day)',
    ],
    prices: [
      { interval: 'month', amount_cents: 9900, label: '$99/month' },
      { interval: 'year', amount_cents: 99000, label: '$990/year (save 2 months)' },
    ],
  },
  {
    slug: 'brand-defense',
    name: 'Brand Defense',
    description: 'Protect your brand on Haul Command. Lock your profile, corridors, and ads.',
    features: [
      'Locked operator profile',
      'Competitor ad blocking on your profile',
      'Brand monitoring alerts',
      'Priority support',
      'Custom branding on profile',
    ],
    prices: [
      { interval: 'month', amount_cents: 4900, label: '$49/month' },
      { interval: 'year', amount_cents: 49000, label: '$490/year (save 2 months)' },
    ],
  },
];

async function main() {
  console.log('🚀 Stripe Product Bootstrap');
  console.log('═'.repeat(50));

  // Check if billing_plans already has Stripe price IDs
  const { data: existing } = await supabase
    .from('billing_plans')
    .select('slug, stripe_price_id')
    .not('stripe_price_id', 'is', null);

  if (existing && existing.length > 0) {
    console.log(`⚠️  billing_plans already has ${existing.length} Stripe price IDs:`);
    existing.forEach(p => console.log(`   - ${p.slug}: ${p.stripe_price_id}`));
    console.log('\n   To re-bootstrap, clear stripe_price_id values first.');
    console.log('   Skipping to avoid duplicate products.');
    return;
  }

  const results: { plan: string; product_id: string; prices: { interval: string; price_id: string; amount: string }[] }[] = [];

  for (const plan of PLANS) {
    console.log(`\n📦 Creating product: ${plan.name}`);

    // Create Stripe product
    const product = await stripe.products.create({
      name: `Haul Command — ${plan.name}`,
      description: plan.description,
      metadata: {
        hc_plan_slug: plan.slug,
        features: plan.features.join(' · '),
      },
    });
    console.log(`   Product ID: ${product.id}`);

    const planPrices: { interval: string; price_id: string; amount: string }[] = [];

    for (const priceConfig of plan.prices) {
      let price: Stripe.Price;

      if (priceConfig.interval === 'one_time') {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceConfig.amount_cents,
          currency: 'usd',
          metadata: { hc_plan_slug: plan.slug, label: priceConfig.label },
        });
      } else {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceConfig.amount_cents,
          currency: 'usd',
          recurring: { interval: priceConfig.interval },
          metadata: { hc_plan_slug: plan.slug, label: priceConfig.label },
        });
      }

      console.log(`   Price: ${priceConfig.label} → ${price.id}`);
      planPrices.push({
        interval: priceConfig.interval,
        price_id: price.id,
        amount: priceConfig.label,
      });
    }

    results.push({ plan: plan.name, product_id: product.id, prices: planPrices });

    // Save to Supabase billing_plans
    const primaryPrice = planPrices[0];
    const annualPrice = planPrices.find(p => p.interval === 'year');

    await supabase.from('billing_plans').upsert({
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      features: plan.features,
      stripe_product_id: product.id,
      stripe_price_id: primaryPrice.price_id,
      stripe_annual_price_id: annualPrice?.price_id ?? null,
      price_monthly_cents: plan.prices.find(p => p.interval === 'month')?.amount_cents ?? null,
      price_yearly_cents: plan.prices.find(p => p.interval === 'year')?.amount_cents ?? null,
      price_onetime_cents: plan.prices.find(p => p.interval === 'one_time')?.amount_cents ?? null,
      is_active: true,
    }, { onConflict: 'slug' });

    console.log(`   ✅ Saved to billing_plans`);
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 BOOTSTRAP SUMMARY');
  console.log('═'.repeat(50));
  results.forEach(r => {
    console.log(`\n  ${r.plan}`);
    console.log(`    Product: ${r.product_id}`);
    r.prices.forEach(p => console.log(`    ${p.amount}: ${p.price_id}`));
  });
  console.log('\n✅ All products created and saved to billing_plans');
  console.log('   Pricing page at /pricing will now show live Stripe checkout links.');
}

main().catch(err => {
  console.error('❌ Bootstrap failed:', err.message);
  process.exit(1);
});
