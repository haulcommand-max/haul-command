import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/standing-orders/dispatch
// System-level endpoint: fires recurring standing orders
export async function POST(req: NextRequest) {
  try {
    // Verify internal call (use auth header or internal secret)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get all standing orders due for dispatch
    const { data: dueOrders } = await supabase
      .from('standing_orders')
      .select('*')
      .eq('status', 'active')
      .lte('next_dispatch_at', new Date().toISOString());

    if (!dueOrders || dueOrders.length === 0) {
      return NextResponse.json({ dispatched: 0, message: 'No orders due' });
    }

    let dispatched = 0;

    for (const order of dueOrders) {
      // Create a load from the standing order
      const { data: load, error: loadError } = await supabase
        .from('loads')
        .insert({
          origin: order.origin,
          destination: order.destination,
          corridor: order.corridor,
          load_type: order.load_type,
          rate_per_day: order.rate_per_day,
          country_code: order.country_code,
          status: 'open',
          broker_id: order.broker_id,
          standing_order_id: order.id,
        })
        .select()
        .single();

      if (loadError) {
        console.error(`Failed to dispatch standing order ${order.id}:`, loadError);
        continue;
      }

      // If preferred operator, create conversation + offer
      if (order.preferred_operator_id) {
        const { data: conv } = await supabase
          .from('conversations')
          .insert({
            participant_ids: [order.broker_id, order.preferred_operator_id],
            load_id: load.id,
            conversation_type: 'load_offer',
          })
          .select()
          .single();

        if (conv) {
          await supabase.from('messages').insert({
            conversation_id: conv.id,
            sender_id: order.broker_id,
            body: `Standing order auto-dispatch: ${order.origin} \u2192 ${order.destination} at $${order.rate_per_day}/day`,
            message_type: 'offer',
            offer_data: {
              rate_per_day: order.rate_per_day,
              load_id: load.id,
              load_type: order.load_type,
              standing_order_id: order.id,
            },
          });

          await supabase.from('notifications').insert({
            user_id: order.preferred_operator_id,
            type: 'load_offer',
            title: `Recurring Load Offer \u2014 $${order.rate_per_day}/day`,
            body: `${order.origin} \u2192 ${order.destination}`,
            data: { load_id: load.id, conversation_id: conv.id },
            action_url: `/inbox/${conv.id}`,
          });
        }
      }

      // Calculate next dispatch
      const now = new Date();
      let nextDispatch: Date;
      switch (order.recurrence) {
        case 'daily': nextDispatch = new Date(now.getTime() + 86400000); break;
        case 'weekly': nextDispatch = new Date(now.getTime() + 604800000); break;
        case 'biweekly': nextDispatch = new Date(now.getTime() + 1209600000); break;
        case 'monthly': nextDispatch = new Date(now.setMonth(now.getMonth() + 1)); break;
        default: nextDispatch = new Date(now.getTime() + 604800000);
      }

      await supabase
        .from('standing_orders')
        .update({
          next_dispatch_at: nextDispatch.toISOString(),
          last_dispatched_at: new Date().toISOString(),
          dispatch_count: (order.dispatch_count || 0) + 1,
        })
        .eq('id', order.id);

      dispatched++;
    }

    return NextResponse.json({ dispatched, total_due: dueOrders.length });
  } catch (error: any) {
    console.error('Standing orders dispatch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
