import { uib } from './IntelligenceBus';

interface RouteSegment {
    state: string; // 'TX', 'LA', 'MS'
    estimatedArrival: Date;
    isSuperload: boolean;
}

export class CurfewSentinel {

    // Holiday Lock Database (Mock)
    private static holidays = [
        { name: 'Independence Day', date: '2026-07-04', type: 'HARD_LOCK', states: ['ALL'] },
        { name: 'Mardi Gras', date: '2026-02-17', type: 'METRO_LOCK', states: ['LA'] }
    ];

    public static checkServices(segments: RouteSegment[]) {
        console.log(`[SENTINEL] Scanning ${segments.length} route segments for time locks.`);

        const locks = [];

        for (const seg of segments) {
            // 1. Holiday Check
            const conflict = this.checkHoliday(seg.estimatedArrival, seg.state);
            if (conflict) {
                locks.push({ ...conflict, segment: seg });
            }

            // 2. Curfew Check (Rush Hour)
            if (this.checkRushHour(seg.estimatedArrival, seg.state, seg.isSuperload)) {
                locks.push({ type: 'CURFEW_LOCK', reason: 'Metro Rush Hour (0700-0900)', state: seg.state });
            }
        }

        if (locks.length > 0) {
            return this.issueLock(locks);
        }

        return { status: 'CLEAR' };
    }

    private static checkHoliday(date: Date, state: string) {
        const dateStr = date.toISOString().split('T')[0];
        const holiday = this.holidays.find(h => h.date === dateStr);

        if (holiday) {
            if (holiday.states.includes('ALL') || holiday.states.includes(state)) {
                return { type: 'HOLIDAY_LOCK', reason: holiday.name };
            }
        }
        return null;
    }

    private static checkRushHour(date: Date, state: string, isSuper: boolean): boolean {
        const hour = date.getHours();
        // Simple heuristic: 7-9am and 4-6pm are locked for superloads in cities
        if (isSuper && ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18))) {
            return true;
        }
        return false;
    }

    private static issueLock(locks: any[]) {
        console.log(`[SENTINEL] DETECTED ${locks.length} SCHEDULE LOCKS. Emitting Warning.`);

        uib.emitSignal({
            id: `cur-${Date.now()}`,
            type: 'CUR-S',
            source: 'curfew-sentinel',
            payload: { locks, status: 'LOCKED' },
            hash: 'sha256-placeholder',
            timestamp: Date.now(),
            sqs: 1.0
        });

        return { status: 'LOCKED', locks };
    }
}
