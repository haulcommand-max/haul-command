import React from 'react';
import MapWidget from './components/MapWidget';
import AlertFeed from './components/AlertFeed';
import MoneyTicker from './components/MoneyTicker';
import RateMatrix from './components/RateMatrix';
import { LayoutGrid, Settings, Bell } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    return (
        <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-sans">
            {/* Header / Nav */}
            <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 relative z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                        <LayoutGrid size={20} className="text-white" />
                    </div>
                    <div className="leading-tight">
                        <h1 className="font-bold text-lg tracking-wide text-white">HAUL COMMAND <span className="text-blue-500">OS</span></h1>
                        <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Global Control Tower</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-slate-800 rounded-full transition-colors relative">
                        <Bell size={20} className="text-slate-400" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></span>
                    </button>
                    <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <Settings size={20} className="text-slate-400" />
                    </button>
                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-xs">
                        HC
                    </div>
                </div>
            </header>

            {/* Money Ticker */}
            <MoneyTicker />

            {/* Main Grid */}
            <main className="flex-1 p-4 grid grid-cols-12 gap-4 min-h-0 relative z-0">

                {/* Visual Intelligence (Map) - Spans 8 cols */}
                <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0 gap-4">
                    {/* Map Container */}
                    <div className="flex-1 min-h-0">
                        <MapWidget />
                    </div>

                    {/* Bottom Status Bar (Optional, simpler metrics) */}
                    <div className="h-24 bg-slate-900 border border-slate-700 rounded-xl p-4 grid grid-cols-3 gap-4 hidden lg:grid">
                        <div className="bg-slate-800 rounded px-4 py-2 flex flex-col justify-center border-l-4 border-blue-500">
                            <span className="text-xs text-slate-400 uppercase font-mono">Total Active Fleets</span>
                            <span className="text-xl font-bold text-white">24</span>
                        </div>
                        <div className="bg-slate-800 rounded px-4 py-2 flex flex-col justify-center border-l-4 border-green-500">
                            <span className="text-xs text-slate-400 uppercase font-mono">Permits Issued (24h)</span>
                            <span className="text-xl font-bold text-white">142</span>
                        </div>
                        <div className="bg-slate-800 rounded px-4 py-2 flex flex-col justify-center border-l-4 border-purple-500">
                            <span className="text-xs text-slate-400 uppercase font-mono">Broker Calls Blocked</span>
                            <span className="text-xl font-bold text-white">1,029</span>
                        </div>
                    </div>
                </div>

                {/* Intelligence Sidebars - Spans 4 cols */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
                    <div className="flex-[3] min-h-0">
                        <AlertFeed />
                    </div>
                    <div className="flex-[2] min-h-0">
                        <RateMatrix />
                    </div>
                </div>

            </main>
        </div>
    );
};

export default DashboardLayout;
