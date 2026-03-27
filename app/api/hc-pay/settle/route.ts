import { NextRequest, NextResponse } from 'next/server';
import { SettlementEngine } from '@/lib/monetization/settlement';
import { createClient } from '@/lib/supabase/server'; // Server component auth check

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        
        // Strict Auth Guard to trigger financial movements
        if (!session?.session?.user) {
             return NextResponse.json({ error: 'Unauthorized Settlement Access' }, { status: 401 });
        }

        const body = await req.json();
        const { jobId, factoringProgramId } = body;

        // Verify Actor is Broker of the Job OR Platform Admin
        const { data: job } = await supabase.from('jobs').select('broker_id').eq('id', jobId).single();
        if (!job || (job.broker_id !== session.session.user.id && !session.session.user.app_metadata?.is_admin)) {
             return NextResponse.json({ error: 'Escrow Dispute: Subject ID mismatch.' }, { status: 403 });
        }

        const engine = new SettlementEngine();
        const result = await engine.processLoadSettlement(jobId, factoringProgramId);

        return NextResponse.json({ success: true, payload: result });
    } catch (e: any) {
        console.error('[Settlement API] Hold/Failure state triggered:', e);
        return NextResponse.json({ error: e.message || 'Settlement Engine Internal Error' }, { status: 500 });
    }
}
