"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export function AssignmentActions({ 
  assignmentId, 
  currentStatus 
}: { 
  assignmentId: string;
  currentStatus: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleMilestone = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/dispatch/milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment_id: assignmentId, new_status: newStatus })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to update milestone");

      // Refresh the page data natively
      router.refresh();
      
    } catch (err: any) {
      alert(`Milestone Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (currentStatus === "active") {
    return (
      <div className="mt-6 flex flex-col gap-2">
        <Button aria-label="Confirm In-Transit" 
          onClick={() => handleMilestone("in_transit")}
          disabled={isProcessing}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg"
        >
          {isProcessing ? "Updating..." : "Confirm In-Transit"}
        </Button>
        <Button aria-label="Report Issue" variant="ghost" className="w-full text-slate-500">
          Report Issue
        </Button>
      </div>
    );
  }

  if (currentStatus === "in_transit") {
    return (
      <div className="mt-6 flex flex-col gap-2">
        <Button aria-label="Confirm Complete" 
          onClick={() => handleMilestone("completed")}
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg"
        >
          {isProcessing ? "Processing..." : "Complete & Request Payout"}
        </Button>
      </div>
    );
  }

  return null;
}
