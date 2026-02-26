
import { checkRoutePermits } from './core/calculators/permit_checker';
import { calculateTeamConfig, estimateTeamCost } from './core/calculators/team_builder';

const resultPermit = checkRoutePermits(['TX', 'OK'], { width: 14.5, height: 14.2, length: 90, weight: 120000 });
console.log('Permit Check Result:', JSON.stringify(resultPermit, null, 2));

const teamConfig = calculateTeamConfig({
    origin_state: 'TX', dest_state: 'OK', total_miles: 500,
    width: 17, height: 15, length: 120, overhang_front: 0, overhang_rear: 0
});
const teamCost = estimateTeamCost({
    origin_state: 'TX', dest_state: 'OK', total_miles: 500,
    width: 17, height: 15, length: 120, overhang_front: 0, overhang_rear: 0
}, teamConfig);

console.log('Team Config:', teamConfig);
console.log('Team Cost:', teamCost);
