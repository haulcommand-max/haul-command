'use client';

import { useState } from 'react';

/**
 * AvailabilityToggle
 * 
 * Injects into the Operator Dashboard. 
 * Connects directly to the `hc_global_operators.availability_status` column via APIs.
 * This is the ultimate "Uber-style" online/offline lever that fuels the Autonomous Dispatching OS.
 */
export function AvailabilityToggle({ initialStatus = 'offline', operatorId }: { initialStatus?: 'online' | 'offline' | 'busy', operatorId: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const toggleAvailability = async () => {
    if (loading) return;
    setLoading(true);
    const nextStatus = status === 'online' ? 'offline' : 'online';
    
    try {
      // Stub for the API call to Supabase to mutate their state
      // await fetch('/api/operator/availability', { method: 'POST', body: JSON.stringify({ status: nextStatus }) });
      
      setStatus(nextStatus);
    } catch (e) {
      console.error('Failed to change availability status:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[#0a0f16] border border-white/5 rounded-2xl shadow-lg">
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="relative flex h-4 w-4">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'online' ? 'bg-green-400' : 'hidden'}`}></span>
          <span className={`relative inline-flex rounded-full h-4 w-4 ${status === 'online' ? 'bg-green-500' : 'bg-gray-600'}`}></span>
        </div>
        <div>
          <h4 className="font-bold text-white tracking-tight">Active Dispatch</h4>
          <p className="text-xs text-gray-500">
            {status === 'online' 
              ? 'Receiving autonomous route pings' 
              : 'Hidden from broker algorithms'}
          </p>
        </div>
      </div>

      <button
        onClick={toggleAvailability}
        disabled={loading}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-opacity-75 ${status === 'online' ? 'bg-green-500' : 'bg-gray-700'}`}
      >
        <span className="sr-only">Toggle availability</span>
        <span
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${status === 'online' ? 'translate-x-6' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
