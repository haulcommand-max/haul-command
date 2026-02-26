#!/usr/bin/env node
/**
 * Typesense Bootstrap — Create collections if missing (idempotent)
 *
 * Usage:
 *   TYPESENSE_API_KEY=admin-key node scripts/typesense/bootstrap-collections.js
 */

const fs = require("fs");
const path = require("path");

const PROTOCOL = process.env.TYPESENSE_PROTOCOL || "http";
const HOST = process.env.TYPESENSE_HOST || "localhost";
const PORT = process.env.TYPESENSE_PORT || "8108";
const API_KEY = process.env.TYPESENSE_API_KEY || process.env.TYPESENSE_API_KEY_ADMIN;

if (!API_KEY) {
    console.error("❌ Set TYPESENSE_API_KEY (admin key)");
    process.exit(1);
}

const BASE_URL = `${PROTOCOL}://${HOST}:${PORT}`;
const SCHEMAS_DIR = path.join(__dirname, "../../infra/typesense/collections");

async function createOrUpdate(schemaPath) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    const name = schema.name;
    console.log(`\n📇 ${name}:`);

    // Check if collection exists
    const checkRes = await fetch(`${BASE_URL}/collections/${name}`, {
        headers: { "X-TYPESENSE-API-KEY": API_KEY },
    });

    if (checkRes.ok) {
        console.log(`  ✅ Already exists. Checking field updates...`);

        const existing = await checkRes.json();
        const existingFields = new Set(existing.fields?.map(f => f.name) || []);
        const newFields = schema.fields.filter(f => !existingFields.has(f.name));

        if (newFields.length > 0) {
            console.log(`  📝 Adding ${newFields.length} new field(s)...`);
            const updateRes = await fetch(`${BASE_URL}/collections/${name}`, {
                method: "PATCH",
                headers: {
                    "X-TYPESENSE-API-KEY": API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fields: newFields }),
            });
            if (updateRes.ok) {
                console.log(`  ✅ Fields updated`);
            } else {
                console.error(`  ⚠️ Update failed:`, await updateRes.text());
            }
        } else {
            console.log(`  ✅ All fields present`);
        }
    } else if (checkRes.status === 404) {
        console.log(`  🆕 Creating collection...`);
        const createRes = await fetch(`${BASE_URL}/collections`, {
            method: "POST",
            headers: {
                "X-TYPESENSE-API-KEY": API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(schema),
        });
        if (createRes.ok) {
            console.log(`  ✅ Created`);
        } else {
            console.error(`  ❌ Create failed:`, await createRes.text());
        }
    } else {
        console.error(`  ❌ Unexpected status ${checkRes.status}:`, await checkRes.text());
    }
}

async function createSearchKey() {
    console.log(`\n🔑 Creating search-only API key...`);
    const res = await fetch(`${BASE_URL}/keys`, {
        method: "POST",
        headers: {
            "X-TYPESENSE-API-KEY": API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            description: "Search-only key for hc-web",
            actions: ["documents:search"],
            collections: ["driver_profiles", "loads", "corridors"],
        }),
    });
    if (res.ok) {
        const key = await res.json();
        console.log(`  ✅ Search key created: ${key.value}`);
        console.log(`  📋 Set TYPESENSE_API_KEY_SEARCH=${key.value} in your web app env`);
    } else {
        const body = await res.text();
        if (body.includes("already exists")) {
            console.log(`  ✅ Search key already exists`);
        } else {
            console.error(`  ⚠️ Key creation:`, body);
        }
    }
}

(async () => {
    console.log(`🚀 Typesense Bootstrap — ${BASE_URL}`);

    // Health check
    const health = await fetch(`${BASE_URL}/health`, {
        headers: { "X-TYPESENSE-API-KEY": API_KEY },
    }).catch(() => null);

    if (!health?.ok) {
        console.error("❌ Typesense not reachable at", BASE_URL);
        process.exit(1);
    }
    console.log("✅ Typesense healthy");

    // Create/update collections
    const schemas = fs.readdirSync(SCHEMAS_DIR).filter(f => f.endsWith(".json"));
    for (const schema of schemas) {
        await createOrUpdate(path.join(SCHEMAS_DIR, schema));
    }

    // Create search-only key
    await createSearchKey();

    console.log("\n✅ Bootstrap complete!");
})();
