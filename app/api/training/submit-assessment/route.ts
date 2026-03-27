import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const TIER_MODULE_MAP: Record<string, string[]> = {
  hc_certified: ['platform-fundamentals', 'global-regulations-overview', 'load-type-mastery'],
  av_ready: ['platform-fundamentals', 'global-regulations-overview', 'load-type-mastery', 'av-proximity-protocols', 'oilfield-specialist'],
  elite: ['platform-fundamentals', 'global-regulations-overview', 'load-type-mastery', 'av-proximity-protocols', 'oilfield-specialist', 'superload-advanced', 'international-operations'],
};

const TIER_EXPIRY_YEARS: Record<string, number> = {
  hc_certified: 2,
  av_ready: 1,
  elite: 1,
};

export async function POST(req: NextRequest) {
  try {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { module_id, answers } = await req.json();
    if (!module_id || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'module_id and answers required' }, { status: 400 });
    }

    // Fetch questions for this module
    const { data: questions } = await supabase
      .from('training_questions')
      .select('id, correct_answer_id, explanation, options')
      .eq('module_id', module_id);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this module' }, { status: 404 });
    }

    // Fetch module pass_score and tier
    const { data: module } = await supabase
      .from('training_modules')
      .select('pass_score, certification_tier, slug')
      .eq('id', module_id)
      .single();

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Score the assessment
    const questionMap = new Map(questions.map(q => [q.id, q]));
    let correct = 0;
    const breakdown: Array<{ question_id: string; submitted: string; correct_answer: string; is_correct: boolean; explanation: string }> = [];

    for (const ans of answers) {
      const q = questionMap.get(ans.question_id);
      if (!q) continue;
      const isCorrect = q.correct_answer_id === ans.answer_id;
      if (isCorrect) correct++;
      breakdown.push({
        question_id: ans.question_id,
        submitted: ans.answer_id,
        correct_answer: q.correct_answer_id,
        is_correct: isCorrect,
        explanation: q.explanation,
      });
    }

    const totalQuestions = questions.length;
    const score = Math.round((correct / totalQuestions) * 100);
    const passed = score >= (module.pass_score || 80);

    // Record attempt
    await supabase.from('certification_attempts').insert({
      user_id: user.id,
      module_id,
      answers,
      score,
      passed,
    });

    // Get attempt count
    const { data: prevAttempts } = await supabase
      .from('certification_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('module_id', module_id);

    const totalAttempts = prevAttempts?.length || 1;
    const attemptsRemaining = Math.max(0, 3 - totalAttempts);

    // Update module progress
    if (passed) {
      await supabase.from('user_module_progress').upsert({
        user_id: user.id,
        module_id,
        status: 'passed',
        score,
        completed_at: new Date().toISOString(),
        attempts: totalAttempts,
        last_attempt_at: new Date().toISOString(),
      }, { onConflict: 'user_id,module_id' });

      // Check if all modules for the tier are now passed
      const tierModules = TIER_MODULE_MAP[module.certification_tier] || [];
      const { data: tierModuleRecords } = await supabase
        .from('training_modules')
        .select('id, slug')
        .in('slug', tierModules);

      if (tierModuleRecords) {
        const tierModuleIds = tierModuleRecords.map(m => m.id);
        const { data: passedModules } = await supabase
          .from('user_module_progress')
          .select('module_id')
          .eq('user_id', user.id)
          .eq('status', 'passed')
          .in('module_id', tierModuleIds);

        const allPassed = passedModules?.length === tierModuleIds.length;

        if (allPassed) {
          // Issue certification
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + (TIER_EXPIRY_YEARS[module.certification_tier] || 1));

          const certData = {
            user_id: user.id,
            certification_tier: module.certification_tier,
            status: 'passed',
            completed_at: new Date().toISOString(),
            expires_at: expiryDate.toISOString(),
            score,
          };

          await supabase.from('user_certifications').upsert(certData, {
            onConflict: 'user_id,certification_tier',
          });

          // Generate PDF certificate, upload, and send Resend email
          try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
            
            // Draw certificate background/border
            doc.setDrawColor(197, 146, 58); // amber border
            doc.setLineWidth(10);
            doc.rect(20, 20, 802, 555);
            doc.setLineWidth(2);
            doc.rect(30, 30, 782, 535);

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(36);
            doc.setTextColor(10, 10, 15);
            doc.text('HAUL COMMAND', 421, 120, { align: 'center' });
            
            doc.setFontSize(24);
            doc.setTextColor(197, 146, 58);
            doc.text('CERTIFICATE OF LOGISTICS EXCELLENCE', 421, 170, { align: 'center' });

            // Body
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(16);
            doc.setTextColor(50, 50, 50);
            doc.text('This certifies that', 421, 240, { align: 'center' });
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.setTextColor(10, 10, 15);
            doc.text((user.user_metadata?.full_name || user.email || 'Pilot Car Operator').toUpperCase(), 421, 290, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(16);
            doc.setTextColor(50, 50, 50);
            doc.text(`has successfully completed the comprehensive assessment for`, 421, 340, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            const tierNames: Record<string, string> = { hc_certified: 'HAUL COMMAND CERTIFIED', av_ready: 'AUTONOMOUS VEHICLE ESCORT', elite: 'ELITE SPECIALIZED TRANSPORT' };
            doc.text((tierNames[module.certification_tier] || module.certification_tier).toUpperCase(), 421, 380, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Completed on: ${new Date().toLocaleDateString()}  •  Score: ${score}%  •  Valid until: ${expiryDate.toLocaleDateString()}`, 421, 450, { align: 'center' });

            doc.setFontSize(10);
            doc.text('This is an electronically generated official certification registered on the Haul Command Compliance Engine.', 421, 520, { align: 'center' });

            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            const pdfPath = `certificates/${user.id}/${module.certification_tier}_${new Date().getFullYear()}.pdf`;

            await supabase.storage.from('artifacts').upload(pdfPath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });

            // Send via Resend
            if (process.env.RESEND_API_KEY && user.email) {
              const { Resend } = await import('resend');
              const resend = new Resend(process.env.RESEND_API_KEY);
              
              const certUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/artifacts/${pdfPath}`;
              
              await resend.emails.send({
                from: 'Haul Command Training <compliance@haulcommand.com>',
                to: user.email,
                subject: `Congratulations! Your ${tierNames[module.certification_tier] || module.certification_tier} Certificate`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Congratulations, ${user.user_metadata?.full_name || 'Operator'}!</h2>
                    <p>You have successfully passed your assessment with a score of ${score}% and achieved <strong>${tierNames[module.certification_tier] || module.certification_tier}</strong> status.</p>
                    <p>Your digital certificate is attached to your operator profile and accessible on the platform. You can also download it directly below:</p>
                    <a href="${certUrl}" style="display:inline-block;background:#F59E0B;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:6px;margin-top:10px;">Download Certificate</a>
                    <p style="margin-top:20px;color:#666;">Drive Safe,<br>Haul Command Compliance Team</p>
                  </div>
                `
              });
            }
          } catch (e) {
            console.error('Error generating/sending certificate:', e);
          }

          return NextResponse.json({
            passed: true,
            score,
            pass_score: module.pass_score,
            attempts_remaining: attemptsRemaining,
            tier_completed: true,
            certification_tier: module.certification_tier,
            breakdown,
          });
        }
      }
    } else {
      await supabase.from('user_module_progress').upsert({
        user_id: user.id,
        module_id,
        status: 'failed',
        score,
        attempts: totalAttempts,
        last_attempt_at: new Date().toISOString(),
      }, { onConflict: 'user_id,module_id' });
    }

    return NextResponse.json({
      passed,
      score,
      pass_score: module.pass_score,
      attempts_remaining: attemptsRemaining,
      tier_completed: false,
      breakdown,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
