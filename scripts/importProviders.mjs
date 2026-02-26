
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { parsePhoneNumber } from 'libphonenumber-js';
import crypto from 'crypto'; // helper for UUID generation if needed

// --- CONFIGURATION ---
const BATCH_SIZE = 50;
const CSV_FILENAME = 'providers.csv';

// --- ENV LOADING ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

console.log(`Loading env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        // Skip comments
        if (line.startsWith('#')) return;

        // Find first equals sign
        const firstEquals = line.indexOf('=');
        if (firstEquals !== -1) {
            const key = line.substring(0, firstEquals).trim();
            let value = line.substring(firstEquals + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            if (key && value) {
                process.env[key] = value;
            }
        }
    });
    console.log('Loaded .env.local');
} else {
    console.warn('Warning: .env.local not found at', envPath);
}

// Check keys
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase keys. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

// --- SUPABASE SETUP ---
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: { persistSession: false }
    }
);

// --- MAIN ---
async function main() {
    const csvPath = path.resolve(__dirname, `../seed/${CSV_FILENAME}`);
    if (!fs.existsSync(csvPath)) {
        console.error(`File not found: ${csvPath}`);
        process.exit(1);
    }

    console.log(`Reading CSV: ${csvPath}`);
    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`Parsing ${records.length} rows...`);

    // 1. Fetch existing contacts for De-duplication
    // We want to avoid creating new Provider IDs if the phone number already exists.
    console.log("Fetching existing contacts for deduplication...");

    // We'll fetch in pages or just grab 'phone_e164' and 'provider_id'.
    // 8000 records * 50 bytes = 400KB. Easy.
    let allExistingContacts = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('provider_contacts')
            .select('phone_e164, provider_key')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error fetching existing contacts:", error);
            break;
        }
        if (!data || data.length === 0) break;
        allExistingContacts = allExistingContacts.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    const phoneToProviderId = new Map();
    allExistingContacts.forEach(c => {
        if (c.phone_e164) phoneToProviderId.set(c.phone_e164, c.provider_key);
    });

    console.log(`Found ${phoneToProviderId.size} existing unique phones.`);

    // 2. Prepare Data Map (Dedup CSV internal)
    const uniqueMap = new Map(); // Phone -> Data

    for (const row of records) {
        let countryCode = 'US'; // Default
        if (row.country) {
            const c = row.country.toUpperCase();
            if (c === 'CANADA' || c === 'CA') countryCode = 'CA';
        }

        const phoneRaw = row.phone_e164 || row.phone_raw || row.phone || row['phone number'];
        if (!phoneRaw) continue; // Skip no-phone records for now

        let phoneE164 = null;
        try {
            const pn = parsePhoneNumber(phoneRaw, countryCode);
            if (pn && pn.isValid()) {
                phoneE164 = pn.number;
            }
        } catch (e) { }

        if (!phoneE164) continue;

        // Check duplicate in CSV
        if (uniqueMap.has(phoneE164)) continue;

        uniqueMap.set(phoneE164, {
            name: row.name_raw || row.name || row.company || 'Unknown',
            phone: phoneE164,
            raw_phone: phoneRaw,
            email: row.email,
            role: row.role,
            source: row.source || 'csv_import',
            city: row.city,
            state: row.state,
            country: countryCode,
            status: row.status
        });
    }

    const cleanRecords = Array.from(uniqueMap.values());
    console.log(`Ready to upsert ${cleanRecords.length} unique providers from CSV.`);

    // 3. Process Chunked Upserts
    let newCount = 0;
    let updatedCount = 0;

    const chunks = chunkArray(cleanRecords, BATCH_SIZE);

    for (const chunk of chunks) {
        const providersPayload = [];
        const contactPayloads = [];

        for (const rec of chunk) {
            let pId = phoneToProviderId.get(rec.phone);

            if (!pId) {
                // New Provider
                pId = crypto.randomUUID();
                newCount++;
            } else {
                updatedCount++;
            }

            providersPayload.push({
                provider_key: pId,
                name_raw: rec.name,
                name_norm: rec.name.toLowerCase().trim(),
                provider_type: determineType(rec.role),
                source: rec.source || 'csv_import',
                city: rec.city,
                state: rec.state,
                country: rec.country,
                trust_score: 50, // default start
            });

            contactPayloads.push({
                provider_key: pId,
                phone_e164: rec.phone,
                phone_raw: rec.raw_phone,
                email: rec.email || null,
                is_primary: true
            });

            phoneToProviderId.set(rec.phone, pId); // Update local map
        }

        // Upsert Providers
        const { error: pError } = await supabase
            .from('providers')
            .upsert(providersPayload);

        if (pError) {
            console.error("Provider Upsert Error:", pError);
        } else {
            // Upsert Contacts
            const { error: cError } = await supabase
                .from('provider_contacts')
                .upsert(contactPayloads, { onConflict: 'provider_key, phone_e164, email', ignoreDuplicates: true });

            if (cError) {
                console.error("Contact Upsert Error:", cError);
            }
        }
        process.stdout.write('.');
    }

    console.log(`\nImport Process Complete.`);
    console.log(`New Providers: ${newCount}`);
    console.log(`Updated Providers: ${updatedCount}`);
}

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

function determineType(role) {
    if (!role) return 'pilot_car';
    const r = role.toLowerCase();
    if (r.includes('broker')) return 'broker';
    if (r.includes('pilot')) return 'pilot_car';
    if (r.includes('police')) return 'police';
    if (r.includes('permit')) return 'permit_service';
    return 'pilot_car';
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
