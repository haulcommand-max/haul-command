import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/workers/_shared/logger";

export const runSponsorRepriceWorker = async () => {
  const supabase = getSupabaseAdmin();
  logger.info("sponsor_reprice.started");

  // Read heat signals, traffic scores, and corridor urgency
  // to dynamically update `hc_sponsor_inventory_dynamic.current_price_minor`
  
  const { data: slots, error } = await supabase
    .from("hc_sponsor_inventory_dynamic")
    .select("*")
    .eq("active", true)
    .limit(100);

  if (error) {
    logger.error("sponsor_reprice.fetch_error", { error: error.message });
    return;
  }

  let updatedCount = 0;

  for (const slot of slots ?? []) {
    // Pricing formula: base_price_minor * (1 + traffic*0.5 + urgency*0.4 + scarcity*0.3)
    const basePrice = 10000; // $100.00
    const traffic = Number(slot.traffic_score || 0);
    const urgency = Number(slot.urgency_score || 0);
    const scarcity = Number(slot.scarcity_score || 0);
    
    let localMultiplier = 1.0;
    if (slot.country_code === 'US' || slot.country_code === 'CA') localMultiplier = 1.2;

    const multiplier = 1 + (traffic * 0.5) + (urgency * 0.4) + (scarcity * 0.3);
    const newPrice = Math.floor(basePrice * multiplier * localMultiplier);

    const { error: updateError } = await supabase
      .from("hc_sponsor_inventory_dynamic")
      .update({
        current_price_minor: newPrice,
        premium_multiplier: multiplier,
        updated_at: new Date().toISOString()
      })
      .eq("id", slot.id);

    if (updateError) {
      logger.error("sponsor_reprice.update_failed", { slot_id: slot.id, error: updateError.message });
    } else {
      updatedCount++;
    }
  }

  logger.info("sponsor_reprice.completed", { updated_count: updatedCount });
  return { updated_count: updatedCount };
};
