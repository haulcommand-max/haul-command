import { NextResponse } from 'next/server';
import { OS_EVENTS } from '@/lib/os-events';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // MSB Logic: Verify Stripe Signature via headers in prod
        
        if (body.type === 'checkout.session.completed') {
            const escrowId = body.data.object.metadata.escrowId;
            // Fire Event Bus Trigger
            // await GlobalEventBus.emit(OS_EVENTS.ESCROW_LOCKED, { escrowId, gateway: 'stripe' });
            
            // In a real app we'd update Supabase hc_escrows here
            console.log(`[Stripe Webhook] Escrow Locked for ${escrowId}`);
        }
        
        return NextResponse.json({ received: true });
    } catch (e) {
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 400 });
    }
}
