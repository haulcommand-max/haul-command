import { batchIngestYaml } from '../lib/ingestion/engine';

const sampleYaml = `
vendors:
  - name: "007 PILOT CAR Ryan Patrick Toner"
    phone: "6098648845"
    email: "ry.grampians@yandex.com"
    state: "TN"
    capabilities_raw: null
    source: "Vendors PDF"

  - name: "1 Arkansas Pilot Car Services Robert Adams"
    phone: "4023053765"
    email: "arkpcs@yahoo.com"
    state: "AR"
    capabilities_raw: "TWIC"
    source: "Vendors PDF"

  - name: "10 Anstorm Sabre PCS LLC Marcy Y. Olsufka"
    phone: "4022702125"
    email: "anstormsabrep...@gmail.com"
    state: "NE"
    capabilities_raw: "HP"
    source: "Vendors PDF"

  - name: "11 Beach's Pilot Car Svc Jim & Dottie Beach"
    phone: "3174095397"
    email: "dottie-83@hotmail.com"
    state: "OH"
    capabilities_raw: "Lead/Chase"
    source: "Vendors PDF"

  - name: "11 Beach's Pilot Car Svc Jim & Dottie Beach"
    phone: "4194395837"
    email: "dottie-83@hotmail.com"
    state: "OH"
    capabilities_raw: "Lead/Chase"
    source: "Vendors PDF"

  - name: "1195 Pilot Car Service Rod Rifredi"
    phone: "9168798486"
    email: "rod@1195pilotcarservice.com"
    state: "CA"
    capabilities_raw: null
    source: "Vendors PDF"
`;

async function main() {
    console.log("Starting batch ingest test...");
    try {
        const result = await batchIngestYaml(sampleYaml);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Fatal:", e);
    }
}

main();
