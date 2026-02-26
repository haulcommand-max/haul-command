import React, { useState } from 'react';
import { TransactionEngine } from '../../../core/finance/TransactionEngine';

export const TransactionPortal: React.FC = () => {
    const [amount, setAmount] = useState<number>(1000); // Default Load Pay
    const [quickPay, setQuickPay] = useState<boolean>(false);
    const [logs, setLogs] = useState<string[]>([]);

    const engine = new TransactionEngine();

    const handleCalculate = async () => {
        setLogs([]);
        addLog(`Processing standard dispatch fee for load: $${amount}`);

        // Simulate API Call to Engine
        const tx = await engine.processDispatchFee({
            job_id: 'JOB-123',
            payer_id: 'BROKER-ABC',
            payee_id: 'DRIVER-XYZ',
            amount: amount,
            type: 'DISPATCH_FEE'
        });

        addLog(`💰 Gross: $${tx.gross}`);
        addLog(`📉 Dispatch Fee (15%): -$${tx.fee}`);
        addLog(`💵 Net Earnings: $${tx.net}`);

        if (quickPay) {
            addLog(`⚡ Quick Pay Requested...`);
            const qp = await engine.processQuickPay({
                transaction_id: tx.transaction_id,
                driver_id: 'DRIVER-XYZ'
            }, tx);

            addLog(`🚀 Speed Fee (5%): -$${qp.fee.toFixed(2)}`);
            addLog(`✅ INSTANT PAYOUT: $${qp.payout.toFixed(2)}`);
        } else {
            addLog(`📅 Standard Payout: 30 Days`);
        }
    };

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    return (
        <div className="text-white font-mono">
            <h2 className="text-lg font-bold mb-4 text-emerald-400">💸 Haul Pay Terminal</h2>

            <div className="mb-4">
                <label className="block text-slate-400 text-xs mb-1">Load Amount ($)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                />
            </div>

            <div className="mb-6 flex items-center space-x-3 bg-slate-800 p-3 rounded border border-slate-600">
                <input
                    type="checkbox"
                    checked={quickPay}
                    onChange={(e) => setQuickPay(e.target.checked)}
                    className="h-5 w-5 accent-emerald-500"
                />
                <div>
                    <span className="font-bold text-emerald-400">Enable Quick Pay ⚡</span>
                    <p className="text-xs text-slate-400">Get paid instantly for a 5% fee. Skip the 30-day wait.</p>
                </div>
            </div>

            <button
                onClick={handleCalculate}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                Calculate Payout
            </button>

            <div className="mt-6 bg-black p-4 rounded border border-emerald-900/50 min-h-[150px]">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                ))}
                {logs.length === 0 && <span className="text-slate-600">Waiting for calculation...</span>}
            </div>
        </div>
    );
};
