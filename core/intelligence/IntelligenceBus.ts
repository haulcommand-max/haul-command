import { EventEmitter } from 'events';

export type SignalType = 'ING-S' | 'EVI-S' | 'RAT-S' | 'VET-S' | 'NAV-S' | 'FIN-S' | 'INT-S' | 'CUR-S' | 'COM-S';

export interface UIBSignal {
    id: string;
    type: SignalType;
    source: string;
    payload: any;
    hash: string;
    timestamp: number;
    sqs: number; // Source Quality Score
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

class IntelligenceBus extends EventEmitter {
    private static instance: IntelligenceBus;

    private constructor() {
        super();
    }

    public static getInstance(): IntelligenceBus {
        if (!IntelligenceBus.instance) {
            IntelligenceBus.instance = new IntelligenceBus();
        }
        return IntelligenceBus.instance;
    }

    public emitSignal(signal: UIBSignal) {
        console.log(`[UIB] Signal Emitted: ${signal.type} from ${signal.source} (SQS: ${signal.sqs})`);
        this.emit('signal', signal);
        this.emit(signal.type, signal);
    }

    public onSignal(callback: (signal: UIBSignal) => void) {
        this.on('signal', callback);
    }
}

export const uib = IntelligenceBus.getInstance();
