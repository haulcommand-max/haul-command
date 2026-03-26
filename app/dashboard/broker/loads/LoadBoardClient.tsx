"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function LoadBoardClient({ brokerId, initialLoads }: { brokerId: string, initialLoads: any[] }) {
  const [loads, setLoads] = useState(initialLoads);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAcceptBid = async (loadId: string, bidId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/escrow/accept-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          load_id: loadId,
          bid_id: bidId,
          broker_id: brokerId
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      // In a real app, you would pass `clientSecret` to standard Stripe Elements
      alert(`Escrow Locked! Stripe Intent Generated.\nClient Secret: ${result.clientSecret.substring(0,10)}...\nHolding $${result.escrowSummary.totalCharge} securely.`);
      
      // Optimistic mutate status to pending
      setLoads(loads.map(L => L.id === loadId ? { ...L, status: "PENDING_ESCROW" } : L));

    } catch(err: any) {
      alert(`Escrow Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Active Freight Operations</h1>
          <p className="text-slate-400 mt-2">Manage your open pilot car requests and secure escrow payments.</p>
        </div>
        <Button variant="default">+ Post New Load</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route Code</TableHead>
              <TableHead>Origin / Destination</TableHead>
              <TableHead>Equipment Req</TableHead>
              <TableHead>Highest Bid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loads.length === 0 && (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    No active loads right now. Post an oversize load to start receiving bids.
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
                     : "Standard Escort"}
                </TableCell>
                <TableCell className="font-semibold text-white">
                  {/* Mock logic: Normally you'd inner-join load_bids. */ }
                  ${l.posted_rate > 0 ? l.posted_rate : "450"} 
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold
                    ${l.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                    {l.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {l.status === 'OPEN' ? (
                     <Button 
                       size="sm" 
                       disabled={isProcessing}
                       onClick={() => handleAcceptBid(l.id, "mock-bid-id")}
                     >
                        Accept & Fund Escrow
                     </Button>
                  ) : (
                     <span className="text-slate-500 text-sm">Escrow Locked 🔒</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
