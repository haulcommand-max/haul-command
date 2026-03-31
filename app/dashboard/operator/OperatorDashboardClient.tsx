"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
      
    } catch(err: any) {
      alert(`Dispatch Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pilot Car Command</h1>
          <p className="text-slate-400 mt-2">Active Oversize Routes & Open Network Dispatch Bids.</p>
        </div>
        <div className="text-right">
          <span className="text-emerald-400 font-mono text-sm uppercase block">Status: Active</span>
          <span className="text-slate-500 font-mono text-xs">Waiting for Dispatch Ping (Novu)</span>
        </div>
      </div>

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
                           placeholder="Enter Quote ($)"
                           className="bg-slate-800 text-white px-3 py-1 rounded text-sm w-32 outline-none border border-slate-700"
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
                        <Button aria-label="Interactive Button" className="text-slate-500 text-sm hover:text-white transition" onClick={() => setBiddingOn(null)}>Cancel</button>
                     </div>
                  ) : (
                     <Button aria-label="Interactive Button" 
                       size="sm" 
                       variant="default"
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
  );
}
