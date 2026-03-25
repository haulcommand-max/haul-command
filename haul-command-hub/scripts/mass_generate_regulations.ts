import fs from 'fs';
import path from 'path';

const existingStr = fs.readFileSync(path.join(__dirname, '../src/data/international_requirements.json'), 'utf8');
const reqData = JSON.parse(existingStr);

export const COUNTRY_NAMES: Record<string, string> = {
    us: "United States", ca: "Canada", au: "Australia", gb: "United Kingdom", nz: "New Zealand",
    za: "South Africa", de: "Germany", nl: "Netherlands", ae: "United Arab Emirates", br: "Brazil",
    ie: "Ireland", se: "Sweden", no: "Norway", dk: "Denmark", fi: "Finland", be: "Belgium",
    at: "Austria", ch: "Switzerland", es: "Spain", fr: "France", it: "Italy", pt: "Portugal",
    sa: "Saudi Arabia", qa: "Qatar", mx: "Mexico", pl: "Poland", cz: "Czech Republic",
    sk: "Slovakia", hu: "Hungary", si: "Slovenia", ee: "Estonia", lv: "Latvia", lt: "Lithuania",
    hr: "Croatia", ro: "Romania", bg: "Bulgaria", gr: "Greece", tr: "Turkey", kw: "Kuwait",
    om: "Oman", bh: "Bahrain", sg: "Singapore", my: "Malaysia", jp: "Japan", kr: "South Korea",
    cl: "Chile", ar: "Argentina", co: "Colombia", pe: "Peru",
    in: "India", id: "Indonesia", th: "Thailand", vn: "Vietnam", ph: "Philippines",
    uy: "Uruguay", pa: "Panama", cr: "Costa Rica", ng: "Nigeria",
};

// Start output with existing data
const allOutput: Record<string, any> = { ...reqData.international };

for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
    const slug = name.toLowerCase().replace(/ /g, '-');
    if (code === 'us' || allOutput[slug]) continue;

    allOutput[slug] = {
        country_code: code.toUpperCase(),
        general: `Permits issued by the National Ministry of Transport or respective regional authorities in ${name}.`,
        max_width_without_escort: "2.6 meters (8.5 feet)",
        escort_trigger_width: "3.0 meters (9.8 feet)",
        escort_trigger_length: "18.0 meters",
        axle_weights: {
            single: "10.0 tonnes",
            tandem: "18.0 tonnes",
            tridem: "24.0 tonnes"
        },
        weekend_travel: "Conditional. Often restricted from Friday sunset to Monday sunrise.",
        notes: "Generated regulatory baseline rule set for " + name
    };
}

fs.writeFileSync(
    path.join(__dirname, '../src/data/international_requirements.json'), 
    JSON.stringify({ international: allOutput }, null, 2)
);

console.log(`Generated ${Object.keys(allOutput).length} country regulations.`);
