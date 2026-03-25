import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_fallback");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, role, corridors_or_regions, loads_per_month, primary_interest, email, phone } = body;

    if (!company || !role || !primary_interest || !email) {
      return NextResponse.json({ error: 'company, role, primary_interest, email required' }, { status: 400 });
    }

    const supabase = createClient();

    // Save to Supabase
    await supabase.from('partner_inquiries').insert({
      company, role, corridors_or_regions: corridors_or_regions || null,
      loads_per_month: loads_per_month || null,
      primary_interest, email, phone: phone || null,
    });

    // Notify Haul Command
    await resend.emails.send({
      from: 'Haul Command <notifications@haulcommand.com>',
      to: ['haulcommand@gmail.com'],
      subject: `\ud83d\udea8 New Partner Inquiry — ${company} (${primary_interest})`,
      html: `
        <h2>New Partner Inquiry</h2>
        <table>
          <tr><td><strong>Company:</strong></td><td>${company}</td></tr>
          <tr><td><strong>Role:</strong></td><td>${role}</td></tr>
          <tr><td><strong>Interest:</strong></td><td>${primary_interest}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${phone || 'not provided'}</td></tr>
          <tr><td><strong>Corridors:</strong></td><td>${corridors_or_regions || 'not specified'}</td></tr>
          <tr><td><strong>Loads/month:</strong></td><td>${loads_per_month || 'not specified'}</td></tr>
        </table>
        <p><a href="https://haulcommand.com/admin/content">View in Admin Dashboard</a></p>
      `,
    });

    // Auto-reply to inquirer
    const USE_CASE_CONTENT: Record<string, string> = {
      'AV corridor escorts': `
        <p>We\u2019ve built a network of HC AV-Ready certified escort operators on the primary autonomous trucking corridors in Texas and beyond.</p>
        <p>Key points for AV operations:<br/>
        \u2022 AV proximity training protocol for operators<br/>
        \u2022 Platform-specific knowledge (Aurora, Kodiak, Waabi)<br/>
        \u2022 API integration available for direct dispatch connection<br/>
        \u2022 Compliance documentation auto-generated for every engagement</p>
        <p>Full details: <a href="https://haulcommand.com/partners/autonomous-vehicles">haulcommand.com/partners/autonomous-vehicles</a></p>
      `,
      'Oilfield moves': `
        <p>We have operators in the Permian Basin, Eagle Ford, Bakken, and most major oil patch regions who know FM roads, oilfield protocols, and how to navigate the permits.</p>
        <p>For rig moves specifically: we handle multi-escort coordination, FM routing, and all the documentation your operations team needs.</p>
        <p>Full details: <a href="https://haulcommand.com/partners/oilfield">haulcommand.com/partners/oilfield</a></p>
      `,
    };

    const useContent = USE_CASE_CONTENT[primary_interest] || `
      <p>We\u2019ll review your specific requirements and come back with a clear answer on coverage and capability \u2014 no pitch, just information.</p>
      <p>Platform overview: <a href="https://haulcommand.com/partners">haulcommand.com/partners</a></p>
    `;

    await resend.emails.send({
      from: 'Haul Command <hello@haulcommand.com>',
      to: [email],
      subject: `Got your inquiry — here\u2019s what Haul Command can do for ${company}`,
      html: `
        <p>Hi ${role},</p>
        <p>Got your inquiry for <strong>${company}</strong> \u2014 interest in <strong>${primary_interest}</strong>.</p>
        ${useContent}
        <p>We\u2019ll follow up within one business day with specifics. No demo required unless you want one.</p>
        <p>\u2014 Haul Command Team<br/>
        <a href="https://haulcommand.com">haulcommand.com</a></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Partner inquiry error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
