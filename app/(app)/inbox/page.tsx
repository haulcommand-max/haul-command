'use client';

import InboxContainer from '@/components/inbox/InboxContainer';

/**
 * /inbox — Full messaging inbox with conversation threads
 * Supports: text messages, load offers, counter-offers, accept/decline
 * Features: real-time via Supabase, unread counts, offer action buttons
 */
export default function InboxPage() {
  return <InboxContainer />;
}