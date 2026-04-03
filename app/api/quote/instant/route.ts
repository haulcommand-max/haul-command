/**
 * POST /api/quote/instant
 *
 * Public endpoint: runs the instant-quote-engine against user-provided
 * load dimensions and route, returns an InstantQuote with pricing,
 * escort requirements, coverage confidence, and permits.
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateInstantQuote, type QuoteRequest } from '@/lib/quotes/instant-quote-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.origin || !body.destination) {
            return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 });
        }
        if (!body.loadDimensions || !body.loadDimensions.widthM) {
            return NextResponse.json({ error: 'Missing loadDimensions.widthM' }, { status: 400 });
        }

        const request: QuoteRequest = {
            requestId: `RFQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            requesterType: body.requesterType || 'broker',
            requesterName: body.requesterName,
            requesterEmail: body.requesterEmail,
            requesterPhone: body.requesterPhone,
            loadDimensions: {
                widthM: Number(body.loadDimensions.widthM) || 3.0,
                heightM: Number(body.loadDimensions.heightM) || 4.0,
                lengthM: Number(body.loadDimensions.lengthM) || 20.0,
                weightT: Number(body.loadDimensions.weightT) || 40.0,
            },
            loadDescription: body.loadDescription || '',
            loadType: body.loadType,
            origin: body.origin,
            originState: body.originState || '',
            originCountry: body.originCountry || 'US',
            destination: body.destination,
            destinationState: body.destinationState || '',
            destinationCountry: body.destinationCountry || 'US',
            statesCrossed: body.statesCrossed,
            preferredDate: body.preferredDate || new Date().toISOString().split('T')[0],
            flexibility: body.flexibility || 'flexible',
            urgency: body.urgency || 'standard',
        };

        const quote = generateInstantQuote(request);

        return NextResponse.json(quote);
    } catch (err) {
        console.error('Instant quote error:', err);
        return NextResponse.json({ error: 'Failed to generate quote' }, { status: 500 });
    }
}
