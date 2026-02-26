import { create } from 'zustand';

export interface UIBSignal {
    id: string;
    type: 'ING-S' | 'NAV-S' | 'EVI-S' | 'VET-S' | 'FIN-S' | 'RAT-S' | 'CUR-S';
    source: string;
    payload: any;
    hash: string;
    timestamp: number;
    sqs?: number;
}

interface DashboardState {
    signals: UIBSignal[];
    alerts: UIBSignal[];
    financials: UIBSignal[];
    isDemoMode: boolean;
    addSignal: (signal: UIBSignal) => void;
    toggleDemoMode: () => void;
    generateDemoSignal: () => void;
}

export const useStore = create<DashboardState>((set, get) => ({
    signals: [],
    alerts: [],
    financials: [],
    isDemoMode: true, // Default to true for now since we know keys are missing

    addSignal: (signal) => set((state) => {
        const newSignals = [signal, ...state.signals].slice(0, 100); // Keep last 100

        // Categorize
        let newAlerts = state.alerts;
        let newFinancials = state.financials;

        if (['EVI-S', 'VET-S'].includes(signal.type)) {
            newAlerts = [signal, ...state.alerts].slice(0, 50);
        }
        if (signal.type === 'FIN-S') {
            newFinancials = [signal, ...state.financials].slice(0, 50);
        }

        return {
            signals: newSignals,
            alerts: newAlerts,
            financials: newFinancials
        };
    }),

    toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),

    generateDemoSignal: () => {
        const types: UIBSignal['type'][] = ['ING-S', 'NAV-S', 'EVI-S', 'VET-S', 'FIN-S', 'RAT-S', 'CUR-S'];
        const randomType = types[Math.floor(Math.random() * types.length)];

        // Mock Payload generators
        const mockHash = Math.random().toString(36).substring(7);
        const mockSignal: UIBSignal = {
            id: `sig-${Date.now()}`,
            type: randomType,
            source: `src-${Math.floor(Math.random() * 1000)}`,
            payload: {
                message: `Simulated signal for ${randomType}`,
                value: Math.floor(Math.random() * 10000),
                status: Math.random() > 0.8 ? 'CRITICAL' : 'OK'
            },
            hash: `sha256-${mockHash}`,
            timestamp: Date.now(),
            sqs: Number(Math.random().toFixed(2))
        };

        get().addSignal(mockSignal);
    }
}));
