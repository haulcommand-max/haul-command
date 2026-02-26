"use client";

import { DollarSign, TrendingUp, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface Payment {
    id: string;
    loadId: string;
    broker: string;
    amount: number;
    status: 'pending' | 'deposit-received' | 'paid' | 'overdue';
    dueDate: string;
    paidDate?: string;
    method: 'text-to-deposit' | 'invoice' | 'manual';
}

const MOCK_PAYMENTS: Payment[] = [
    {
        id: 'PAY-1024',
        loadId: 'LD-2401',
        broker: 'Nationwide Logistics',
        amount: 3200,
        status: 'deposit-received',
        dueDate: '2026-02-14',
        paidDate: '2026-02-13',
        method: 'text-to-deposit'
    },
    {
        id: 'PAY-1025',
        loadId: 'LD-2402',
        broker: 'Southern Transport Co.',
        amount: 4500,
        status: 'deposit-received',
        dueDate: '2026-02-15',
        paidDate: '2026-02-13',
        method: 'text-to-deposit'
    },
    {
        id: 'PAY-1026',
        loadId: 'LD-2403',
        broker: 'Express Escort Services',
        amount: 2800,
        status: 'pending',
        dueDate: '2026-02-16',
        method: 'text-to-deposit'
    },
    {
        id: 'PAY-1023',
        loadId: 'LD-2398',
        broker: 'Regional Haulers Inc.',
        amount: 1950,
        status: 'overdue',
        dueDate: '2026-02-10',
        method: 'invoice'
    }
];

const statusConfig = {
    'pending': { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Awaiting Payment', icon: Clock },
    'deposit-received': { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Deposit Received', icon: CheckCircle2 },
    'paid': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Paid', icon: CheckCircle2 },
    'overdue': { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Overdue', icon: AlertCircle }
};

export default function FinancePage() {
    const totalPending = MOCK_PAYMENTS.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const totalDeposits = MOCK_PAYMENTS.filter(p => p.status === 'deposit-received').reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = MOCK_PAYMENTS.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
    const textToDepositCount = MOCK_PAYMENTS.filter(p => p.method === 'text-to-deposit').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Payment Rail</h1>
                    <p className="text-slate-400 mt-1">Text-to-Deposit & Revenue Tracking</p>
                </div>
                <button className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                    Send Payment Link
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Deposits Secured</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">${(totalDeposits / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+23% vs last week</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Pending</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-1">${(totalPending / 1000).toFixed(1)}k</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Overdue</div>
                    <div className="text-2xl font-bold text-rose-500 mt-1">${(totalOverdue / 1000).toFixed(1)}k</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Text-to-Deposit</div>
                    <div className="text-2xl font-bold text-white mt-1">{textToDepositCount}</div>
                    <div className="text-xs text-slate-400 mt-1">Auto payment links</div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Payment ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Load</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Broker</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {MOCK_PAYMENTS.map((payment) => {
                                const StatusIcon = statusConfig[payment.status].icon;
                                return (
                                    <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-white font-semibold">{payment.id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-slate-300">{payment.loadId}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white">{payment.broker}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-white font-semibold">
                                                <DollarSign className="w-4 h-4 text-slate-400" />
                                                {payment.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {payment.method === 'text-to-deposit' ? (
                                                    <>
                                                        <CreditCard className="w-4 h-4 text-amber-500" />
                                                        <span className="text-amber-500 text-sm font-medium">Text-to-Deposit</span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">{payment.method}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
                                            {payment.dueDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig[payment.status].bg}`}>
                                                <StatusIcon className={`w-3.5 h-3.5 ${statusConfig[payment.status].color}`} />
                                                <span className={`text-xs font-medium ${statusConfig[payment.status].color}`}>
                                                    {statusConfig[payment.status].label}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {payment.status === 'pending' ? (
                                                <button className="text-amber-500 hover:text-amber-400 transition-colors font-medium">
                                                    Send Reminder
                                                </button>
                                            ) : payment.status === 'overdue' ? (
                                                <button className="text-rose-500 hover:text-rose-400 transition-colors font-medium">
                                                    Follow Up
                                                </button>
                                            ) : (
                                                <button className="text-blue-400 hover:text-blue-300 transition-colors">
                                                    View Receipt
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* "Get Paid Before You Roll" Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-lg">Get Paid Before You Roll</h3>
                        <p className="text-slate-300 mt-1">
                            Text-to-Deposit secured <span className="text-emerald-400 font-semibold">${(totalDeposits / 1000).toFixed(1)}k</span> in deposits this week. Zero ghost loads.
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            Automated payment links sent after broker confirms load. Calendar slot only confirmed after deposit received.
                        </p>
                    </div>
                    <CreditCard className="w-12 h-12 text-emerald-500/50" />
                </div>
            </div>
        </div>
    );
}
