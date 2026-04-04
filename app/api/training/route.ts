/**
 * Training & Credential Marketplace APIs
 * 
 * GET: List available training programs and credential verifications
 * POST: Enroll in a training program or submit for credential verification
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';


// Training programs offered through the marketplace
const TRAINING_PROGRAMS = [
    {
        id: 'pilot-car-fundamentals',
        title: 'Pilot Car Operations Fundamentals',
        provider: 'HAUL COMMAND Academy',
        type: 'self_paced',
        duration_hours: 8,
        price: 149,
        category: 'certification',
        description: 'Industry-standard pilot car operations training covering safety protocols, communication procedures, route surveying, and federal/state regulations.',
        modules: ['Safety & PPE', 'Communication Protocols', 'Route Survey Methods', 'State Regulations Overview', 'Emergency Procedures'],
        credential_on_completion: 'HC001-PilotCarOps',
        reputation_points: 15,
        badge: 'certified_pilot',
    },
    {
        id: 'height-pole-mastery',
        title: 'Height Pole Operations & Safety',
        provider: 'HAUL COMMAND Academy',
        type: 'self_paced',
        duration_hours: 4,
        price: 99,
        category: 'specialization',
        description: 'Specialized training for height pole operations including deflection physics, clearance verification, and real-time adjustment techniques.',
        modules: ['Pole Types & Selection', 'Deflection Physics', 'Clearance Verification', 'Real-Time Adjustments', 'Emergency Protocols'],
        credential_on_completion: 'HC002-HeightPole',
        reputation_points: 20,
        badge: 'height_pole_certified',
    },
    {
        id: 'superload-escort',
        title: 'Superload Escort Specialist',
        provider: 'HAUL COMMAND Academy',
        type: 'instructor_led',
        duration_hours: 16,
        price: 349,
        category: 'specialization',
        description: 'Advanced superload escort certification covering multi-axle configurations, turning calculations, bridge load analysis, and multi-vehicle coordination.',
        modules: ['Superload Classification', 'Turn Geometry', 'Bridge Analysis', 'Multi-Vehicle Coordination', 'Night Operations', 'Incident Response'],
        credential_on_completion: 'HC003-Superload',
        reputation_points: 30,
        badge: 'superload_specialist',
    },
    {
        id: 'broker-dispatch-pro',
        title: 'Broker Dispatch Operations',
        provider: 'HAUL COMMAND Academy',
        type: 'self_paced',
        duration_hours: 6,
        price: 199,
        category: 'broker',
        description: 'Training for brokers and dispatchers on efficient escort dispatch, compliance verification, and load matching optimization.',
        modules: ['Load Assessment', 'Escort Matching', 'Compliance Checker', 'Rate Negotiation', 'Post-Move Documentation'],
        credential_on_completion: 'HC004-BrokerDispatch',
        reputation_points: 10,
        badge: 'dispatch_pro',
    },
    {
        id: 'state-regs-us',
        title: 'US State Regulations Mastery',
        provider: 'HAUL COMMAND Academy',
        type: 'self_paced',
        duration_hours: 12,
        price: 249,
        category: 'compliance',
        description: 'Comprehensive 50-state escort vehicle regulations coverage including reciprocity agreements, equipment requirements, and operational restrictions.',
        modules: ['Eastern States', 'Central States', 'Western States', 'Reciprocity Matrix', 'Equipment Standards', 'Exam'],
        credential_on_completion: 'HC005-USRegs',
        reputation_points: 25,
        badge: 'regs_master',
    },
];

// Credential verification services
const CREDENTIAL_SERVICES = [
    {
        id: 'insurance-verify',
        title: 'Insurance Verification',
        price: 29,
        turnaround_hours: 24,
        description: 'Verify active insurance coverage with carrier confirmation.',
        required_docs: ['Certificate of Insurance'],
        verification_type: 'automated',
    },
    {
        id: 'cdl-verify',
        title: 'CDL Verification',
        price: 19,
        turnaround_hours: 48,
        description: 'Verify Commercial Driver License status and endorsements.',
        required_docs: ['CDL Front', 'CDL Back'],
        verification_type: 'automated',
    },
    {
        id: 'background-check',
        title: 'Background Screening',
        price: 49,
        turnaround_hours: 72,
        description: 'Comprehensive background screening for trusted operator status.',
        required_docs: ['Government ID', 'Signed Consent Form'],
        verification_type: 'manual',
    },
    {
        id: 'equipment-inspection',
        title: 'Equipment Self-Inspection',
        price: 0,
        turnaround_hours: 1,
        description: 'Photo-based equipment checklist verification.',
        required_docs: ['Vehicle Photos (4 angles)', 'Equipment Checklist'],
        verification_type: 'ai_assisted',
    },
];

export async function GET(req: NextRequest) {
    const category = req.nextUrl.searchParams.get('category');
    const supabase = getSupabaseAdmin();

    let programs = TRAINING_PROGRAMS;
    if (category) {
        programs = programs.filter(p => p.category === category);
    }

    // Fetch live enrollment and credential stats
    let totalEnrolled = 0;
    let totalCredentials = 0;
    try {
        const [enrollRes, credRes] = await Promise.all([
            supabase.from('training_enrollments').select('id', { count: 'exact', head: true }),
            supabase.from('credential_verifications').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        ]);
        totalEnrolled = enrollRes.count ?? 0;
        totalCredentials = credRes.count ?? 0;
    } catch { /* graceful fallback */ }

    return NextResponse.json({
        ok: true,
        training_programs: programs,
        credential_services: CREDENTIAL_SERVICES,
        stats: {
            total_programs: TRAINING_PROGRAMS.length,
            total_enrolled: totalEnrolled,
            total_credentials_issued: totalCredentials,
        },
    }, {
        headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200' },
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            action: 'enroll' | 'verify_credential';
            program_id?: string;
            service_id?: string;
            operator_id: string;
        };

        if (!body.operator_id) {
            return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        if (body.action === 'enroll' && body.program_id) {
            const program = TRAINING_PROGRAMS.find(p => p.id === body.program_id);
            if (!program) {
                return NextResponse.json({ error: 'Program not found' }, { status: 404 });
            }

            // Create enrollment record
            const { data, error } = await supabase.from('training_enrollments').insert({
                operator_id: body.operator_id,
                program_id: program.id,
                program_title: program.title,
                status: 'enrolled',
                price_paid: program.price,
                enrolled_at: new Date().toISOString(),
                credential_code: program.credential_on_completion,
                reputation_points: program.reputation_points,
            }).select().single();

            if (error) throw error;

            // Create Stripe checkout if price > 0
            let checkoutUrl: string | null = null;
            if (program.price > 0 && process.env.STRIPE_SECRET_KEY) {
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                const session = await stripe.checkout.sessions.create({
                    mode: 'payment',
                    line_items: [{
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: program.title,
                                description: program.description,
                            },
                            unit_amount: program.price * 100,
                        },
                        quantity: 1,
                    }],
                    metadata: {
                        type: 'training_enrollment',
                        enrollment_id: data.id,
                        program_id: program.id,
                        operator_id: body.operator_id,
                    },
                    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com'}/training/success?enrollment=${data.id}`,
                    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com'}/training`,
                });
                checkoutUrl = session.url;
            }

            return NextResponse.json({
                ok: true,
                enrollment_id: data.id,
                program: program.title,
                checkoutUrl,
                next_step: checkoutUrl ? 'Complete payment' : 'Start training',
            });
        }

        if (body.action === 'verify_credential' && body.service_id) {
            const service = CREDENTIAL_SERVICES.find(s => s.id === body.service_id);
            if (!service) {
                return NextResponse.json({ error: 'Credential service not found' }, { status: 404 });
            }

            const { data, error } = await supabase.from('credential_verifications').insert({
                operator_id: body.operator_id,
                service_id: service.id,
                service_title: service.title,
                status: 'pending',
                price: service.price,
                verification_type: service.verification_type,
                expected_turnaround_hours: service.turnaround_hours,
                submitted_at: new Date().toISOString(),
            }).select().single();

            if (error) throw error;

            return NextResponse.json({
                ok: true,
                verification_id: data.id,
                service: service.title,
                turnaround: `${service.turnaround_hours} hours`,
                required_docs: service.required_docs,
                next_step: 'Upload required documents',
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
