#!/usr/bin/env node
/**
 * HAUL COMMAND — Overpass Surface Explosion Script
 * 
 * Fires Overpass queries for all 57 countries across 6 surface types.
 * Upserts results into hc_surfaces, promotes to hc_entity, enqueues SEO pages.
 * 
 * Usage:
 *   node scripts/overpass-explosion.mjs
 *   node scripts/overpass-explosion.mjs --tiers A      # Only Tier A
 *   node scripts/overpass-explosion.mjs --tiers D      # Quick test
 *   node scripts/overpass-explosion.mjs --types ports_harbours  # One type
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
];

const TEMPLATES = {
    fuel_and_services: {
        type: 'fuel_or_services',
        query: `[out:json][timeout:180];area["ISO3166-1"="{{CC}}"]->.a;(nwr(area.a)["amenity"="fuel"];nwr(area.a)["highway"="services"];nwr(area.a)["highway"="rest_area"];);out center tags;`
    },
    truck_parking: {
        type: 'truck_parking',
        query: `[out:json][timeout:180];area["ISO3166-1"="{{CC}}"]->.a;(nwr(area.a)["amenity"="parking"]["parking"="truck"];nwr(area.a)["amenity"="parking"]["hgv"="yes"];);out center tags;`
    },
    hotels_motels: {
        type: 'hotel_or_motel',
        query: `[out:json][timeout:180];area["ISO3166-1"="{{CC}}"]->.a;(nwr(area.a)["tourism"="hotel"];nwr(area.a)["tourism"="motel"];);out center tags;`
    },
    ports_harbours: {
        type: 'port_or_harbour',
        query: `[out:json][timeout:180];area["ISO3166-1"="{{CC}}"]->.a;(nwr(area.a)["harbour"];nwr(area.a)["landuse"="port"];);out center tags;`
    },
    logistics_industrial: {
        type: 'industrial_or_warehouse',
        query: `[out:json][timeout:180];area["ISO3166-1"="{{CC}}"]->.a;(nwr(area.a)["building"="warehouse"];nwr(area.a)["industrial"="logistics"];);out center tags;`
    },
    freight_terminals: {
        type: 'freight_terminal',
        query: `[out:json][timeout:180];area["ISO3166-1"="{{CC}}"]->.a;(nwr(area.a)["railway"="freight_terminal"];nwr(area.a)["aeroway"="cargo_terminal"];nwr(area.a)["amenity"="ferry_terminal"];);out center tags;`
    }
};

const TIER_CAPS = { A: 25000, B: 12000, C: 6000, D: 3000 };

// Parse args
const args = process.argv.slice(2);
const tierArg = args.includes('--tiers') ? args[args.indexOf('--tiers') + 1]?.split(',') : null;
const typeArg = args.includes('--types') ? args[args.indexOf('--types') + 1]?.split(',') : null;
const concurrency = args.includes('--concurrency') ? parseInt(args[args.indexOf('--concurrency') + 1]) : 4;

async function fetchOverpass(query, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 200000);

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (resp.status === 429 || resp.status >= 500) {
                const wait = Math.min(5000 * Math.pow(2, attempt), 60000) + Math.random() * 2000;
                console.log(`  ⏳ Rate limited (${resp.status}), waiting ${(wait / 1000).toFixed(1)}s...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            if (!resp.ok) throw new Error(`Overpass ${resp.status}`);
            return await resp.json();
        } catch (e) {
            if (attempt === retries - 1) throw e;
            console.log(`  ⚠️  Retry ${attempt + 1}: ${e.message}`);
            await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        }
    }
}

async function processCountry(country) {
    const cc = country.iso2;
    const tier = country.tier;
    const cap = TIER_CAPS[tier] || 6000;
    const templates = typeArg || Object.keys(TEMPLATES);
    const results = [];

    console.log(`\n🌍 ${cc} (${country.name}, Tier ${tier}, cap ${cap})`);

    for (const key of templates) {
        const tmpl = TEMPLATES[key];
        if (!tmpl) continue;

        const query = tmpl.query.replace(/{{CC}}/g, cc);
        console.log(`  📡 ${key}...`);

        try {
            const data = await fetchOverpass(query);
            const elements = (data?.elements || []).slice(0, cap);
            console.log(`  ✅ ${elements.length} elements`);

            if (elements.length === 0) {
                results.push({ template: key, elements: 0, upserted: 0 });
                continue;
            }

            // Batch upsert in chunks of 500
            let totalUpserted = 0;
            for (let i = 0; i < elements.length; i += 500) {
                const chunk = elements.slice(i, i + 500);
                const { data: rpcResult, error } = await sb.rpc('hc_surface_upsert_from_overpass', {
                    p_country_code: cc,
                    p_surface_type: tmpl.type,
                    p_elements: chunk,
                });
                if (error) {
                    console.error(`  ❌ Upsert error:`, error.message);
                } else {
                    totalUpserted += rpcResult?.upserted || 0;
                }
            }

            console.log(`  💾 ${totalUpserted} upserted`);
            results.push({ template: key, elements: elements.length, upserted: totalUpserted });

            // Polite pause between queries
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error(`  ❌ ${key}: ${e.message}`);
            results.push({ template: key, error: e.message });
        }
    }

    // Promote surfaces to entities
    const { data: promoteResult } = await sb.rpc('hc_surface_promote_to_entity', { p_limit: cap });
    console.log(`  🔄 Promoted: ${promoteResult?.promoted || 0}`);

    // Enqueue SEO
    const { data: seoResult } = await sb.rpc('hc_seo_enqueue_surfaces_country', { p_country: cc, p_cap: cap });
    console.log(`  📄 SEO queued: ${seoResult?.seo_queued || 0}`);

    return {
        country: cc,
        tier,
        results,
        promoted: promoteResult?.promoted || 0,
        seo_queued: seoResult?.seo_queued || 0,
        total_elements: results.reduce((s, r) => s + (r.elements || 0), 0),
        total_upserted: results.reduce((s, r) => s + (r.upserted || 0), 0),
    };
}

async function main() {
    console.log('🚀 HAUL COMMAND — Overpass Surface Explosion');
    console.log('============================================\n');

    // Get countries from registry
    const { data: countries, error } = await sb
        .from('global_countries')
        .select('iso2, tier, name')
        .eq('status', 'active')
        .order('tier');

    if (error || !countries) {
        console.error('Failed to fetch countries:', error);
        process.exit(1);
    }

    const filtered = tierArg
        ? countries.filter(c => tierArg.includes(c.tier))
        : countries;

    console.log(`Processing ${filtered.length} countries (tiers: ${tierArg || 'all'})`);
    console.log(`Surface types: ${typeArg || 'all 6'}`);
    console.log(`Concurrency: ${concurrency}\n`);

    const allResults = [];

    // Process in waves
    for (let i = 0; i < filtered.length; i += concurrency) {
        const wave = filtered.slice(i, i + concurrency);
        console.log(`\n═══ WAVE ${Math.floor(i / concurrency) + 1}/${Math.ceil(filtered.length / concurrency)} ═══`);

        const waveResults = await Promise.allSettled(
            wave.map(c => processCountry(c))
        );

        for (const r of waveResults) {
            if (r.status === 'fulfilled') allResults.push(r.value);
            else console.error('Wave error:', r.reason);
        }

        // Pause between waves
        if (i + concurrency < filtered.length) {
            console.log('\n⏸️  Wave cooldown (5s)...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    // Final stats
    console.log('\n\n════════════════════════════════════════════');
    console.log('📊 FINAL RESULTS');
    console.log('════════════════════════════════════════════\n');

    const totalElements = allResults.reduce((s, r) => s + (r.total_elements || 0), 0);
    const totalUpserted = allResults.reduce((s, r) => s + (r.total_upserted || 0), 0);
    const totalPromoted = allResults.reduce((s, r) => s + (r.promoted || 0), 0);
    const totalSeo = allResults.reduce((s, r) => s + (r.seo_queued || 0), 0);

    console.log(`Countries processed: ${allResults.length}`);
    console.log(`Total elements from Overpass: ${totalElements.toLocaleString()}`);
    console.log(`Total surfaces upserted: ${totalUpserted.toLocaleString()}`);
    console.log(`Total entities promoted: ${totalPromoted.toLocaleString()}`);
    console.log(`Total SEO pages queued: ${totalSeo.toLocaleString()}`);

    // Run health check
    const { data: health } = await sb.rpc('hc_system_health_check');
    console.log('\n📋 System Health:');
    console.log(JSON.stringify(health, null, 2));

    // Top countries
    console.log('\n🏆 Top countries by surfaces:');
    allResults
        .sort((a, b) => b.total_upserted - a.total_upserted)
        .slice(0, 15)
        .forEach(r => {
            console.log(`  ${r.country} (Tier ${r.tier}): ${r.total_upserted.toLocaleString()} surfaces, ${r.promoted} entities`);
        });
}

main().catch(console.error);
