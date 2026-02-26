
import { EscortCostEstimator } from './core/calculators/escort_cost_estimator.ts';

console.log("---------------------------------------------------------");
console.log("   HAUL COMMAND | ESCORT COST ESTIMATOR VERIFICATION");
console.log("---------------------------------------------------------\n");

// Scenario 1: Short Haul, 1 Pilot, 1 High Pole
const scenario1 = {
    miles: 150, // Short run, likely hits day min
    durationDays: 1,
    standardEscorts: 1,
    highPoleCar: true
};

console.log(`SCENARIO 1: Short Haul (${scenario1.miles} miles)`);
console.log(`- 1 Chase Car`);
console.log(`- 1 High Pole`);
const result1 = EscortCostEstimator.calculate(scenario1);
console.log(JSON.stringify(result1, null, 2));


// Scenario 2: Super Load, Long Haul
const scenario2 = {
    miles: 1200,
    durationDays: 3,
    overnightStops: 2,
    standardEscorts: 2, // 1 Lead, 1 Chase
    highPoleCar: true,
    policeEscorts: 2,
    policeHoursPerOfficer: 24, // 8 hrs/day * 3 days
    bucketTruck: true
};

console.log(`\nSCENARIO 2: Super Load Long Haul (${scenario2.miles} miles)`);
console.log(`- 2 Civilian Escorts`);
console.log(`- 1 High Pole`);
console.log(`- 2 Police Escorts (24hrs each)`);
console.log(`- 1 Bucket Truck`);
console.log(`- 2 Overnights`);
const result2 = EscortCostEstimator.calculate(scenario2);
console.log(JSON.stringify(result2, null, 2));

console.log("\n---------------------------------------------------------");
console.log("VERIFICATION COMPLETE");
