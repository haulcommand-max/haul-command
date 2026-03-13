/**
 * PCL → Intelligence Schema Ingestion Bridge (v4 — volume telemetry)
 * 
 * Reads PCL broker data AND load observations, normalizes, writes to live Supabase.
 * Supports two modes:
 *   1. Broker-only (pcl-brokers-scraped.json) — creates broker entities
 *   2. Route-aware (pcl-load-observations.json) — creates full observations with corridors
 * 
 * Volume telemetry: classifies every row as demand telemetry.
 * Open rows → active_lead_eligible. Covered rows → executed_demand_proxy.
 * Column names matched precisely against deployed 0002 + 0003 migrations.
 */
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const TOKEN = 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

function query(sql) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Length': Buffer.byteLength(postData),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function esc(val) {
    if (val === null || val === undefined) return 'NULL';
    return `'${String(val).replace(/'/g, "''")}'`;
}

function normalizePhone(value) {
    if (!value) return null;
    const digits = value.replace(/\D+/g, '');
    return digits.length ? digits : null;
}

function normalizeCompanyName(name) {
    return name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildFingerprint(obs) {
    const phone = normalizePhone(obs.rawPhoneText) ?? '';
    const origin = `${obs.normalizedOriginCity ?? ''},${obs.normalizedOriginState ?? ''}`.toLowerCase().trim();
    const dest = `${obs.normalizedDestinationCity ?? ''},${obs.normalizedDestinationState ?? ''}`.toLowerCase().trim();
    const service = (obs.normalizedServiceType ?? '').toLowerCase().trim();
    const posted = obs.postedDate ?? '';
    const rateType = (obs.normalizedRateType ?? '').toLowerCase().trim();
    const rateAmount = obs.normalizedRateAmount == null ? '' : String(obs.normalizedRateAmount);
    const status = (obs.normalizedStatus ?? '').toLowerCase().trim();
    const raw = [obs.sourceName, obs.sourceSnapshotId, phone, origin, dest, service, posted, rateType, rateAmount, status].join('|');
    return crypto.createHash('sha256').update(raw).digest('hex');
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PCL → Live Intelligence Schema');
    console.log('═══════════════════════════════════════════════════════\n');

    // Load data
    const scraped = JSON.parse(fs.readFileSync(path.join('c:', 'Users', 'PC User', 'Biz', 'data', 'pcl-brokers-scraped.json'), 'utf-8'));
    const enriched = JSON.parse(fs.readFileSync(path.join('c:', 'Users', 'PC User', 'Biz', 'data', 'pcl-brokers-enriched.json'), 'utf-8'));

    const brokerMap = new Map();
    for (const b of scraped.brokers) brokerMap.set(b.company_name, { ...b });
    for (const b of enriched.brokers) { const ex = brokerMap.get(b.company_name) || {}; brokerMap.set(b.company_name, { ...ex, ...b }); }
    const brokers = Array.from(brokerMap.values());

    const sourceName = 'pilotcarloads.com';
    const scrapeDate = scraped.scrape_date || new Date().toISOString();
    const snapshotId = `pcl_${scrapeDate.replace(/[^0-9]/g, '').substring(0, 14)}`;

    console.log(`  📂 ${brokers.length} brokers | source: ${sourceName} | snapshot: ${snapshotId}`);

    // Load route-aware observations if available
    const loadObsPath = path.join('c:', 'Users', 'PC User', 'Biz', 'data', 'pcl-load-observations.json');
    let loadObservations = null;
    if (fs.existsSync(loadObsPath)) {
        loadObservations = JSON.parse(fs.readFileSync(loadObsPath, 'utf-8'));
        console.log(`  📦 ${loadObservations.observations.length} load observations found (route-aware mode)`);
    } else {
        console.log(`  📦 No load observations file — broker-only mode`);
    }
    console.log('');

    // ── 1. Import batch (actual columns: source_name, status, metadata_json) ──
    console.log('Step 1: Import batch...');
    const batch = await query(`
        INSERT INTO hc_import_batches (source_name, status, metadata_json)
        VALUES (${esc(sourceName)}, 'committed', ${esc(JSON.stringify({ snapshotId, brokerCount: brokers.length, ingestedAt: new Date().toISOString() }))})
        RETURNING id;
    `);
    const batchId = batch[0].id;
    console.log(`  ✅ batch_id: ${batchId}\n`);

    // ── 2. Source snapshot (actual columns: import_batch_id, source_name, source_snapshot_id, row_count) ──
    console.log('Step 2: Source snapshot...');
    const snap = await query(`
        INSERT INTO hc_source_snapshots (import_batch_id, source_name, source_snapshot_id, row_count)
        VALUES (${esc(batchId)}, ${esc(sourceName)}, ${esc(snapshotId)}, ${brokers.length})
        RETURNING id;
    `);
    const snapId = snap[0].id;
    console.log(`  ✅ snapshot_id: ${snapId}\n`);

    // ── 3. Emit batch events ──
    await query(`INSERT INTO hc_event_outbox (event_name, entity_type, entity_id, payload, status, aggregate_type, aggregate_id)
        VALUES ('import.batch.created', 'import_batch', ${esc(batchId)}, ${esc(JSON.stringify({ batchId, sourceName, snapshotId }))}, 'pending', 'import_batch', ${esc(batchId)});`);

    // ── 4. Determine observation source ──
    let observationItems;
    if (loadObservations && loadObservations.observations && loadObservations.observations.length > 0) {
        // Route-aware mode: each observation is a load posting
        observationItems = loadObservations.observations;
        console.log(`Step 3: Processing ${observationItems.length} route-aware observations...\n`);
    } else {
        // Broker-only fallback: each broker becomes one observation
        observationItems = brokers.map(b => ({
            company_name: b.company_name,
            phone: b.phone,
            id_verified: b.id_verified,
            tags: b.tags,
            origin_city: null,
            origin_state: null,
            destination_city: null,
            destination_state: null,
            service_type: 'pilot_car',
            status: b.active_status || 'active',
            rate_type: null,
            rate_amount: null,
            posted_date: scrapeDate.substring(0, 10),
            miles: null,
        }));
        console.log(`Step 3: Processing ${observationItems.length} broker-only observations...\n`);
    }
    const stats = { obs: 0, dup: 0, bNew: 0, bMatch: 0, cNew: 0, cMatch: 0, withRoute: 0, withRate: 0, withService: 0 };

    for (let i = 0; i < observationItems.length; i++) {
        const b = observationItems[i];
        const tag = `[${i + 1}/${observationItems.length}] ${b.company_name}`;
        const normName = normalizeCompanyName(b.company_name);
        const phone = normalizePhone(b.phone);

        // ── Match/create broker ──
        const existingBroker = await query(`SELECT id FROM hc_brokers WHERE normalized_name = ${esc(normName)} LIMIT 1;`);
        let brokerId;
        if (existingBroker.length > 0) {
            brokerId = existingBroker[0].id;
            stats.bMatch++;
        } else {
            const newBroker = await query(`
                INSERT INTO hc_brokers (canonical_name, normalized_name, primary_phone_normalized)
                VALUES (${esc(b.company_name)}, ${esc(normName)}, ${esc(phone)})
                RETURNING id;
            `);
            brokerId = newBroker[0].id;
            stats.bNew++;
            console.log(`  🆕 ${tag} → new broker ${brokerId.substring(0, 8)}`);
        }

        // ── Match/create contact ──
        let contactId = null;
        if (phone) {
            const existingContact = await query(`SELECT id FROM hc_contacts WHERE normalized_phone = ${esc(phone)} LIMIT 1;`);
            if (existingContact.length > 0) {
                contactId = existingContact[0].id;
                stats.cMatch++;
            } else {
                const newContact = await query(`
                    INSERT INTO hc_contacts (normalized_phone, raw_phone_samples)
                    VALUES (${esc(phone)}, ${esc(JSON.stringify([b.phone]))})
                    RETURNING id;
                `);
                contactId = newContact[0].id;
                stats.cNew++;
            }
            await query(`INSERT INTO hc_broker_contacts (broker_id, contact_id) VALUES (${esc(brokerId)}, ${esc(contactId)}) ON CONFLICT DO NOTHING;`);
        }

        // ── Build lane key from route data ──
        const oCity = b.origin_city?.trim() || null;
        const oState = b.origin_state?.trim() || null;
        const dCity = b.destination_city?.trim() || null;
        const dState = b.destination_state?.trim() || null;
        let laneKey = null;
        if (oCity && oState && dCity && dState) {
            laneKey = `${oCity.toLowerCase()},${oState.toLowerCase()}->${dCity.toLowerCase()},${dState.toLowerCase()}`;
            stats.withRoute++;
        }
        if (b.rate_amount != null) stats.withRate++;
        if (b.service_type) stats.withService++;

        // ── Build fingerprint ──
        const obs = {
            sourceName, sourceSnapshotId: snapshotId,
            rawPhoneText: b.phone || null,
            normalizedOriginCity: oCity, normalizedOriginState: oState,
            normalizedDestinationCity: dCity, normalizedDestinationState: dState,
            normalizedServiceType: b.service_type || 'pilot_car',
            normalizedStatus: b.status || 'active',
            normalizedRateType: b.rate_type || null,
            normalizedRateAmount: b.rate_amount ?? null,
            postedDate: b.posted_date || scrapeDate.substring(0, 10),
        };
        const fingerprint = buildFingerprint(obs);

        // ── Compute telemetry flags ──
        const isCovered = b.status === 'covered';
        const isOpen = b.status === 'open' || (!isCovered);
        const loadStatus = isCovered ? 'covered' : (isOpen ? 'open' : 'unknown');
        const activeLead = isOpen && 0.95 >= 0.70;
        const marketValueType = isCovered ? 'executed_telemetry' : (isOpen ? 'active_plus_telemetry' : 'telemetry_only');

        // ── Insert observation (full route-aware + volume telemetry columns) ──
        try {
            await query(`
                INSERT INTO hc_broker_post_observations (
                    import_batch_id, source_snapshot_uuid, source_name, source_snapshot_id,
                    canonical_broker_id, canonical_contact_id,
                    raw_text, raw_display_name, raw_phone_text,
                    raw_origin_text, raw_destination_text,
                    raw_service_text, raw_status_text, raw_rate_text, raw_tag_text,
                    normalized_phone, normalized_broker_name,
                    normalized_origin_city, normalized_origin_state,
                    normalized_destination_city, normalized_destination_state,
                    normalized_service_type, normalized_status,
                    normalized_rate_type, normalized_rate_amount,
                    normalized_miles, lane_key,
                    posted_date,
                    id_verified_flag, quick_pay_flag, text_only_flag, ny_certified_flag,
                    covered_flag, open_flag,
                    load_status, board_page_role, market_value_type,
                    active_lead_eligible, covered_volume_eligible,
                    fill_history_eligible, executed_demand_proxy,
                    parse_confidence, dedupe_confidence,
                    observation_fingerprint
                ) VALUES (
                    ${esc(batchId)}, ${esc(snapId)}, ${esc(sourceName)}, ${esc(snapshotId)},
                    ${esc(brokerId)}, ${contactId ? esc(contactId) : 'NULL'},
                    ${esc(JSON.stringify(b))}, ${esc(b.company_name)}, ${esc(b.phone)},
                    ${oCity && oState ? esc(`${oCity}, ${oState}`) : 'NULL'},
                    ${dCity && dState ? esc(`${dCity}, ${dState}`) : 'NULL'},
                    ${esc(b.service_type)}, ${esc(b.status)}, ${esc(b.rate_text || null)},
                    ${esc(JSON.stringify(b.tags || []))},
                    ${esc(phone)}, ${esc(b.company_name)},
                    ${esc(oCity)}, ${esc(oState)},
                    ${esc(dCity)}, ${esc(dState)},
                    ${esc(b.service_type || 'pilot_car')}, ${esc(b.status || 'active')},
                    ${esc(b.rate_type)}, ${b.rate_amount ?? 'NULL'},
                    ${b.miles ?? 'NULL'}, ${esc(laneKey)},
                    ${esc(b.posted_date || scrapeDate.substring(0, 10))},
                    ${b.id_verified ?? false}, ${(b.tags || []).includes('Quick Pay')}, ${(b.tags || []).includes('Text Only')}, ${(b.tags || []).includes('NY Certified')},
                    ${isCovered}, ${isOpen},
                    ${esc(loadStatus)}, 'volume_telemetry', ${esc(marketValueType)},
                    ${activeLead}, ${isCovered},
                    ${isCovered}, ${isCovered},
                    0.95, 1.0,
                    ${esc(fingerprint)}
                )
                RETURNING id;
            `);
            stats.obs++;
        } catch (e) {
            if (e.message.includes('duplicate') || e.message.includes('unique')) {
                stats.dup++;
            } else {
                console.log(`  ⚠️  ${tag}: ${e.message.substring(0, 150)}`);
            }
        }
    }

    // ── 5. Run rollups ──
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ROLLUPS');
    console.log('═══════════════════════════════════════════════════════\n');
    try {
        await query(`SELECT hc_refresh_intelligence_rollups();`);
        console.log('  ✅ hc_refresh_intelligence_rollups() completed');
    } catch (e) {
        console.log(`  ⚠️  Intelligence rollups: ${e.message.substring(0, 200)}`);
    }

    try {
        await query(`SELECT hc_refresh_volume_rollups();`);
        console.log('  ✅ hc_refresh_volume_rollups() completed');
    } catch (e) {
        console.log(`  ⚠️  Volume rollups: ${e.message.substring(0, 200)}`);
    }

    // ── 6. Verify ──
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    const checks = [
        ['hc_broker_post_observations', 'Observations'],
        ['hc_brokers', 'Brokers'],
        ['hc_contacts', 'Contacts'],
        ['hc_broker_contacts', 'Broker-Contact links'],
        ['hc_import_batches', 'Import batches'],
        ['hc_source_snapshots', 'Source snapshots'],
    ];
    for (const [tbl, label] of checks) {
        try {
            const r = await query(`SELECT count(*) as cnt FROM ${tbl};`);
            console.log(`  📋 ${label}: ${r[0].cnt}`);
        } catch (e) { console.log(`  ⚠️  ${label}: error`); }
    }

    // Dashboard views
    const views = [
        ['hc_dashboard_broker_profile_v1', 'Broker Profile Dashboard'],
        ['hc_dashboard_corridor_demand_v1', 'Corridor Demand Dashboard'],
        ['hc_dashboard_pricing_repost_v1', 'Pricing Repost Dashboard'],
        ['hc_mv_market_volume_30d', 'Market Volume 30d'],
        ['hc_mv_lane_fill_scorecard_30d', 'Lane Fill Scorecard 30d'],
        ['hc_mv_broker_volume_scorecard_30d', 'Broker Volume Scorecard 30d'],
    ];
    console.log('');
    for (const [view, label] of views) {
        try {
            const r = await query(`SELECT count(*) as cnt FROM ${view};`);
            console.log(`  📊 ${label}: ${r[0].cnt} rows`);
        } catch (e) { console.log(`  ⚠️  ${label}: ${e.message.substring(0, 100)}`); }
    }

    // Events in outbox
    try {
        const r = await query(`SELECT count(*) as cnt FROM hc_event_outbox WHERE status = 'pending';`);
        console.log(`\n  📤 Events pending in outbox: ${r[0].cnt}`);
    } catch (e) { }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  ✅ Observations ingested: ${stats.obs}`);
    console.log(`  🔁 Exact duplicates suppressed: ${stats.dup}`);
    console.log(`  🆕 Brokers created: ${stats.bNew}`);
    console.log(`  🔗 Brokers matched: ${stats.bMatch}`);
    console.log(`  🆕 Contacts created: ${stats.cNew}`);
    console.log(`  🔗 Contacts matched: ${stats.cMatch}`);
    console.log('');
    const total = stats.obs + stats.dup;
    console.log('  ── QA Completeness ──');
    console.log(`  🛣️  Route completeness: ${total > 0 ? Math.round(stats.withRoute / total * 100) : 0}% (${stats.withRoute}/${total})`);
    console.log(`  💰 Rate completeness:   ${total > 0 ? Math.round(stats.withRate / total * 100) : 0}% (${stats.withRate}/${total})`);
    console.log(`  🏷️  Service completeness: ${total > 0 ? Math.round(stats.withService / total * 100) : 0}% (${stats.withService}/${total})`);
    const monetReady = total > 0 && (stats.withRoute / total >= 0.8) && (stats.withRate / total >= 0.5) && (stats.withService / total >= 0.9);
    console.log(`  📊 Monetization ready: ${monetReady ? '✅ YES' : '❌ NO'}`);
    console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('\n❌ FATAL:', err.message);
    process.exit(1);
});
