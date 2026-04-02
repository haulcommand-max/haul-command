// app/dashboard/broker/loads/page.tsx
import { createClient } from "@/lib/supabase/server";
import { LoadBoardClient } from "./LoadBoardClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function BrokerLoadsPage() {
  const supabase = createClient();

  // 1. Ensure User is logged in securely
  const { data: { user } } = await supabase.auth.getUser();

  // For this mock demo, we hardcode a broker ID, 
  // but if the user table is hooked up correctly it would read: user?.id
  const brokerId = user?.id || "e3c1a3b1-1234-abcd-efgh-56781234abcd";

  // 2. Fetch the broker's active loads directly via Server Components
  // Bypassing middleware latency with direct DB query
  const { data: activeLoads, error } = await supabase
    .from("loads")
    .select("*")
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Broker Loads Page Error:", error.message);
  }

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <LoadBoardClient brokerId={brokerId} initialLoads={activeLoads || []} />
      </div>
    </div>
  );
}
