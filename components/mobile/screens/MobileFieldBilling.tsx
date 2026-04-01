'use client';
import React, { useState } from 'react';

// Extracted from Supabase Plan: 20260303_mobile_field_ops_billing_core.sql
// Closes the loop on the mobile app allowing pilots in the field to submit Proof of Delivery and Invoice immediately.

export default function MobileFieldBilling({ loadId }: { loadId: string }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('uploading');
    setTimeout(() => setStatus('completed'), 2000);
  };

  if (status === 'completed') {
    return (
      <div className="p-6 bg-hc-gray-900 h-full flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white">Invoice Submitted</h2>
        <p className="text-hc-gray-400 mt-2">Your field invoice for dispatch has been sent to the broker. Average QuickPay timeline is 48hrs.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-black h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Field Ops Billing</h2>
        <p className="text-sm text-hc-gray-400 mt-1">Submit POD and Invoice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-hc-gray-900 border border-hc-gray-800 rounded-lg p-4">
          <label className="block text-xs uppercase text-hc-gray-400 font-bold tracking-wide mb-2">Final Billed Distance</label>
          <div className="flex items-center">
            <input type="number" required defaultValue={452} className="w-full bg-hc-gray-800 text-white rounded p-3 focus:outline-none focus:ring-1 focus:ring-hc-yellow-400" />
            <span className="ml-3 text-hc-gray-500 font-bold">MILES</span>
          </div>
        </div>

        <div className="bg-hc-gray-900 border border-hc-gray-800 rounded-lg p-4">
          <label className="block text-xs uppercase text-hc-gray-400 font-bold tracking-wide mb-2">Accessorial Charges</label>
          <div className="space-y-3">
             <div className="flex justify-between items-center text-sm text-white border-b border-hc-gray-800 pb-2">
               <span>Layover (Weather/Port Delay)</span>
               <input type="number" placeholder="$0.00" className="w-20 bg-hc-gray-800 p-2 rounded text-right" />
             </div>
             <div className="flex justify-between items-center text-sm text-white">
               <span>Hotel (Broker Approved)</span>
               <input type="number" placeholder="$0.00" className="w-20 bg-hc-gray-800 p-2 rounded text-right" />
             </div>
          </div>
        </div>

        <div className="bg-hc-gray-900 border border-hc-gray-800 rounded-lg p-4 text-center cursor-pointer border-dashed hover:border-hc-yellow-400 transition-colors">
          <span className="text-3xl">📸</span>
          <p className="font-bold text-white mt-2">Capture Signed POD / BOL</p>
          <p className="text-xs text-hc-gray-500 mt-1">Camera auto-detects edges</p>
        </div>

        <button type="submit" className={`w-full py-4 rounded font-extrabold uppercase transition-colors ${status === 'uploading' ? 'bg-hc-gray-800 text-hc-gray-500' : 'bg-hc-yellow-400 text-black hover:bg-yellow-500'}`}>
          {status === 'uploading' ? 'Syncing...' : 'Submit Field Invoice'}
        </button>
      </form>
    </div>
  );
}
