"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SwipeableRunCard from "@/components/mobile/SwipeableRunCard";
import AvailabilityWidget from "@/components/dispatch/AvailabilityWidget";

const HeavyHaulMap = dynamic(() => import('@/components/map/HeavyHaulMap'), { ssr: false });

export function OperatorDashboardClient({ operatorId, availableLoads }: { operatorId: string, availableLoads: any[] }) {
  const [loads, setLoads] = useState(availableLoads);
  const [biddingOn, setBiddingOn] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmitBid = async (loadId: string) => {
    if (!bidAmount || isNaN(Number(bidAmount))) return alert("Enter a valid metric amount.");
    
    setIsProcessing(true);
    try {
      const response = await fetch("/api/dispatch/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          load_id: loadId,
          operator_id: operatorId,
          bid_amount: Number(bidAmount)
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      alert(`Bid of $${bidAmount} successfully submitted to the Broker Network.`);
      
      // Optimistic mutate: Remove load from available board or show "Bid Pending"
      setBiddingOn(null);
      setBidAmount("");
      setLoads(prev => prev.filter(l => l.id !== loadId));
      
    } catch(err: any) {
      alert(`Dispatch Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = (loadId: string) => {
    setLoads(prev => prev.filter(l => l.id !== loadId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pilot Car Command</h1>
          <p className="text-slate-400 mt-2">Active Oversize Routes & Open Network Dispatch Bids.</p>
        </div>
        <div className="text-right">
          <span className="text-emerald-400 font-mono text-sm uppercase block">Status: Active</span>
          <span className="text-slate-500 font-mono text-xs">Waiting for Dispatch Ping (Novu)</span>
        </div>
      </div>

      {/* Availability Status Widget */}
      <AvailabilityWidget className="mb-2" />

      {/* Live Dispatch Map */}
      <Card>
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Nearby Loads</h2>
              <p className="text-xs text-slate-600 mt-0.5">{loads.length} active in your geo-fence</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div style={{ height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <HeavyHaulMap
              mode="operator"
              showPermitRoute={false}
              showHud={false}
              initialCenter={[-95.7, 37.0]}
              initialZoom={4}
            />
          </div>
        </div>
      </Card>

      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Code</TableHead>
                <TableHead>Execution Corridor</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loads.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                      No active routes in your geo-fence. Wait for Novu Push Notifications.
                   </TableCell>
                 </TableRow>
              )}
              {loads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-emerald-400">{l.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-300">{l.origin_city}, {l.origin_state}</span>
                      <span className="text-slate-600">→</span>
                      <span className="font-medium text-slate-300">{l.destination_city}, {l.destination_state}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {l.equipment_type && l.equipment_type.length > 0 
                       ? l.equipment_type.join(" • ") 
                       : "High Pole / Chase"}
                  </TableCell>
                  <TableCell>
                    {biddingOn === l.id ? (
                       <div className="flex space-x-2 items-center">
                          <input 
                             type="number" 
                             placeholder="Quote ($)"
                             className="bg-slate-800 text-white px-3 py-1 rounded text-sm w-24 outline-none border border-slate-700"
                             value={bidAmount}
                             onChange={(e) => setBidAmount(e.target.value)}
                             min="50"
                          />
                          <Button aria-label="Interactive Button" 
                            size="sm" 
                            disabled={isProcessing}
                            onClick={() => handleSubmitBid(l.id)}
                          >
                             Submit
                          </Button>
                          <Button aria-label="Interactive Button" variant="ghost" className="text-slate-500 text-sm hover:text-white transition" onClick={() => setBiddingOn(null)}>Cancel</Button>
                       </div>
                    ) : (
                       <Button aria-label="Interactive Button" 
                         size="sm" 
                         onClick={() => setBiddingOn(l.id)}
                       >
                          Bid on Route
                       </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="md:hidden space-y-4">
        {loads.length === 0 && (
          <div className="text-center py-10 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
             No active routes in your geo-fence.
          </div>
        )}
        {loads.map((l) => (
          <SwipeableRunCard
            key={l.id}
            id={l.id}
            onAccept={() => setBiddingOn(l.id)}
            onSkip={handleSkip}
            acceptLabel="Bid"
            skipLabel="Pass"
            className="bg-[#121214] rounded-2xl border border-white/10"
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-emerald-400 font-bold">{l.id.substring(0, 8)}</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-white/5 text-slate-300 px-2 py-1 rounded">
                  {l.equipment_type && l.equipment_type.length > 0 
                     ? l.equipment_type[0]
                     : "High Pole"}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
                <span className="font-medium text-slate-200">{l.origin_city}, {l.origin_state}</span>
                <span className="text-slate-600">→</span>
                <span className="font-medium text-slate-200">{l.destination_city}, {l.destination_state}</span>
              </div>
              
              {biddingOn === l.id ? (
                 <div className="flex flex-col space-y-3">
                    <input 
                       type="number" 
                       placeholder="Enter Quote ($)"
                       className="bg-[#0a0a0a] text-white px-4 py-3 rounded-xl text-lg w-full outline-none border border-amber-500/50 focus:border-amber-500 transition-colors"
                       value={bidAmount}
                       onChange={(e) => setBidAmount(e.target.value)}
                       min="50"
                    />
                    <div className="flex space-x-3">
                      <Button aria-label="Interactive Button" 
                        className="flex-1 py-6 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl"
                        disabled={isProcessing}
                        onClick={() => handleSubmitBid(l.id)}
                      >
                         Submit Bid
                      </Button>
                      <Button aria-label="Interactive Button" variant="ghost" className="py-6 px-4 bg-white/5 text-slate-400 hover:text-white rounded-xl" onClick={() => setBiddingOn(null)}>Cancel</Button>
                    </div>
                 </div>
              ) : (
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                  <span className="flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg> Swipe to pass</span>
                  <span className="flex items-center gap-1 text-emerald-500">Swipe to bid <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg></span>
                </div>
              )}
            </div>
          </SwipeableRunCard>
        ))}
      </div>
    </div>
  );
}
