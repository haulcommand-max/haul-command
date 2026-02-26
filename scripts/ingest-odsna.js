
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

/**
 * ODSNA Intelligence Extractor
 * Extracts service matrix, form fields, and competitive signals from ODSNA local HTML.
 */
async function extractODSNA() {
    console.log("🔍 Extracting ODSNA Intelligence...");

    const solutionsPath = path.join(__dirname, '../odsna_solutions.html');
    const availabilityPath = path.join(__dirname, '../odsna_availability.html');

    if (!fs.existsSync(solutionsPath) || !fs.existsSync(availabilityPath)) {
        console.error("❌ Required HTML files not found. Run download steps first.");
        return;
    }

    const solutionsHtml = fs.readFileSync(solutionsPath, 'utf8');
    const availabilityHtml = fs.readFileSync(availabilityPath, 'utf8');

    const $solutions = cheerio.load(solutionsHtml);
    const $availability = cheerio.load(availabilityHtml);

    const intel = {
        name: "ODS North America",
        website: "https://odsna.com",
        motto: "Largest and most trusted pilot escort broker in North America",
        target_audience: "Pilot Car Operators (Drivers) & Brokers/Carriers",
        value_prop_drivers: "Minimize deadhead miles. Real-time availability board. 24/7 dispatching.",
        services: [],
        availability_form: {
            id: "wpforms-4475",
            fields: []
        },
        contact: {
            dispatch_phone: "877-635-7164",
            orders_email: "orders@odsna.com",
            fax: "877-355-1492"
        },
        locations_covered: ["Alabama", "Alaska", "Alberta", "Arizona", "Arkansas", "British Columbia", "California", "Colorado", "Connecticut", "Delaware", "District Of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Manitoba", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Brunswick", "New Hampshire", "New Jersey", "New Mexico", "New York", "Newfoundland Labrador", "North Carolina", "North Dakota", "Northwest Territories", "Nova Scotia", "Ohio", "Oklahoma", "Ontario", "Oregon", "Pennsylvania", "Prince Edward Island", "Quebec", "Rhode Island", "Saskatchewan", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "Yukon"]
    };

    // Services from dropdown menu (Solutions)
    $solutions('.w-nav-list.level_2 li a .w-nav-title').each((i, el) => {
        const service = $solutions(el).text().trim();
        if (service && !intel.services.includes(service)) {
            intel.services.push(service);
        }
    });

    // Fallback search if menu structure differs
    if (intel.services.length === 0) {
        $solutions('h2, h3').each((i, el) => {
            const text = $solutions(el).text().trim();
            if (text.match(/Service|Solution|Route/i)) {
                intel.services.push(text);
            }
        });
    }

    // Availability form fields definition
    $availability('.wpforms-field-label').each((i, el) => {
        const label = $availability(el).text().trim().replace('*', '').trim().replace(/:$/, '');
        if (label && !intel.availability_form.fields.includes(label)) {
            intel.availability_form.fields.push(label);
        }
    });

    const outputPath = path.join(__dirname, '../seed/odsna-intel.json');
    fs.writeFileSync(outputPath, JSON.stringify(intel, null, 2));

    console.log(`✅ Intelligence saved to: ${outputPath}`);
    console.log(`📊 Services Found: ${intel.services.length}`);
    console.log(`📝 Form Fields: ${intel.availability_form.fields.length}`);

    return intel;
}

extractODSNA().catch(console.error);
