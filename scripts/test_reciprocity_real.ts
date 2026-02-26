
import { ReciprocityEngine } from '../core/compliance/ReciprocityEngine';

// Test Cases derived from NotebookLM Data
const testCases = [
    { driver: 'FL', operating: 'GA', expected: true, reason: 'GA accepts FL' },
    { driver: 'FL', operating: 'NY', expected: false, reason: 'NY accepts NO ONE' },
    { driver: 'WA', operating: 'UT', expected: true, reason: 'UT accepts WA' },
    { driver: 'NY', operating: 'FL', expected: false, reason: 'FL accepts PA, VA, etc. but NY is NOT in the list' },
    { driver: 'AZ', operating: 'WI', expected: true, reason: 'WI accepts states with 8hr training (AZ has it)' },
    { driver: 'CO', operating: 'TX', expected: true, reason: 'TX accepts CO' }
];

console.log('--- STARTING REAL RECIPROCITY VERIFICATION ---\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = ReciprocityEngine.checkReciprocity(test.driver, test.operating);

    const isSuccess = result.isAccepted === test.expected;

    if (isSuccess) {
        console.log(`✅ TEST ${index + 1}: ${test.driver} -> ${test.operating} | Expected: ${test.expected} | Actual: ${result.isAccepted}`);
        passed++;
    } else {
        console.log(`❌ TEST ${index + 1}: ${test.driver} -> ${test.operating} | Expected: ${test.expected} | Actual: ${result.isAccepted}`);
        console.log(`   Notes: ${result.notes}`);
        failed++;
    }
});

console.log('\n--- VERIFICATION COMPLETE ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
    console.log('\nSUCCESS: Real Reciprocity Data integration is verified.');
    process.exit(0);
} else {
    console.error('\nFAILURE: Some reciprocity rules did not match expectations.');
    process.exit(1);
}
