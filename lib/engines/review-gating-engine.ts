// ══════════════════════════════════════════════════════════════
// GOOGLE REVIEW GATING ENGINE
// Smart feedback funnel: 4-5★ → Google Review | 1-3★ → Support
// Fully automated via Supabase Edge Functions
// ══════════════════════════════════════════════════════════════

import { SupabaseClient } from '@supabase/supabase-js';

export interface ReviewMilestone {
  type: 'load_completed' | 'pilot_car_booked' | 'days_on_platform' | 'profile_claimed' | 'first_payment';
  thresholdDays?: number;
}

export interface FeedbackResponse {
  userId: string;
  rating: number; // 1-5
  feedback?: string;
  milestone: ReviewMilestone;
  routedTo: 'google_review' | 'support_inbox' | 'nps_survey';
}

// Google Business Profile review link
const GBP_REVIEW_URL = process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/YOUR_PLACE_ID/review';

// Milestones that trigger the feedback prompt
export const REVIEW_MILESTONES: ReviewMilestone[] = [
  { type: 'load_completed' },
  { type: 'pilot_car_booked' },
  { type: 'days_on_platform', thresholdDays: 30 },
  { type: 'profile_claimed' },
  { type: 'first_payment' },
];

export class ReviewGatingEngine {
  constructor(private db: SupabaseClient) {}

  // Check if a user is eligible for a feedback prompt
  async checkEligibility(userId: string, milestone: ReviewMilestone): Promise<boolean> {
    // Don't prompt if already prompted in last 90 days
    const { count } = await this.db
      .from('feedback_prompts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('prompted_at', new Date(Date.now() - 90 * 86400000).toISOString());

    if ((count ?? 0) > 0) return false;

    // Don't prompt if user already left a Google review
    const { data: existing } = await this.db
      .from('feedback_prompts')
      .select('routed_to')
      .eq('user_id', userId)
      .eq('routed_to', 'google_review')
      .eq('completed', true)
      .limit(1)
      .maybeSingle();

    if (existing) return false;

    return true;
  }

  // Record the feedback and route accordingly
  async recordFeedback(userId: string, rating: number, feedback: string, milestone: ReviewMilestone): Promise<FeedbackResponse> {
    let routedTo: 'google_review' | 'support_inbox' | 'nps_survey';

    if (rating >= 4) {
      routedTo = 'google_review';
    } else if (rating <= 2) {
      routedTo = 'support_inbox';
    } else {
      routedTo = 'nps_survey'; // 3-star = neutral, route to NPS
    }

    // Store the feedback
    await this.db.from('feedback_prompts').insert({
      user_id: userId,
      rating,
      feedback_text: feedback || null,
      milestone_type: milestone.type,
      routed_to: routedTo,
      prompted_at: new Date().toISOString(),
      completed: routedTo === 'support_inbox', // support is auto-completed
    });

    // If routed to support, create a support ticket
    if (routedTo === 'support_inbox') {
      await this.db.from('support_tickets').insert({
        user_id: userId,
        source: 'review_gating',
        subject: `Feedback from ${milestone.type} milestone (${rating}★)`,
        body: feedback || 'No additional details provided.',
        priority: rating === 1 ? 'high' : 'medium',
        status: 'open',
      });
    }

    return { userId, rating, feedback, milestone, routedTo };
  }

  // Get the Google Review URL (one-click)
  getReviewUrl(): string {
    return GBP_REVIEW_URL;
  }

  // Mark a Google review as completed (user clicked the link)
  async markReviewCompleted(userId: string): Promise<void> {
    await this.db
      .from('feedback_prompts')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('routed_to', 'google_review')
      .is('completed', false);
  }
}

// SQL migration for the feedback_prompts table
export const REVIEW_GATING_MIGRATION = `
-- Review Gating Engine tables
CREATE TABLE IF NOT EXISTS feedback_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  milestone_type TEXT NOT NULL,
  routed_to TEXT NOT NULL CHECK (routed_to IN ('google_review', 'support_inbox', 'nps_survey')),
  prompted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_user ON feedback_prompts(user_id);
CREATE INDEX idx_feedback_routed ON feedback_prompts(routed_to);

-- Enable RLS
ALTER TABLE feedback_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feedback" ON feedback_prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON feedback_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
`;
