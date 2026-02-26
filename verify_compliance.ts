
import { validateRouteCompliance, checkStateCompliance, DriverCertifications } from './core/compliance/reciprocity_rules';

// Test Case 1: The "Golden Key" Driver (Colorado Cert)
const driverCO: DriverCertifications = {
    pilot_certs: ['CO'],
    has_amber_light_permit: true,
    has_ny_cert: false
};

console.log('--- TEST 1: CO Driver (Golden Key) ---');
// Should pass in AZ, FL, GA (with amber), MN, NC, OK, PA, UT, VA, WA
const route1 = ['AZ', 'FL', 'WA', 'NC'];
const result1 = validateRouteCompliance(route1, driverCO);
console.log(`Route ${route1.join('->')}: Allowed? ${result1.allowed}`);
if (!result1.allowed) console.log(result1.blockers);

// Test Case 2: The "NY Wall" (Colorado Driver trying to enter NY)
console.log('\n--- TEST 2: The NY Wall ---');
const route2 = ['PA', 'NY', 'MA']; // PA ok, NY fail
const result2 = validateRouteCompliance(route2, driverCO);
console.log(`Route ${route2.join('->')}: Allowed? ${result2.allowed}`);
console.log('Blockers:', result2.blockers);

// Test Case 3: Georgia Amber Light Check
console.log('\n--- TEST 3: GA Amber Light ---');
const driverNoAmber: DriverCertifications = {
    pilot_certs: ['CO'],
    has_amber_light_permit: false, // Missing permit
    has_ny_cert: false
};
const result3 = checkStateCompliance('GA', driverNoAmber);
console.log(`CO Driver (No Amber) entering GA: Legal? ${result3.legal}`);
console.log('Reason:', result3.reason);

// Test Case 4: Weak Reciprocity (e.g. AZ cert trying to go to PA)
// PA accepts GA, NC, VA. Does not explicitly list AZ.
console.log('\n--- TEST 4: Weak Reciprocity (AZ -> PA) ---');
const driverAZ: DriverCertifications = {
    pilot_certs: ['AZ'],
    has_amber_light_permit: true,
    has_ny_cert: false
};
const result4 = checkStateCompliance('PA', driverAZ);
console.log(`AZ Driver entering PA: Legal? ${result4.legal}`);
console.log('Reason:', result4.reason);
