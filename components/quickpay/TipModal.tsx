'use client';
import { useState } from 'react';

export default function TipModal({ baseAmount = 500, onConfirm }: { baseAmount?: number; onConfirm?: (total: number) => void }) {
  const [tipPercent, setTipPercent] = useState<number>(0);
  const total = baseAmount + (baseAmount * (tipPercent / 100));

  return (
    <div className="p-5 bg-[#111] border border-gray-800 rounded-xl space-y-4">
      <h3 className="font-bold text-white text-lg">Leave a Tip for the Operator?</h3>
      <p className="text-sm text-gray-400">100% of the tip goes directly to their connected payout account. Show appreciation for a tough route.</p>
      
      <div className="flex gap-2">
        {[0, 10, 15, 20].map(pct => (
          <button 
            key={pct}
            onClick={() => setTipPercent(pct)}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors border ${tipPercent === pct ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black text-gray-300 border-gray-700 hover:border-gray-500'}`}
          >
            {pct === 0 ? 'No Tip' : `${pct}%`}
          </button>
        ))}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-800 mt-2">
        <span className="text-gray-400 font-medium">Total Charge</span>
        <span className="text-white font-black text-xl">${total.toFixed(2)}</span>
      </div>

      <button onClick={() => onConfirm?.(total)} className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg shadow-lg shadow-green-900/40">
        Confirm Settlement
      </button>
    </div>
  );
}
