import React from 'react';

interface QuickAnswerBlockProps {
    question: string;
    answerHtml: string;
    source?: string;
    sourceUrl?: string;
    confidenceLabel?: 'verified_current' | 'verified_but_review_due' | 'partially_verified' | 'seeded_needs_human_review' | 'historical_reference_only';
    lastReviewedAt?: string;
}

export function QuickAnswerBlock({
    question,
    answerHtml,
    source,
    sourceUrl,
    confidenceLabel = 'partially_verified',
    lastReviewedAt
}: QuickAnswerBlockProps) {
    const confidenceConfig = {
        verified_current: { color: '#22C55E', text: 'Verified Current' },
        verified_but_review_due: { color: '#F59E0B', text: 'Review Due' },
        partially_verified: { color: '#3B82F6', text: 'Partially Verified' },
        seeded_needs_human_review: { color: '#6B7280', text: 'AI Seeded' },
        historical_reference_only: { color: '#EF4444', text: 'Historical Only' }
    };

    const config = confidenceConfig[confidenceLabel];

    return (
        <div style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Top gradient accent */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #C6923A, #E4B872, transparent)',
                opacity: 0.8
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#F9FAFB',
                    margin: 0,
                    lineHeight: 1.3
                }}>
                    A: {question}
                </h2>
                
                <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: `${config.color}15`,
                    color: config.color,
                    border: `1px solid ${config.color}30`,
                    whiteSpace: 'nowrap',
                    marginLeft: 16
                }}>
                    {config.text}
                </div>
            </div>

            <div 
                style={{
                    fontSize: 15,
                    color: '#E5E7EB',
                    lineHeight: 1.6,
                    marginBottom: 20
                }}
                dangerouslySetInnerHTML={{ __html: answerHtml }}
            />

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 12,
                color: '#6B7280',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: 16
            }}>
                {source && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Source:</span>
                        {sourceUrl ? (
                            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{
                                color: '#C6923A',
                                textDecoration: 'none',
                                fontWeight: 500
                            }}>
                                {source} ↗
                            </a>
                        ) : (
                            <span style={{ color: '#9CA3AF' }}>{source}</span>
                        )}
                    </div>
                )}
                
                {lastReviewedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#4B5563' }} />
                        <span>Last reviewed: {new Date(lastReviewedAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
            
            {/* Quick action for crowdsourcing corrections */}
            <div style={{
                position: 'absolute',
                bottom: 16,
                right: 24,
            }}>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6B7280',
                    fontSize: 11,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                }}
                onClick={() => {
                    // This would trigger a report modal
                    console.log('Report incorrect data');
                }}>
                    Report incorrect info
                </button>
            </div>
        </div>
    );
}

export default QuickAnswerBlock;
