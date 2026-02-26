import React, { useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { useStore } from './store/useStore';

function App() {
    const { isDemoMode, generateDemoSignal } = useStore();

    // Simulate incoming signal stream in Demo Mode
    useEffect(() => {
        if (!isDemoMode) return;

        const interval = setInterval(() => {
            // Randomly generate signals
            if (Math.random() > 0.3) {
                generateDemoSignal();
            }
        }, 2000); // New signal every 2 seconds approx

        return () => clearInterval(interval);
    }, [isDemoMode, generateDemoSignal]);

    const [viewMode, setViewMode] = React.useState<'DASHBOARD' | 'MOBILE_APP'>('DASHBOARD');

    return (
        <div className="relative">
            {/* View Toggle (Dev Only) */}
            <div className="fixed top-4 right-20 z-[100] flex bg-black/50 backdrop-blur rounded-full p-1 border border-white/10">
                <button
                    onClick={() => setViewMode('DASHBOARD')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'DASHBOARD' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                    Tower
                </button>
                <button
                    onClick={() => setViewMode('MOBILE_APP')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${viewMode === 'MOBILE_APP' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                >
                    Driver App
                </button>
            </div>

            {viewMode === 'DASHBOARD' ? (
                <DashboardLayout />
            ) : (
                <div className="bg-slate-950 min-h-screen">
                    {/* Lazy load mobile frame components if needed, or just import at top */}
                    {/* We need to import MobileAppFrame at the top now */}
                    <MobileAppFrame />
                </div>
            )}
        </div>
    );
}

// We need to add the import at the top
import { MobileAppFrame } from './components/MobileAppFrame';

export default App;
