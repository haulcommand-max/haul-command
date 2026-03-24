'use client';

import { useState, useEffect } from 'react';
import { HCBadge, BadgeTier } from '@/components/training/HCBadge';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'scenario' | 'true_false';
  options: { id: string; text: string; correct: boolean; explanation: string }[];
  correct_answer_id: string;
  explanation: string;
}

interface Module {
  id: string;
  title: string;
  pass_score: number;
  certification_tier: string;
  order_index: number;
}

interface AssessmentResult {
  passed: boolean;
  score: number;
  pass_score: number;
  attempts_remaining: number;
  tier_completed?: boolean;
  breakdown?: Array<{
    question_id: string;
    submitted: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }>;
}

interface Props {
  module: Module;
  questions: Question[];
  onClose: () => void;
  onComplete: (result: AssessmentResult) => void;
}

const TIER_BADGE_MAP: Record<string, BadgeTier> = {
  hc_certified: 'silver',
  av_ready: 'gold',
  elite: 'platinum',
};

const TIER_COLOR: Record<string, string> = {
  hc_certified: '#A8A8A8',
  av_ready: '#F5A623',
  elite: '#E5E4E2',
};

export function AssessmentPlayer({ module, questions, onClose, onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const tierColor = TIER_COLOR[module.certification_tier] || '#F5A623';
  const tierBadge = TIER_BADGE_MAP[module.certification_tier] || 'silver';
  const current = questions[currentIdx];
  const totalQ = questions.length;

  const submit = async () => {
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([question_id, answer_id]) => ({
        question_id,
        answer_id,
      }));

      const res = await fetch('/api/training/submit-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: module.id, answers: answerArray }),
      });
      const data: AssessmentResult = await res.json();
      setResult(data);
      setSubmitted(true);
      onComplete(data);

      if (data.passed) {
        try {
          // Dynamically import js-confetti to avoid build-time type issues
          const JSConfettiMod = await import('js-confetti' as string);
          const JSConfettiClass = (JSConfettiMod as unknown as { default: new () => { addConfetti: (opts: object) => void } }).default;
          const confetti = new JSConfettiClass();
          confetti.addConfetti({
            confettiColors: [tierColor, '#fff', '#FFD700', '#F5A623'],
            confettiNumber: 200,
          });
        } catch (_) {
          // js-confetti not installed — ok
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const selectAnswer = (questionId: string, answerId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const goNext = () => {
    if (currentIdx < totalQ - 1) {
      setCurrentIdx(prev => prev + 1);
    } else if (!submitted) {
      submit();
    }
  };

  if (submitted && result) {
    if (showReview) {
      return (
        <div style={{
          minHeight: '100vh', background: '#080808', color: '#e8e8e8',
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
          padding: 32, maxWidth: 800, margin: '0 auto',
        }}>
          <button onClick={() => setShowReview(false)} style={{
            background: 'none', border: 'none', color: '#F5A623',
            fontSize: 14, cursor: 'pointer', marginBottom: 24,
          }}>
            ← Back to Results
          </button>

          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Question Review</h2>

          {(result.breakdown || []).map((b, i) => {
            const q = questions.find(q => q.id === b.question_id);
            if (!q) return null;
            return (
              <div key={b.question_id} style={{
                background: b.is_correct ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${b.is_correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                borderRadius: 12, padding: 20, marginBottom: 16,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: b.is_correct ? '#22c55e' : '#ef4444', fontWeight: 800 }}>
                    {b.is_correct ? '✓' : '✗'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                    Q{i + 1}: {q.question_text}
                  </span>
                </div>
                {!b.is_correct && (
                  <div style={{ fontSize: 13, color: '#9a9ab0', paddingLeft: 20, lineHeight: 1.5 }}>
                    <strong style={{ color: '#22c55e' }}>Correct answer:</strong> {q.options.find(o => o.id === b.correct_answer)?.text}
                    <br /><br />
                    {b.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div style={{
        minHeight: '100vh', background: '#080808', color: '#e8e8e8',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 32, textAlign: 'center',
      }}>
        {/* Pass/Fail indicator */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: result.passed
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, marginBottom: 24,
          boxShadow: result.passed ? '0 0 40px rgba(34,197,94,0.4)' : '0 0 40px rgba(239,68,68,0.3)',
        }}>
          {result.passed ? '✓' : '✗'}
        </div>

        {result.passed ? (
          <>
            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>
              You Passed!
            </h1>
            <p style={{ fontSize: 18, color: '#9a9ab0', marginBottom: 8 }}>
              Score: <strong style={{ color: '#22c55e', fontSize: 24 }}>{result.score}%</strong>
            </p>
            <p style={{ color: '#6a6a7a', marginBottom: 32 }}>
              Pass threshold: {result.pass_score}%
            </p>

            {result.tier_completed && (
              <div style={{
                background: 'linear-gradient(160deg, #111120 0%, #0c0c18 100%)',
                border: `1px solid ${tierColor}40`,
                borderRadius: 20, padding: '28px 36px', marginBottom: 32,
                maxWidth: 460,
              }}>
                <div style={{ marginBottom: 16 }}>
                  <HCBadge tier={tierBadge} size={64} animated style={{ margin: '0 auto' }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: tierColor, marginBottom: 6 }}>
                  Your Badge is Live! 🏆
                </div>
                <div style={{ fontSize: 14, color: '#9a9ab0', lineHeight: 1.6 }}>
                  Your {module.certification_tier.replace('_', ' ')} badge is now visible
                  on your operator profile. Brokers and AV companies can verify it instantly.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${tierColor}, ${tierColor}aa)`,
                  color: '#000', border: 'none', fontSize: 15, fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                View My Profile →
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px', borderRadius: 10,
                  background: '#111118', border: '1px solid #2a2a3a',
                  color: '#e8e8e8', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Next Module →
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Not Quite
            </h1>
            <p style={{ fontSize: 18, color: '#9a9ab0', marginBottom: 8 }}>
              Score: <strong style={{ color: '#ef4444', fontSize: 24 }}>{result.score}%</strong>
            </p>
            <p style={{ color: '#6a6a7a', marginBottom: 8 }}>
              You need {result.pass_score}% to pass.
            </p>
            <p style={{ color: '#5a5a6a', marginBottom: 32 }}>
              {result.attempts_remaining > 0
                ? `You can retry in 24 hours. Attempts remaining: ${result.attempts_remaining}`
                : 'You have used all attempts for this module. Contact support.'}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => setShowReview(true)}
                style={{
                  padding: '12px 24px', borderRadius: 10,
                  background: '#111118', border: '1px solid #F5A623',
                  color: '#F5A623', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Review Missed Questions
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px', borderRadius: 10,
                  background: '#111118', border: '1px solid #2a2a3a',
                  color: '#e8e8e8', fontSize: 15, cursor: 'pointer',
                }}
              >
                Back to Module
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#e8e8e8',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: '#0c0c10', borderBottom: '1px solid #1a1a22',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#6a6a7a',
          fontSize: 14, cursor: 'pointer',
        }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8' }}>
            Module {module.order_index} Assessment — {totalQ} questions — Pass {module.pass_score}%
          </div>
          <div style={{ fontSize: 11, color: '#6a6a7a', marginTop: 2 }}>
            Question {currentIdx + 1} of {totalQ}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: 180, height: 4, background: '#1a1a22', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            width: `${((currentIdx + 1) / totalQ) * 100}%`,
            background: tierColor,
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          {/* Scenario box */}
          {current.question_type === 'scenario' && (
            <div style={{
              background: 'rgba(245,166,35,0.06)',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 24,
              fontSize: 13, color: '#8a8a6a', lineHeight: 1.6,
            }}>
              ⚡ Scenario — select the best response
            </div>
          )}

          {/* Question text */}
          <h2 style={{
            fontSize: 22, fontWeight: 800, lineHeight: 1.4,
            margin: '0 0 32px', letterSpacing: '-0.01em',
          }}>
            {current.question_text}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {current.options.map(opt => {
              const selected = answers[current.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`option-${opt.id}`}
                  onClick={() => selectAnswer(current.id, opt.id)}
                  style={{
                    background: selected
                      ? `${tierColor}15`
                      : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${selected ? tierColor : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    if (!selected) e.currentTarget.style.borderColor = `${tierColor}50`;
                  }}
                  onMouseLeave={e => {
                    if (!selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: selected ? tierColor : '#1a1a22',
                    border: `2px solid ${selected ? tierColor : '#2a2a3a'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    color: selected ? '#000' : '#6a6a7a',
                  }}>
                    {opt.id.toUpperCase()}
                  </div>
                  <span style={{
                    fontSize: 15, lineHeight: 1.5,
                    color: selected ? '#e8e8e8' : '#9a9ab0',
                    fontWeight: selected ? 600 : 400,
                    flex: 1,
                  }}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 40,
          }}>
            <span style={{ color: '#5a5a6a', fontSize: 13 }}>
              {Object.keys(answers).length} of {totalQ} answered
            </span>

            <button
              onClick={goNext}
              disabled={!answers[current.id] || submitting}
              style={{
                padding: '13px 32px', borderRadius: 10,
                background: answers[current.id]
                  ? `linear-gradient(135deg, ${tierColor}, ${tierColor}aa)`
                  : '#1a1a22',
                color: answers[current.id] ? '#000' : '#5a5a6a',
                border: 'none', fontSize: 15, fontWeight: 800,
                cursor: answers[current.id] && !submitting ? 'pointer' : 'not-allowed',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting...'
                : currentIdx < totalQ - 1 ? 'Next →'
                : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
