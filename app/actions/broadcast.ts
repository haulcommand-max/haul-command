'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function postAvailableNow(formData: FormData) {
    const supabase = await createClient();
    
    // Auth Check
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (!user || authErr) {
        throw new Error("You must be logged in to broadcast availability.");
    }

    const city = formData.get('city') as string;
    const state_code = formData.get('state_code') as string;
    const radius_miles = parseInt(formData.get('radius_miles') as string || '50');
    const status = formData.get('status') as string || 'available_now';

    if (!city || !state_code) {
        throw new Error("City and State are required to broadcast your location.");
    }

    const { error } = await supabase.from('availability_broadcasts').insert({
        operator_id: user.id,
        city,
        state_code,
        radius_miles,
        status,
        country_code: 'US', // Can be expanded dynamically
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hrs
    });

    if (error) {
        console.error("Broadcast Error:", error);
        throw new Error("Failed to post availability.");
    }

    revalidatePath('/available-now');
    return { success: true };
}

export async function fetchAvailableEscorts(limit = 50) {
    const supabase = await createClient();
    // Assuming anonymous read is allowed for v_available_escorts per the migration
    const { data, error } = await supabase
        .from('v_available_escorts')
        .select('*')
        .limit(limit);
        
    if (error) {
        console.error("Fetch Available Error:", error);
        return [];
    }
    return data;
}
