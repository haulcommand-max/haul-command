import * as fs from 'fs';
import * as path from 'path';

const INPUT_FILE = path.join(__dirname, '../../data/pilot_cars_raw.txt');
const OUTPUT_FILE = path.join(__dirname, '../../seed_ingested_drivers.sql');

const parseDrivers = () => {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`File not found: ${INPUT_FILE}`);
        return;
    }

    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const lines = rawData.split('\n');

    // SQL Header
    let sql = `-- Auto-Generated Seed Data from pilot_cars_raw.txt\n`;
    sql += `INSERT INTO driver_profiles (status, home_market_id, home_jurisdiction_id, pevo_cert_number, insurance_policy_number) VALUES\n`;

    const values = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        // Naive parsing based on the tab/observation of the file structure
        // Pattern seems to be: Name Phone Email Equipment State Source
        // But spacing is irregular. Let's try regex to find the Phone Number as an anchor.

        // Regex for (XXX)XXX-XXXX or similar
        const phoneMatch = line.match(/(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4})/);

        if (phoneMatch && phoneMatch.index) {
            const namePart = line.substring(0, phoneMatch.index).trim();
            const rest = line.substring(phoneMatch.index + phoneMatch[0].length).trim();

            // Extract Email (simple regex)
            const emailMatch = rest.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            let email = '';
            let afterEmail = rest;

            if (emailMatch) {
                email = emailMatch[0];
                const emailIndex = rest.indexOf(email);
                afterEmail = rest.substring(emailIndex + email.length).trim();
            }

            // Extract State (Looking for 2-letter codes at the end or before "Vendors PDF")
            // The file ends with "Vendors PDF".
            // Let's assume the 2-letter code before "Vendors PDF" is the state.
            let state = 'US';
            // Clean "Vendors PDF"
            const cleanEnd = afterEmail.replace('Vendors PDF', '').trim();
            // Take the last 2 chars as state if they are uppercase
            if (cleanEnd.length >= 2) {
                const potentialState = cleanEnd.substring(cleanEnd.length - 2);
                if (/^[A-Z]{2}$/.test(potentialState)) {
                    state = `US-${potentialState}`;
                }
            }

            // Mock Data for missing fields
            const status = 'PENDING_VERIFICATION';

            // Escape single quotes for SQL
            const safeName = namePart.replace(/'/g, "''");

            values.push(`('${status}', 'US', '${state}', NULL, NULL) -- ${safeName} | ${email}`);
        }
    }

    if (values.length > 0) {
        sql += values.join(',\n') + ';';
        fs.writeFileSync(OUTPUT_FILE, sql);
        console.log(`Successfully generated SQL for ${values.length} drivers: ${OUTPUT_FILE}`);
    } else {
        console.log('No valid drivers parsed.');
    }
};

parseDrivers();
