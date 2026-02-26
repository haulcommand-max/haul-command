import React, { useState } from 'react';
import { VerificationPortal } from './VerificationPortal';
import { TransactionPortal } from './TransactionPortal';
import { Shield, DollarSign, MapPin, Menu } from 'lucide-react';

export const MobileAppFrame: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'VERIFY' | 'PAY' | 'JOBS'>('VERIFY');

    return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-4">
            {/* Mobile Device Mockup Container */}
            <div className="w-full max-w-[400px] h-[800px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">

                {/* Status Bar Mockup */}
                <div className="h-8 bg-slate-950 w-full flex justify-between items-center px-6 text-[10px] text-white">
                    <span>9:41</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                </div>

                {/* App Header */}
                <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <Shield size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-white tracking-wide">HAUL<span className="text-amber-500">COMMAND</span></span>
                    </div>
                    <Menu className="text-slate-400" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-950 p-4 custom-scrollbar">
                    {activeTab === 'VERIFY' && (
                        <div className="space-y-4">
                            <div className="bg-amber-900/20 border border-amber-900/50 p-3 rounded-lg flex items-start gap-3">
                                <Shield className="text-amber-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <h3 className="text-amber-400 font-bold text-sm">Compliance Gate Active</h3>
                                    <p className="text-xs text-amber-200/60 mt-1">Upload verified photos to unlock dispatch.</p>
                                </div>
                            </div>
                            <VerificationPortal />
                        </div>
                    )}

                    {activeTab === 'PAY' && (
                        <div className="space-y-4">
                            <TransactionPortal />
                        </div>
                    )}

                    {activeTab === 'JOBS' && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                            <MapPin size={48} className="opacity-20" />
                            <p>No Active Dispatches</p>
                            <button className="px-4 py-2 bg-slate-800 rounded-full text-xs text-slate-400 hover:text-white transition-colors">
                                Refresh Board
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 shrink-0 pb-4">
                    <button
                        onClick={() => setActiveTab('VERIFY')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'VERIFY' ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Shield size={24} />
                        <span className="text-[10px] font-bold">Verify</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('JOBS')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'JOBS' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <MapPin size={24} />
                        <span className="text-[10px] font-bold">Dispatch</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('PAY')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'PAY' ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <DollarSign size={24} />
                        <span className="text-[10px] font-bold">Wallet</span>
                    </button>
                </div>

            </div>

            <div className="mt-8 text-slate-500 text-xs font-mono">
                Running in Mobile Emulator Mode
            </div>
        </div>
    );
};
