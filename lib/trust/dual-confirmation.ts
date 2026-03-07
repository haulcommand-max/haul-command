// ══════════════════════════════════════════════════════════════
// DUAL CONFIRMATION STATE MACHINE
// Spec: HC_DOMINATION_PATCH_V1 Phase 3 — Trust Flywheel
// State flow: posted → assigned → completed_pending →
//             broker_confirmed → escort_confirmed → ledger_locked
// Timeout: 72 hours
// ══════════════════════════════════════════════════════════════

export type JobConfirmationState =
    | "job_posted"
    | "escort_assigned"
    | "job_completed_pending"
    | "broker_confirmed"
    | "escort_confirmed"
    | "ledger_locked"
    | "disputed"
    | "timed_out";

export interface DualConfirmationRecord {
    jobId: string;
    brokerId: string;
    escortId: string;
    state: JobConfirmationState;
    createdAt: string;
    lastTransition: string;
    brokerConfirmedAt?: string;
    escortConfirmedAt?: string;
    lockedAt?: string;
    timeoutAt: string; // 72h from completed_pending
    evidenceIds: string[];
    notes?: string;
}

// ── Valid transitions ──
const TRANSITIONS: Record<JobConfirmationState, JobConfirmationState[]> = {
    job_posted: ["escort_assigned"],
    escort_assigned: ["job_completed_pending"],
    job_completed_pending: ["broker_confirmed", "escort_confirmed", "disputed", "timed_out"],
    broker_confirmed: ["ledger_locked", "disputed", "timed_out"], // waiting for escort
    escort_confirmed: ["ledger_locked", "disputed", "timed_out"], // waiting for broker
    ledger_locked: [], // terminal
    disputed: ["job_completed_pending"], // can re-open
    timed_out: [], // terminal
};

export class DualConfirmationEngine {
    constructor(private record: DualConfirmationRecord) { }

    get state(): JobConfirmationState { return this.record.state; }
    get isTerminal(): boolean { return TRANSITIONS[this.state].length === 0; }
    get canBrokerConfirm(): boolean {
        return this.state === "job_completed_pending" || this.state === "escort_confirmed";
    }
    get canEscortConfirm(): boolean {
        return this.state === "job_completed_pending" || this.state === "broker_confirmed";
    }
    get isFullyConfirmed(): boolean { return this.state === "ledger_locked"; }

    canTransitionTo(next: JobConfirmationState): boolean {
        return TRANSITIONS[this.state].includes(next);
    }

    transition(next: JobConfirmationState, actor: "broker" | "escort" | "system"): DualConfirmationRecord {
        if (!this.canTransitionTo(next)) {
            throw new Error(`Invalid transition: ${this.state} → ${next}`);
        }

        const now = new Date().toISOString();
        const updated = { ...this.record, state: next, lastTransition: now };

        if (next === "broker_confirmed") {
            updated.brokerConfirmedAt = now;
            // If escort already confirmed, auto-lock
            if (this.record.escortConfirmedAt) {
                updated.state = "ledger_locked";
                updated.lockedAt = now;
            }
        }

        if (next === "escort_confirmed") {
            updated.escortConfirmedAt = now;
            // If broker already confirmed, auto-lock
            if (this.record.brokerConfirmedAt) {
                updated.state = "ledger_locked";
                updated.lockedAt = now;
            }
        }

        if (next === "ledger_locked") {
            updated.lockedAt = now;
        }

        this.record = updated;
        return updated;
    }

    brokerConfirm(): DualConfirmationRecord {
        if (this.state === "job_completed_pending") {
            return this.transition("broker_confirmed", "broker");
        }
        if (this.state === "escort_confirmed") {
            return this.transition("ledger_locked", "broker");
        }
        throw new Error("Broker cannot confirm in current state");
    }

    escortConfirm(): DualConfirmationRecord {
        if (this.state === "job_completed_pending") {
            return this.transition("escort_confirmed", "escort");
        }
        if (this.state === "broker_confirmed") {
            return this.transition("ledger_locked", "escort");
        }
        throw new Error("Escort cannot confirm in current state");
    }

    checkTimeout(): DualConfirmationRecord | null {
        if (this.isTerminal) return null;
        const timeout = new Date(this.record.timeoutAt);
        if (new Date() > timeout && ["job_completed_pending", "broker_confirmed", "escort_confirmed"].includes(this.state)) {
            return this.transition("timed_out", "system");
        }
        return null;
    }

    attachEvidence(evidenceId: string): void {
        if (!this.record.evidenceIds.includes(evidenceId)) {
            this.record.evidenceIds.push(evidenceId);
        }
    }

    /** Get data payload for the verified job ledger */
    toLedgerEntry(): object | null {
        if (this.state !== "ledger_locked") return null;
        return {
            jobId: this.record.jobId,
            brokerId: this.record.brokerId,
            escortId: this.record.escortId,
            confirmedByBoth: true,
            brokerConfirmedAt: this.record.brokerConfirmedAt,
            escortConfirmedAt: this.record.escortConfirmedAt,
            lockedAt: this.record.lockedAt,
            evidenceCount: this.record.evidenceIds.length,
            immutable: true,
        };
    }

    toJSON(): DualConfirmationRecord { return { ...this.record }; }
}

// ── Factory ──

const TIMEOUT_HOURS = 72;

export function createDualConfirmation(
    jobId: string, brokerId: string, escortId: string
): DualConfirmationRecord {
    const now = new Date();
    const timeout = new Date(now.getTime() + TIMEOUT_HOURS * 60 * 60 * 1000);
    return {
        jobId, brokerId, escortId,
        state: "job_posted",
        createdAt: now.toISOString(),
        lastTransition: now.toISOString(),
        timeoutAt: timeout.toISOString(),
        evidenceIds: [],
    };
}
