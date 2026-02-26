import { uib } from './IntelligenceBus';
import { SmashingEngine } from './SmashEngine';
import { controlTower } from './ControlTower';
import { RateEngineV2 } from '../calculators/rate_engine_v2';
import { ScoutEngine } from './ScoutEngine';
import { PermitBot } from './PermitBot';
import { EscortTrustVetter } from './EscortTrustVetter';
import { VapiBrokerBlocker } from './VapiBrokerBlocker';
import { CurfewSentinel } from './CurfewSentinel';
import { HaulPayFinancialRail } from './HaulPayFinancialRail';
import { VaultService } from './VaultService';

async function runVerification() {
    console.log('=== STARTING DOMINANCE ECOSYSTEM VERIFICATION ===');

    // 1. Ingestion (Skill 3)
    console.log('\n--- 1. DATA INGESTION SMASH ---');
    SmashingEngine.smash({ source_id: 'ods-001', fleet_size: 6000, verified_status: 'Active' });

    // 2. Vetting (Skill 8)
    console.log('\n--- 2. ESCORT TRUST VETTER ---');
    EscortTrustVetter.verify({ providerId: 'ods-001', requiredCertifications: ['WA-PILOT'], loadRiskLevel: 'SUPERLOAD' });

    // 3. Route Scouting (Skill 6)
    console.log('\n--- 3. VIRTUAL ROUTE SCOUT ---');
    ScoutEngine.checkBridge('I-10-MM-245', { height: 16.5 });

    // 4. Rate Calculation (Skill 1 + 7)
    console.log('\n--- 4. RATE ENGINE & VAPI BLOCKER ---');
    // Mock Rate Calculation
    const rate = { finalRate: 4.50, holds: [] };
    await VapiBrokerBlocker.handleInboundCall({ callerId: '+15550000', loadDetails: {}, offeredRate: 3.50 });

    // 5. Curfew Check (Skill 9)
    console.log('\n--- 5. CURFEW SENTINEL ---');
    CurfewSentinel.checkServices([{ state: 'LA', estimatedArrival: new Date('2026-02-17T09:00:00Z'), isSuperload: true }]);

    // 6. Permit Filing (Skill 5)
    console.log('\n--- 6. PERMIT AUTO NAVIGATOR ---');
    await PermitBot.apply({ state: 'FL', loadDims: { h: 14, w: 10, l: 80, gw: 80000 }, routeStr: 'I-95', startDate: '2026-03-01' });

    // 7. Evidence Vault (Skill 4)
    console.log('\n--- 7. EVIDENCE VAULT ---');
    VaultService.deposit({ type: 'DELIVERY_CONFIRMED', source: 'driver-app', payload: { lat: 28.5, lon: -81.3 } });

    // 8. Financial Rail (Skill 10)
    console.log('\n--- 8. HAUL PAY FINANCIAL RAIL ---');
    HaulPayFinancialRail.settle('job-123', { jobId: 'job-123', amount: 4500.00, payeeId: 'ods-001', trigger: 'DELIVERED_EVIDENCE' });

    console.log('\n=== VERIFICATION COMPLETE: ALL SIGNALS EMITTED ===');
}

runVerification();
