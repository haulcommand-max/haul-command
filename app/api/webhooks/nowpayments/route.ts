import { NextResponse } from 'next/server';
import { OS_EVENTS } from '@/lib/os-events';
import { verifyIpnSignature } from '@/lib/hc-pay/nowpayments';

export async function POST(req: Request) {
    try {
        const sig = req.headers.get('x-nowpayments-sig') || '';
        const rawBody = await req.text();
        
        const isValid = await verifyIpnSignature(rawBody, sig);
        if (!isValid) return NextResponse.json({ error: 'Invalid Sig' }, { status: 401 });

        const body = JSON.parse(rawBody);
        
        if (body.payment_status === 'finished') {
             // MSB Rule: Fire event to auto-convert to stablecoin logic in background
             console.log(`[NOWPayments Webhook] Crypto Cleared: Escrow Locked for ${body.order_id}`);
             // Object metadata holds routing
             // await GlobalEventBus.emit(OS_EVENTS.ESCROW_LOCKED, { escrowId: body.order_id, gateway: 'crypto' });
        }
        
        return NextResponse.json({ received: true });
    } catch (e) {
        return NextResponse.json({ error: 'Webhook Failed' }, { status: 400 });
    }
}
