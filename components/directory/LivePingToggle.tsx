'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LivePingToggleProps {
  operatorId: string;
  initialStatus?: 'available' | 'busy' | 'offline';
}

export function LivePingToggle({ operatorId, initialStatus = 'offline' }: LivePingToggleProps) {
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>(initialStatus);
  const [isPinging, setIsPinging] = useState(false);
  const supabase = createClient();

  // Listen to realtime changes across devices
  useEffect(() => {
    if (!operatorId) return;

    const channel = supabase.channel(`public:operator_live_status:operator_id=eq.${operatorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'operator_live_status', filter: `operator_id=eq.${operatorId}` },
        (payload: any) => {
          if (payload.new && payload.new.status) {
            setStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [operatorId, supabase]);

  const handleToggle = async (newStatus: 'available' | 'offline') => {
    if (newStatus === status) return;
    setIsPinging(true);
    setStatus(newStatus); // Optimistic update

    try {
      // In a real mobile app, we would grab navigator.geolocation here
      // to update the ping with exact coordinates.
      const { error } = await supabase.rpc('ping_live_status', {
        p_operator_id: operatorId,
        p_status: newStatus,
        p_lat: null, 
        p_lng: null
      });

      if (error) {
        console.error('Failed to update live ping status:', error);
        setStatus(status); // Revert on failure
      }
    } catch (err) {
      console.error(err);
      setStatus(status);
    } finally {
      setIsPinging(false);
    }
  };

  const isLive = status === 'available';

  return (
    <div className="flex flex-col items-center p-6 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden group">
      {/* Background Pulse Effect when Live */}
      {isLive && (
        <div className="absolute inset-0 bg-[#22c55e]/5 animate-pulse z-0" />
      )}

      <div className="relative z-10 flex flex-col items-center">
        <h3 className="text-lg font-bold text-white mb-2">Broadcasting Status</h3>
        <p className="text-xs text-neutral-400 text-center mb-6 max-w-[200px]">
          Turn this on to appear immediately at the top of broker searches in your 250-mile radius.
        </p>

        <button
          onClick={() => handleToggle(isLive ? 'offline' : 'available')}
          disabled={isPinging}
          className={`
            relative w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl
            ${isLive 
              ? 'bg-[#22c55e] border-4 border-[#22c55e]/30 shadow-[0_0_60px_rgba(34,197,94,0.4)] scale-105' 
              : 'bg-[#1a1a1a] border-4 border-white/5 hover:border-white/20'
            }
          `}
        >
          {isLive ? (
            <>
              <div className="w-4 h-4 bg-white rounded-full animate-ping mb-2" />
              <span className="text-white font-black tracking-widest text-sm drop-shadow-md">LIVE</span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 bg-neutral-600 rounded-full mb-2" />
              <span className="text-neutral-500 font-bold tracking-widest text-sm">OFFLINE</span>
            </>
          )}
        </button>

        <div className="mt-6 text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
          {isLive ? 'Brokers can see you' : 'Hidden from active dispatch'}
        </div>
      </div>
    </div>
  );
}
