import React from 'react';
import { useStore } from '../store/useStore';
import { AlertOctagon, ShieldAlert, XCircle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

const AlertFeed: React.FC = () => {
    const { alerts } = useStore();

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col h-full shadow-xl">
            <div className="p-4 border-b border-slate-700 bg-red-900/20 flex items-center justify-between">
                <h2 className="text-red-400 font-bold flex items-center gap-2">
                    <AlertOctagon className="animate-pulse" />
                    WAR ROOM ALERTS
                </h2>
                <span className="text-xs font-mono text-slate-400">LIVE FEED</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                {alerts.length === 0 && (
                    <div className="text-slate-500 text-center py-10 italic">
                        No active threats detected.
                    </div>
                )}

                {alerts.map((alert) => (
                    <div key={alert.id} className="bg-slate-800 p-3 rounded border border-red-900/30 hover:bg-slate-700 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className={clsx(
                                "text-xs font-bold px-2 py-0.5 rounded",
                                alert.type === 'EVI-S' ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                            )}>
                                {alert.type}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                        </div>

                        <div className="text-sm text-slate-200 mt-2 font-medium">
                            {alert.type === 'EVI-S' ? 'CRITICAL SAFETY EVENT' : 'COMPLIANCE VIOLATION'}
                        </div>

                        <div className="text-xs text-slate-400 mt-1 break-all font-mono">
                            ID: {alert.source}
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                            {JSON.stringify(alert.payload).slice(0, 100)}
                        </div>

                        <div className="mt-3 flex gap-2">
                            <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded flex items-center justify-center gap-1 font-bold uppercase tracking-wider">
                                <XCircle size={12} />
                                KILL SWITCH
                            </button>
                            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-1 rounded flex items-center justify-center gap-1">
                                <CheckCircle size={12} />
                                DISMISS
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertFeed;
