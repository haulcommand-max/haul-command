import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, contact_name, email, phone, estimated_operators, corridors, message } = body;

    if (!company_name || !contact_name || !email) {
      return NextResponse.json({ error: 'company_name, contact_name, and email are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    // Save to DB
    const { error: dbErr } = await supabase.from('corporate_training_inquiries').insert({
      company_name,
      contact_name,
      email,
      phone: phone || null,
      estimated_operators: estimated_operators ? parseInt(estimated_operators) : null,
      corridors: corridors || null,
      message: message || null,
    });

    if (dbErr) {
      console.error('DB error:', dbErr);
      // Don't fail — still send email
    }

    // Send notification email via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Haul Command Training <training@haulcommand.com>',
            to: ['training@haulcommand.com'],
            subject: `Corporate Training Inquiry — ${company_name}`,
            html: `
              <h2>New Corporate Training Inquiry</h2>
              <table>
                <tr><td><strong>Company:</strong></td><td>${company_name}</td></tr>
                <tr><td><strong>Contact:</strong></td><td>${contact_name}</td></tr>
                <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>${phone || 'N/A'}</td></tr>
                <tr><td><strong>Operators:</strong></td><td>${estimated_operators || 'N/A'}</td></tr>
                <tr><td><strong>Corridors:</strong></td><td>${corridors || 'N/A'}</td></tr>
              </table>
              <h3>Message</h3>
              <p>${message || 'No message provided'}</p>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        // Don't fail the request
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
