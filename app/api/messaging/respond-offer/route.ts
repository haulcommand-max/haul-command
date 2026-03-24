import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/messaging/respond-offer
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message_id, action, counter_rate } = await req.json();
    
    if (!message_id || !action) {
      return NextResponse.json({ error: 'message_id and action required' }, { status: 400 });
    }

    // Get the offer message
    const { data: offerMsg } = await supabase
      .from('messages')
      .select('*, conversations!inner(id, participant_ids, load_id)')
      .eq('id', message_id)
      .single();

    if (!offerMsg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const conv = (offerMsg as any).conversations;
    if (!conv.participant_ids.includes(user.id)) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    switch (action) {
      case 'accept': {
        // Create system acceptance message
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_id: user.id,
          body: 'Offer accepted — escrow created',
          message_type: 'acceptance',
        });

        // Create escrow record if load exists
        if (conv.load_id && offerMsg.offer_data?.rate_per_day) {
          await supabase.from('escrow_transactions').insert({
            load_id: conv.load_id,
            operator_id: user.id,
            broker_id: offerMsg.sender_id,
            amount: offerMsg.offer_data.rate_per_day,
            status: 'held',
            conversation_id: conv.id,
          });

          // Update load status
          await supabase
            .from('loads')
            .update({ status: 'filled' })
            .eq('id', conv.load_id);
        }

        // Notify broker
        await supabase.from('notifications').insert({
          user_id: offerMsg.sender_id,
          type: 'offer_accepted',
          title: 'Offer Accepted',
          body: 'Your load offer has been accepted',
          data: { conversation_id: conv.id, message_id },
          action_url: `/inbox/${conv.id}`,
        });

        return NextResponse.json({ status: 'accepted', escrow: true });
      }

      case 'decline': {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_id: user.id,
          body: 'Offer declined',
          message_type: 'decline',
        });

        await supabase.from('notifications').insert({
          user_id: offerMsg.sender_id,
          type: 'offer_declined',
          title: 'Offer Declined',
          body: 'Your load offer was declined',
          data: { conversation_id: conv.id },
          action_url: `/inbox/${conv.id}`,
        });

        return NextResponse.json({ status: 'declined' });
      }

      case 'counter': {
        if (!counter_rate) {
          return NextResponse.json({ error: 'counter_rate required' }, { status: 400 });
        }

        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_id: user.id,
          body: `Counter offer: $${counter_rate}/day`,
          message_type: 'counter_offer',
          offer_data: {
            ...offerMsg.offer_data,
            rate_per_day: counter_rate,
            original_rate: offerMsg.offer_data?.rate_per_day,
          },
        });

        await supabase.from('notifications').insert({
          user_id: offerMsg.sender_id,
          type: 'counter_offer',
          title: `Counter Offer — $${counter_rate}/day`,
          body: 'Review the counter offer',
          data: { conversation_id: conv.id },
          action_url: `/inbox/${conv.id}`,
        });

        return NextResponse.json({ status: 'countered', rate: counter_rate });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Respond offer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
