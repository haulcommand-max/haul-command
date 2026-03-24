/**
 * POST /api/messaging/respond-offer
 * Accept, decline, or counter an offer message.
 * Body: { messageId, action: 'accept'|'decline'|'counter', counterRate? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { messageId, action, counterRate } = await request.json();

    if (!messageId || !action || !['accept', 'decline', 'counter'].includes(action)) {
      return NextResponse.json(
        { error: 'messageId and action (accept|decline|counter) required' },
        { status: 400 }
      );
    }

    // Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the original offer message
    const { data: offerMsg, error: fetchErr } = await sb
      .from('messages')
      .select('id, conversation_id, sender_id, offer_data, message_type')
      .eq('id', messageId)
      .single();

    if (fetchErr || !offerMsg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (offerMsg.message_type !== 'offer' && offerMsg.message_type !== 'counter_offer') {
      return NextResponse.json({ error: 'Message is not an offer' }, { status: 400 });
    }

    // Verify user is in the conversation
    const { data: conv } = await sb
      .from('conversations')
      .select('id, participant_ids, load_id')
      .eq('id', offerMsg.conversation_id)
      .single();

    if (!conv || !conv.participant_ids.includes(user.id)) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // Send system message
      const { data: sysMsg } = await sb
        .from('messages')
        .insert({
          conversation_id: offerMsg.conversation_id,
          sender_id: user.id,
          body: 'Offer accepted — escrow created',
          message_type: 'acceptance',
        })
        .select('id, created_at')
        .single();

      // Create escrow record if load is linked
      if (conv.load_id && offerMsg.offer_data) {
        await sb.from('escrow_transactions').insert({
          load_id: conv.load_id,
          conversation_id: conv.id,
          payer_id: offerMsg.sender_id,
          payee_id: user.id,
          amount: offerMsg.offer_data.rate_per_day,
          status: 'funded',
        }).select().maybeSingle();
      }

      // Update conversation preview
      await sb.from('conversations').update({
        last_message_at: sysMsg?.created_at ?? now,
        last_message_preview: 'Offer accepted — escrow created',
      }).eq('id', offerMsg.conversation_id);

      // Notify the offer sender
      await sb.from('notifications').insert({
        user_id: offerMsg.sender_id,
        type: 'offer_accepted',
        title: 'Offer Accepted',
        body: 'Your load offer has been accepted',
        data: { conversationId: offerMsg.conversation_id, messageId },
      });

      return NextResponse.json({ status: 'accepted', escrowCreated: !!conv.load_id });

    } else if (action === 'decline') {
      // Send system message
      const { data: sysMsg } = await sb
        .from('messages')
        .insert({
          conversation_id: offerMsg.conversation_id,
          sender_id: user.id,
          body: 'Offer declined',
          message_type: 'decline',
        })
        .select('id, created_at')
        .single();

      await sb.from('conversations').update({
        last_message_at: sysMsg?.created_at ?? now,
        last_message_preview: 'Offer declined',
      }).eq('id', offerMsg.conversation_id);

      await sb.from('notifications').insert({
        user_id: offerMsg.sender_id,
        type: 'offer_declined',
        title: 'Offer Declined',
        body: 'Your load offer was declined',
        data: { conversationId: offerMsg.conversation_id, messageId },
      });

      return NextResponse.json({ status: 'declined' });

    } else if (action === 'counter') {
      if (!counterRate) {
        return NextResponse.json({ error: 'counterRate required for counter action' }, { status: 400 });
      }

      const counterOfferData = {
        ...offerMsg.offer_data,
        rate_per_day: counterRate,
        original_rate: offerMsg.offer_data?.rate_per_day,
      };

      const { data: counterMsg } = await sb
        .from('messages')
        .insert({
          conversation_id: offerMsg.conversation_id,
          sender_id: user.id,
          body: `Counter offer: $${counterRate}/day`,
          message_type: 'counter_offer',
          offer_data: counterOfferData,
        })
        .select('id, created_at')
        .single();

      await sb.from('conversations').update({
        last_message_at: counterMsg?.created_at ?? now,
        last_message_preview: `Counter offer: $${counterRate}/day`,
      }).eq('id', offerMsg.conversation_id);

      await sb.from('notifications').insert({
        user_id: offerMsg.sender_id,
        type: 'counter_offer',
        title: 'Counter Offer Received',
        body: `Counter offer: $${counterRate}/day`,
        data: { conversationId: offerMsg.conversation_id, messageId: counterMsg?.id },
      });

      return NextResponse.json({ status: 'countered', messageId: counterMsg?.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Respond offer error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
