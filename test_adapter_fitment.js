
const { FORD_MAVERICK_2022, VehicleComplianceEngine } = require('./core/compliance/VehicleCompliance');

const engine = new VehicleComplianceEngine();

// 20mm Adapter Scenario
const ADAPTER_THICKNESS_MM = 20;

// User's Confirmed Wheel Specs (20x10.5)
// Assumption: BMW wheels usually have offset ~ET35 (common aftermarket) or ET40. 
// Let's use ET35 as a "best case" scenario for inner clearance, worst for poke.
const userWheel = {
    boltPattern: '5x120',
    centerBoreMm: 72.6,
    widthInches: 10.5,
    offsetMm: 35
};

console.log(`Checking fitment with ${ADAPTER_THICKNESS_MM}mm Adapter:`);
console.log(`Vehicle: ${FORD_MAVERICK_2022.model}`);
console.log(`Wheel: 20x10.5 ET${userWheel.offsetMm}`);

const result = engine.checkWheelFitment(FORD_MAVERICK_2022, userWheel, ADAPTER_THICKNESS_MM);

console.log(`\n--- ANALYSIS ---`);
if (result.compatible) {
    console.log('RESULT: COMPATIBLE');
} else {
    console.log('RESULT: NOT COMPATIBLE');
    console.log('ISSUES FOUND:');
    result.issues.forEach(issue => console.log(` - ${issue}`));
}

console.log(`\n--- DATA ---`);
console.log(`Effective Offset: ET${result.data.effectiveOffset}`);
console.log(`Extra Poke vs Stock: ${result.data.extraPokeInches.toFixed(2)} inches`);
