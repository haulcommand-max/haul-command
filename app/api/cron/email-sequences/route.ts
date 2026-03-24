import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

// Vercel cron: 0 9 * * * (9am UTC daily)
// Processes email sequence step sends
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const results: any[] = [];

  // Get all active enrollments that need their next step
  const { data: enrollments } = await supabase
    .from('email_sequence_enrollments')
    .select('*')
    .eq('completed', false)
    .eq('unsubscribed', false);

  if (!enrollments) return NextResponse.json({ processed: 0 });

  for (const enrollment of enrollments) {
    const sequences = getSequenceDefinition(enrollment.sequence_id);
    if (!sequences) continue;

    const nextStep = sequences[enrollment.current_step];
    if (!nextStep) {
      // Sequence complete
      await supabase.from('email_sequence_enrollments').update({ completed: true }).eq('id', enrollment.id);
      continue;
    }

    // Check if delay has passed
    const lastSent = enrollment.last_sent_at ? new Date(enrollment.last_sent_at) : new Date(enrollment.enrolled_at);
    const delayMs = nextStep.delay_hours * 60 * 60 * 1000;
    if (Date.now() - lastSent.getTime() < delayMs) continue;

    // Send email
    try {
      await resend.emails.send({
        from: 'Haul Command <hello@haulcommand.com>',
        to: [enrollment.email],
        subject: nextStep.subject,
        html: nextStep.html,
      });

      await supabase.from('email_sequence_enrollments').update({
        current_step: enrollment.current_step + 1,
        last_sent_at: new Date().toISOString(),
      }).eq('id', enrollment.id);

      results.push({ email: enrollment.email, sequence: enrollment.sequence_id, step: enrollment.current_step });
    } catch (err: any) {
      console.error('Email sequence send error:', err);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

// POST /api/cron/email-sequences — enroll a user in a sequence
export async function POST(req: NextRequest) {
  try {
    const { email, sequence_id, trigger_event } = await req.json();
    if (!email || !sequence_id) return NextResponse.json({ error: 'email and sequence_id required' }, { status: 400 });

    const supabase = createClient();
    await supabase.from('email_sequence_enrollments').insert({
      email, sequence_id, trigger_event: trigger_event || 'manual',
    }).onConflict?.('email, sequence_id').ignore();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getSequenceDefinition(sequenceId: string) {
  const sequences: Record<string, Array<{ delay_hours: number; subject: string; html: string }>> = {
    corporate_training_visitor: [
      {
        delay_hours: 24,
        subject: 'How companies are certifying their escort networks',
        html: `<p>Quick thought on what we\u2019re seeing at Haul Command:</p>
               <p>AV corridors are expanding. The operators who get certified now are the ones who get first call when Aurora and Kodiak need escorts.</p>
               <p>Most companies certifying their escort network are doing it in cohorts \u2014 2-3 day intensive + certification exam. Operators who pass get the HC AV-Ready badge on their profile, which doubles their response rate on corridor requests.</p>
               <p>Full details: <a href="https://haulcommand.com/training/corporate">haulcommand.com/training/corporate</a></p>`,
      },
      {
        delay_hours: 96,
        subject: 'The Aurora escort problem \u2014 and how companies are solving it',
        html: `<p>Aurora completed 100,000 driverless miles on I-45 last year.</p>
               <p>When those trucks carry oversize loads, they still need human escorts. The problem: most escort operators don\u2019t know what to do when the truck takes autonomous evasive action.</p>
               <p>Companies that have certified their escort network through Haul Command are the ones getting preferred vendor status with AV logistics teams. It\u2019s becoming a requirement, not an option.</p>
               <p><a href="https://haulcommand.com/training/corporate">See how the corporate certification works \u2192</a></p>`,
      },
      {
        delay_hours: 168,
        subject: 'Last thing on this',
        html: `<p>If operator certification isn\u2019t on your radar right now, no problem.</p>
               <p>When it is \u2014 <a href="https://haulcommand.com/training/corporate">haulcommand.com/training/corporate</a></p>
               <p>That\u2019s it.</p>`,
      },
    ],
    broker_no_post: [
      {
        delay_hours: 48,
        subject: 'Post your first load in 90 seconds',
        html: `<p>You\u2019re set up on Haul Command but haven\u2019t posted a load yet.</p>
               <p>Here\u2019s how fast it is:<br/>
               1. Click \u201cPost Load\u201d<br/>
               2. Enter your pickup location and corridor<br/>
               3. Set your rate and requirements<br/>
               4. That\u2019s it. Operators on that corridor start responding.</p>
               <p>Median fill time on our platform is 47 minutes. Most operators respond in under 15.</p>
               <p><a href="https://haulcommand.com/loads/new">Post your first load \u2192</a></p>`,
      },
      {
        delay_hours: 120,
        subject: '3 loads were posted on your corridor this week',
        html: `<p>This week alone, 3 loads were posted on corridors where you operate.</p>
               <p>Loads that go through Haul Command get filled faster, have verified operators, and pay through escrow \u2014 no disputes, no chasing payment.</p>
               <p><a href="https://haulcommand.com/loads/new">Post a load now \u2192</a></p>`,
      },
    ],
  };
  return sequences[sequenceId] || null;
}
