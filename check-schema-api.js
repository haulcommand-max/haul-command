import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function getOpenAPI() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log("Fetching", url);
    const resp = await fetch(url);
    const api = await resp.json();
    
    const tables = ['glossary_terms', 'glossary_term_usages', 'glossary_public', 'country_tiers', 'dictionary', 'hc_places', 'directory_listings'];
    
    // In OpenAPI 3.0, it's under definitions or components.schemas depending on version from Postgrest
    const schemas = api.definitions || (api.components && api.components.schemas) || {};
    
    for (const table of tables) {
        if (schemas[table]) {
            console.log(`\nTable: ${table}`);
            console.log(Object.keys(schemas[table].properties).join(', '));
        } else {
            console.log(`\nTable: ${table} NOT FOUND in OpenAPI schema.`);
        }
    }
}
getOpenAPI();
