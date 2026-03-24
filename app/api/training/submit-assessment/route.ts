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

          // TODO: Generate PDF certificate, send Resend email

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
