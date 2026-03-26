import { createClient } from "@/lib/supabase/server";
import { OperatorDashboardClient } from "./OperatorDashboardClient";
import { redirect } from "next/navigation";

export default async function OperatorDashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Replace with actual pilot car ID mechanism if hooked
  const operatorId = user?.id || "f4d2b4c2-9876-zyxw-vu-ts9876zyxw";

  // 1. Fetch available Open loads for bidding (Marketplace board)
  const { data: openLoads, error } = await supabase
    .from("loads")
    .select("*")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Operator Dashboard Error:", error.message);
  }

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <OperatorDashboardClient operatorId={operatorId} availableLoads={openLoads || []} />
      </div>
    </div>
  );
}
