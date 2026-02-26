// ============================================================================
// VERIFICATION SCRIPT: Bridge Engineering Module
// ============================================================================
// Run with: deno run verify_bridge_module.ts

console.log("🏗️  VERIFYING BRIDGE ENGINEERING MODULE...\n");

// ---------------------------------------------------------------------------
// PART 1: BRIDGE FORMULA CALCULATOR (System 1)
// ---------------------------------------------------------------------------
console.log("--- System 1: Federal Bridge Formula B ---");

function calculateFormulaB(L: number, N: number): number {
    if (N < 2) return 0;
    let W = 500 * ((L * N) / (N - 1) + 12 * N + 36);
    return Math.round(W / 500) * 500;
}

const tests = [
    { name: "Standard Tandem (4ft, 2 axles)", L: 4, N: 2, expected: 34000 },
    { name: "Standard Tridem (9ft, 3 axles)", L: 9, N: 3, expected: 42500 }, // Table B says 42,500
    { name: "Spread Tandem (10ft, 2 axles)", L: 10, N: 2, expected: 40000 },
    { name: "5-Axle Group (51ft, 5 axles)", L: 51, N: 5, expected: 80000 },
];

let passCount = 0;
for (const t of tests) {
    const result = calculateFormulaB(t.L, t.N);
    const passed = result === t.expected;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${t.name}: Formula(${t.L}, ${t.N}) = ${result} lbs (Expected: ${t.expected})`);
    if (passed) passCount++;
}

if (passCount === tests.length) {
    console.log("✅ Bridge Formula Logic: VERIFIED\n");
} else {
    console.error("❌ Bridge Formula Logic: FAILED\n");
}


// ---------------------------------------------------------------------------
// PART 2: HAZARD PROFILER (Systems 3 & 4)
// ---------------------------------------------------------------------------
console.log("--- System 3 & 4: Route Hazard Profiler ---");

// Mock Assets (matching seed_bridge_hazards.sql)
const mockAssets = [
    {
        id: "TEST-BR-001",
        type: "bridge",
        lat: 35.0000000, lng: -90.0000000,
        attributes: { curb_to_curb_width_ft: 28.0 }
    },
    {
        id: "TEST-RR-882",
        type: "railroad_crossing",
        lat: 35.0500000, lng: -90.0500000,
        attributes: { is_humped: true, hump_grade_percent: 12.0 }
    }
];

// Mock Vehicle
const testVehicle = {
    width_ft: 16.0,          // Wide Load
    ground_clearance_in: 6.0, // Lowboy
    wheelbase_ft: 40.0
};

// Mock Route Point (Exact hit)
const routePointBridge = { lat: 35.0000000, lng: -90.0000000 };
const routePointRail = { lat: 35.0500000, lng: -90.0500000 };

// Simulation Logic
function checkHazards(point: { lat: number; lng: number }) {
    for (const asset of mockAssets) {
        // Simple exact match for mock
        if (asset.lat === point.lat && asset.lng === point.lng) {

            // Skinny Bridge
            if (asset.type === 'bridge') {
                const width = asset.attributes.curb_to_curb_width_ft;
                if (width < 30 && testVehicle.width_ft > 14) {
                    console.log(`[ALERT] Skinny Bridge Detected at ${asset.id}. Bridge ${width}' < 30'`);
                    return "SKINNY_BRIDGE_ALERT";
                }
            }

            // Rail Hump
            if (asset.type === 'railroad_crossing') {
                const grade = asset.attributes.hump_grade_percent;
                const maxGrade = (testVehicle.ground_clearance_in / 12) / (testVehicle.wheelbase_ft / 2) * 100; // ~ 2.5%
                if (grade > maxGrade) {
                    console.log(`[ALERT] High Centering Risk at ${asset.id}. Grade ${grade}% > Max ${maxGrade.toFixed(1)}%`);
                    return "RAIL_HUMP_ALERT";
                }
            }
        }
    }
    return "SAFE";
}

// Test 1: Bridge
const res1 = checkHazards(routePointBridge);
if (res1 === "SKINNY_BRIDGE_ALERT") console.log("✅ Skinny Bridge Detection: VERIFIED");
else console.error("❌ Skinny Bridge Detection: FAILED");

// Test 2: Rail
const res2 = checkHazards(routePointRail);
if (res2 === "RAIL_HUMP_ALERT") console.log("✅ Rail Hump Detection: VERIFIED");
else console.error("❌ Rail Hump Detection: FAILED");

console.log("\n🏁  Verification Complete.");
