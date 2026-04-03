'use client';
// components/profile/OperatorReviews.tsx
import { useState } from 'react';
import Link from 'next/link';

interface ReviewsProps {
  reviews: any[];
  operatorName: string;
  operatorId: string;
}

export function OperatorReviews({ reviews, operatorName, operatorId }: ReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 3);

  const StarRow = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#566880] w-24 flex-shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className="w-2.5 h-2.5 rounded-sm"
            style={{ background: s <= value ? '#d4950e' : '#1e3048' }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[#f0f2f5]">
          Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
        </h2>
        <Link
          href={`/review?operator=${operatorId}`}
          className="text-xs text-[#d4950e] border border-[#d4950e40] px-3 py-1.5 rounded-lg hover:bg-[#2a1f08] transition-colors"
        >
          Write Review
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[#566880] mb-3">No reviews yet for {operatorName}</p>
          <Link href={`/review?operator=${operatorId}`}
            className="text-xs text-[#d4950e] underline">
            Be the first to leave a review →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(review => (
            <div key={review.id} className="bg-[#07090d] border border-[#0c1520] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1l1.3 3.2H10L7.7 5.8l.9 3.2L6 7.3 3.4 9l.9-3.2L2 4.2h2.7z"
                          fill={s <= review.rating ? '#d4950e' : '#1e3048'} />
                      </svg>
                    ))}
                    <span className="text-xs font-bold text-[#d4950e]">{review.rating}.0</span>
                  </div>
                  <p className="text-[10px] text-[#3a4e64] capitalize">
                    From verified {review.reviewer_role ?? 'user'} · {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-[#8a9ab0] leading-relaxed mb-3">{review.comment}</p>
              )}

              {/* Sub-ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {review.communication && <StarRow label="Communication" value={review.communication} />}
                {review.reliability && <StarRow label="Reliability" value={review.reliability} />}
                {review.safety && <StarRow label="Safety" value={review.safety} />}
              </div>
            </div>
          ))}

          {!showAll && reviews.length > 3 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-sm text-[#566880] border border-[#1e3048] py-2.5 rounded-xl hover:border-[#d4950e] hover:text-[#d4950e] transition-colors"
            >
              Show all {reviews.length} reviews
            </button>
          )}
        </div>
      )}
    </div>
  );
}
