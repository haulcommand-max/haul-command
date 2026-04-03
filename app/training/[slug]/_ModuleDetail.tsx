'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { HCBadge, BadgeTier } from '@/components/training/HCBadge';
import { AssessmentPlayer } from '@/components/training/AssessmentPlayer';
import { VideoPlayer } from '@/components/training/VideoPlayer';

interface Lesson {
  id: string;
  title: string;
  content_type: 'video' | 'text' | 'scenario' | 'quiz';
  content_html: string | null;
  video_url: string | null;
  video_duration_seconds: number | null;
  order_index: number;
}

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_minutes: number;
  order_index: number;
  certification_tier: 'hc_certified' | 'av_ready' | 'elite';
  is_free: boolean;
  pass_score: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'scenario' | 'true_false';
  options: { id: string; text: string; correct: boolean; explanation: string }[];
  correct_answer_id: string;
  explanation: string;
}

interface LessonProgress {
  [lessonId: string]: { completed: boolean; video_watch_percent: number };
}

interface ModuleProgress {
  status: string;
  score: number | null;
  attempts: number;
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

export default function ModuleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress>({});
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssessment, setShowAssessment] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch(`/api/training/modules/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.module) {
          setModule(data.module);
          const nonQuizLessons = (data.lessons || []).filter((l: Lesson) => l.content_type !== 'quiz');
          const quizLessons = (data.lessons || []).filter((l: Lesson) => l.content_type === 'quiz');
          setLessons([...nonQuizLessons, ...quizLessons]);
          setQuestions(data.questions || []);
          setModuleProgress(data.moduleProgress || null);
          setAuthenticated(data.authenticated || false);

          // Set initial progress
          const lp: LessonProgress = {};
          for (const [lid, prog] of Object.entries(data.lessonProgress || {})) {
            lp[lid] = prog as { completed: boolean; video_watch_percent: number };
          }
          setLessonProgress(lp);

          // Select first lesson
          if (nonQuizLessons.length > 0) {
            setActiveLesson(nonQuizLessons[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const markLessonComplete = useCallback(async (lessonId: string, watchPercent?: number) => {
    const payload = {
      lesson_id: lessonId,
      completed: true,
      video_watch_percent: watchPercent ?? 100,
    };
    try {
      const res = await fetch('/api/training/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLessonProgress(prev => ({ ...prev, [lessonId]: { completed: true, video_watch_percent: watchPercent ?? 100 } }));
      if (data.assessment_unlocked && moduleProgress?.status !== 'passed') {
        setModuleProgress(prev => prev ? { ...prev, status: 'in_progress' } : { status: 'in_progress', score: null, attempts: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  }, [moduleProgress]);

  const completedLessonCount = lessons.filter(l => l.content_type !== 'quiz' && lessonProgress[l.id]?.completed).length;
  const totalLessons = lessons.filter(l => l.content_type !== 'quiz').length;
  const allLessonsComplete = completedLessonCount >= totalLessons && totalLessons > 0;
  const tierColor = module ? TIER_COLOR[module.certification_tier] : '#F5A623';

  if (loading) {
    return (
      <div style={{minHeight: '100vh',background: '#080808',display: 'flex',alignItems: 'center',justifyContent: 'center' }}>
        <div style={{textAlign: 'center',color: '#F5A623' }}>
          <div style={{fontSize: 32,marginBottom: 12 }}>⏳</div>
          <div style={{fontWeight: 600 }}>Loading module...</div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div style={{minHeight: '100vh',background: '#080808',display: 'flex',alignItems: 'center',justifyContent: 'center' }}>
        <div style={{textAlign: 'center' }}>
          <div style={{fontSize: 48,marginBottom: 12 }}>🔍</div>
          <h1 style={{color: '#e8e8e8',marginBottom: 8 }}>Module Not Found</h1>
          <Link aria-label="Navigation Link" href="/training" style={{color: '#F5A623' }}>← Back to Training</Link>
        </div>
      </div>
    );
  }

  if (showAssessment) {
    return (
      <AssessmentPlayer
        module={module}
        questions={questions}
        onClose={() => setShowAssessment(false)}
        onComplete={(result) => {
          setModuleProgress({ status: result.passed ? 'passed' : 'failed', score: result.score, attempts: (moduleProgress?.attempts || 0) + 1 });
          setShowAssessment(false);
        }}
      />
    );
  }

  return (
    <div style={{minHeight: '100vh',background: '#080808',color: '#e8e8e8',fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",display: 'flex',flexDirection: 'column'}}>
      {/* Top bar */}
      <div style={{background: '#0c0c10',borderBottom: '1px solid #1a1a22',padding: '12px 20px',display: 'flex',alignItems: 'center',gap: 12,flexWrap: 'wrap'}}>
        <Link aria-label="Navigation Link" href="/training" style={{color: '#6a6a7a',fontSize: 13,textDecoration: 'none' }}>
          ← Training
        </Link>
        <span style={{color: '#2a2a3a' }}>›</span>
        <span style={{fontSize: 13,color: '#e8e8e8',fontWeight: 600 }}>{module.title}</span>
        <div style={{marginLeft: 'auto',display: 'flex',alignItems: 'center',gap: 8 }}>
          <HCBadge tier={TIER_BADGE_MAP[module.certification_tier] || 'silver'} size={24} />
          <span style={{fontSize: 12,color: '#6a6a7a' }}>
            Module {module.order_index} of 7
          </span>
        </div>
      </div>

      <div style={{display: 'flex',flex: 1,flexWrap: 'wrap' }}>
        {/* ── LEFT SIDEBAR ── */}
        <aside style={{width: 280,flexShrink: 0,background: '#0c0c10',borderRight: '1px solid #1a1a22',display: 'flex',flexDirection: 'column',overflow: 'hidden'}}>
          {/* Module info */}
          <div style={{padding: '20px 16px',borderBottom: '1px solid #1a1a22' }}>
            <div style={{display: 'flex',alignItems: 'center',gap: 10,marginBottom: 10 }}>
              <HCBadge tier={TIER_BADGE_MAP[module.certification_tier] || 'silver'} size={40} animated />
              <div>
                <div style={{fontSize: 13,fontWeight: 800,color: tierColor }}>
                  {module.certification_tier.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{fontSize: 11,color: '#6a6a7a' }}>⏱ {module.duration_minutes} min</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{marginTop: 12 }}>
              <div style={{display: 'flex',justifyContent: 'space-between',fontSize: 11,color: '#6a6a7a',marginBottom: 6 }}>
                <span>{completedLessonCount}/{totalLessons} lessons</span>
                <span>{Math.round((completedLessonCount / Math.max(totalLessons, 1)) * 100)}%</span>
              </div>
              <div style={{height: 4,background: '#1a1a22',borderRadius: 2,overflow: 'hidden' }}>
                <div style={{height: '100%',width: `${(completedLessonCount / Math.max(totalLessons, 1)) * 100}%`,background: `linear-gradient(90deg, ${tierColor}, ${tierColor}cc)`,borderRadius: 2,transition: 'width 0.4s'}} />
              </div>
            </div>

            {moduleProgress?.status === 'passed' && (
              <div style={{marginTop: 10,padding: '6px 10px',background: 'rgba(34,197,94,0.1)',border: '1px solid rgba(34,197,94,0.2)',borderRadius: 8,fontSize: 12,color: '#22c55e',fontWeight: 700,textAlign: 'center'}}>
                ✓ Passed — {moduleProgress.score}%
              </div>
            )}
          </div>

          {/* Lesson list */}
          <div style={{flex: 1,overflowY: 'auto',padding: '8px 0' }}>
            {lessons.map((lesson, idx) => {
              const isComplete = lessonProgress[lesson.id]?.completed;
              const isActive = activeLesson?.id === lesson.id;
              const isQuiz = lesson.content_type === 'quiz';

              return (
                <button aria-label="Interactive Button"
                  key={lesson.id}
                  onClick={() => {
                    if (isQuiz && allLessonsComplete) {
                      setShowAssessment(true);
                    } else if (!isQuiz) {
                      setActiveLesson(lesson);
                    }
                  }}
                  disabled={isQuiz && !allLessonsComplete}
                  style={{width: '100%',textAlign: 'left',padding: '12px 16px',background: isActive ? `${tierColor}10` : 'transparent',borderLeft: `3px solid ${isActive ? tierColor : 'transparent'}`,border: 'none',borderLeftStyle: 'solid',borderLeftWidth: 3,borderLeftColor: isActive ? tierColor : 'transparent',cursor: (isQuiz && !allLessonsComplete) ? 'not-allowed' : 'pointer',display: 'flex',alignItems: 'center',gap: 10,opacity: (isQuiz && !allLessonsComplete) ? 0.4 : 1,transition: 'background 0.15s'}}
                >
                  <div style={{width: 22,height: 22,borderRadius: '50%',flexShrink: 0,background: isComplete ? '#22c55e' : isActive ? tierColor : '#1a1a22',border: `1px solid ${isComplete ? '#22c55e' : isActive ? tierColor : '#2a2a3a'}`,display: 'flex',alignItems: 'center',justifyContent: 'center',fontSize: 10,color: '#000',fontWeight: 800}}>
                    {isComplete ? '✓' : (idx + 1)}
                  </div>
                  <div style={{flex: 1,minWidth: 0 }}>
                    <div style={{fontSize: 13,fontWeight: isActive ? 700 : 500,color: isActive ? '#e8e8e8' : '#9a9ab0',overflow: 'hidden',textOverflow: 'ellipsis',whiteSpace: 'nowrap'}}>
                      {lesson.title}
                    </div>
                    <div style={{fontSize: 10,color: '#5a5a6a',marginTop: 1 }}>
                      {lesson.content_type === 'video' ? '▶ Video'
                        : lesson.content_type === 'quiz' ? '📝 Assessment'
                        : lesson.content_type === 'scenario' ? '⚡ Scenario'
                        : '📖 Reading'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Assessment unlock */}
          <div style={{padding: 16,borderTop: '1px solid #1a1a22' }}>
            <button aria-label="Interactive Button"
              onClick={() => setShowAssessment(true)}
              disabled={!allLessonsComplete || moduleProgress?.status === 'passed'}
              style={{width: '100%',padding: '12px',background: allLessonsComplete && moduleProgress?.status !== 'passed'
                  ? `linear-gradient(135deg, ${tierColor}, ${tierColor}aa)`
                  : '#1a1a22',color: allLessonsComplete && moduleProgress?.status !== 'passed' ? '#000' : '#5a5a6a',border: 'none',borderRadius: 8,fontSize: 13,fontWeight: 800,cursor: allLessonsComplete && moduleProgress?.status !== 'passed' ? 'pointer' : 'not-allowed',transition: 'all 0.2s'}}
            >
              {moduleProgress?.status === 'passed'
                ? '✓ Assessment Passed'
                : allLessonsComplete
                ? '📝 Take Assessment'
                : `Complete all ${totalLessons} lessons first`}
            </button>
            {!authenticated && (
              <p style={{fontSize: 11,color: '#5a5a6a',textAlign: 'center',marginTop: 8 }}>
                <Link aria-label="Navigation Link" href="/auth/login?return=/training" style={{color: '#F5A623' }}>Sign in</Link> to save progress
              </p>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{flex: 1,minWidth: 0,overflowY: 'auto' }}>
          {activeLesson ? (
            <div>
              {/* Lesson header */}
              <div style={{padding: '24px 32px 20px',borderBottom: '1px solid #1a1a22',background: '#0a0a0e'}}>
                <div style={{fontSize: 11,color: '#6a6a7a',fontWeight: 600,letterSpacing: '0.06em',marginBottom: 6 }}>
                  {activeLesson.content_type === 'video' ? '▶ VIDEO LESSON'
                    : activeLesson.content_type === 'scenario' ? '⚡ INTERACTIVE SCENARIO'
                    : '📖 READING'}
                </div>
                <h1 style={{fontSize: 24,fontWeight: 800,margin: 0,letterSpacing: '-0.01em',lineHeight: 1.3 }}>
                  {activeLesson.title}
                </h1>
              </div>

              {/* Content */}
              <div style={{padding: '32px',maxWidth: 780 }}>
                {activeLesson.content_type === 'video' && (
                  <div style={{marginBottom: 32 }}>
                    <VideoPlayer
                      lessonId={activeLesson.id}
                      videoUrl={activeLesson.video_url}
                      onProgress={(pct) => {
                        if (pct >= 90 && !lessonProgress[activeLesson.id]?.completed) {
                          markLessonComplete(activeLesson.id, pct);
                        }
                      }}
                    />
                  </div>
                )}

                {activeLesson.content_html && activeLesson.content_type !== 'scenario' && (
                  <div
                    style={{lineHeight: 1.75,color: '#c0c0d0' }}
                    dangerouslySetInnerHTML={{ __html: activeLesson.content_html }}
                  />
                )}

                {activeLesson.content_type === 'scenario' && activeLesson.content_html && (
                  <div style={{background: 'rgba(245,166,35,0.06)',border: '1px solid rgba(245,166,35,0.2)',borderRadius: 12,padding: 24,marginBottom: 24,lineHeight: 1.75,color: '#c0c0d0'}}
                    dangerouslySetInnerHTML={{ __html: activeLesson.content_html }}
                  />
                )}
              </div>

              {/* Navigation */}
              <div style={{padding: '20px 32px',borderTop: '1px solid #1a1a22',display: 'flex',justifyContent: 'space-between',alignItems: 'center',background: '#0a0a0e'}}>
                <button aria-label="Interactive Button"
                  onClick={() => {
                    const idx = lessons.indexOf(activeLesson);
                    if (idx > 0 && lessons[idx - 1].content_type !== 'quiz') {
                      setActiveLesson(lessons[idx - 1]);
                    }
                  }}
                  disabled={lessons.indexOf(activeLesson) === 0}
                  style={{padding: '10px 18px',borderRadius: 8,border: '1px solid #2a2a3a',background: 'transparent',color: '#6a6a7a',fontSize: 14,cursor: lessons.indexOf(activeLesson) === 0 ? 'default' : 'pointer',opacity: lessons.indexOf(activeLesson) === 0 ? 0.4 : 1}}
                >
                  ← Previous
                </button>

                {!lessonProgress[activeLesson.id]?.completed && activeLesson.content_type !== 'video' && (
                  <button aria-label="Interactive Button"
                    onClick={() => markLessonComplete(activeLesson.id)}
                    style={{padding: '10px 24px',borderRadius: 8,background: `linear-gradient(135deg, ${tierColor}, ${tierColor}aa)`,color: '#000',border: 'none',fontSize: 14,fontWeight: 800,cursor: 'pointer'}}
                  >
                    Mark Complete ✓
                  </button>
                )}

                {lessonProgress[activeLesson.id]?.completed && (
                  <div style={{color: '#22c55e',fontSize: 14,fontWeight: 700 }}>✓ Completed</div>
                )}

                <button aria-label="Interactive Button"
                  onClick={() => {
                    const idx = lessons.indexOf(activeLesson);
                    const next = lessons[idx + 1];
                    if (next) {
                      if (next.content_type === 'quiz') {
                        if (allLessonsComplete) setShowAssessment(true);
                      } else {
                        setActiveLesson(next);
                      }
                    }
                  }}
                  disabled={lessons.indexOf(activeLesson) >= lessons.length - 1 && !allLessonsComplete}
                  style={{padding: '10px 18px',borderRadius: 8,background: '#1a1a22',border: '1px solid #2a2a3a',color: '#e8e8e8',fontSize: 14,cursor: 'pointer'}}
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div style={{padding: 48,textAlign: 'center',color: '#6a6a7a'}}>
              <div style={{fontSize: 48,marginBottom: 16 }}>📚</div>
              <h2 style={{fontSize: 22,fontWeight: 700,color: '#e8e8e8',marginBottom: 8 }}>{module.title}</h2>
              <p style={{maxWidth: 500,margin: '0 auto 24px',lineHeight: 1.65,fontSize: 15 }}>
                {module.description}
              </p>
              {lessons[0] && lessons[0].content_type !== 'quiz' && (
                <button aria-label="Interactive Button"
                  onClick={() => setActiveLesson(lessons[0])}
                  style={{padding: '12px 28px',borderRadius: 10,background: `linear-gradient(135deg, ${tierColor}, ${tierColor}aa)`,color: '#000',border: 'none',fontSize: 15,fontWeight: 800,cursor: 'pointer'}}
                >
                  Start Module →
                </button>
              )}
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside style={{width: 220,flexShrink: 0,background: '#0a0a0e',borderLeft: '1px solid #1a1a22',padding: 20}}>
          <div style={{fontSize: 11,fontWeight: 700,color: '#5a5a6a',letterSpacing: '0.08em',marginBottom: 16 }}>
            ASSESSMENT
          </div>

          <div style={{background: '#111118',border: `1px solid ${allLessonsComplete ? tierColor + '30' : '#1a1a22'}`,borderRadius: 10,padding: 16,marginBottom: 16}}>
            <div style={{fontSize: 13,color: '#9a9ab0',marginBottom: 8 }}>
              Pass score: <strong style={{color: '#e8e8e8' }}>{module.pass_score}%</strong>
            </div>
            {moduleProgress?.score !== null && moduleProgress?.score !== undefined && (
              <div style={{fontSize: 13,color: '#9a9ab0',marginBottom: 8 }}>
                Your score: <strong style={{color: moduleProgress.score >= module.pass_score ? '#22c55e' : '#ef4444' }}>
                  {moduleProgress.score}%
                </strong>
              </div>
            )}
            {moduleProgress?.attempts !== undefined && moduleProgress.attempts > 0 && (
              <div style={{fontSize: 13,color: '#9a9ab0' }}>
                Attempts: <strong style={{color: '#e8e8e8' }}>{moduleProgress.attempts}</strong>
              </div>
            )}
          </div>

          {!allLessonsComplete && (
            <div style={{background: 'rgba(245,166,35,0.06)',border: '1px solid rgba(245,166,35,0.12)',borderRadius: 8,padding: '10px 12px',fontSize: 12,color: '#8a8a7a',lineHeight: 1.5}}>
              📋 Complete all lessons to unlock the assessment.
            </div>
          )}

          {/* Pass score badge */}
          <div style={{marginTop: 24 }}>
            <div style={{fontSize: 11,fontWeight: 700,color: '#5a5a6a',letterSpacing: '0.08em',marginBottom: 12 }}>
              EARNS
            </div>
            <div style={{display: 'flex',alignItems: 'center',gap: 10 }}>
              <HCBadge tier={TIER_BADGE_MAP[module.certification_tier]} size={40} animated />
              <div style={{fontSize: 13,color: '#9a9ab0' }}>
                {module.certification_tier === 'hc_certified' ? 'HC Certified'
                  : module.certification_tier === 'av_ready' ? 'HC AV-Ready'
                  : 'HC Elite'} credential
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
