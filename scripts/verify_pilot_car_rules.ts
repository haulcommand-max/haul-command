import { PILOT_CAR_RULES, getPilotCarRules } from '../core/compliance/pilot_car_rules.ts';

console.log("Verifying Pilot Car Rules Extraction...");

const statesToCheck = ['FL', 'NY', 'CA', 'TX', 'AL'];

statesToCheck.forEach(state => {
    const rules = getPilotCarRules(state);
    if (rules) {
        console.log(`\n✅ ${state} Rules Found:`);
        console.log(`   - Signs: ${rules.Equipment.Signs}`);
        console.log(`   - Lights: ${rules.Equipment.Lights}`);
        console.log(`   - High Pole: ${rules.Equipment.High_Pole}`);
        console.log(`   - Curfews: ${rules.Curfews["Day/Night"]}`);
    } else {
        console.error(`❌ ${state} Rules NOT FOUND`);
    }
});

console.log(`\nTotal States Indexed: ${Object.keys(PILOT_CAR_RULES).length}`);
