'use client';

/**
 * Haul Command — Stripe Payment Components
 *
 * Unified payment button components for all monetization surfaces.
 * Uses real Stripe checkout routes with proper price IDs.
 */

// ═══════════════════════════════════════════════════════════════
// Corridor Sponsor — $199/mo subscription
// ═══════════════════════════════════════════════════════════════

export function CorridorSponsorButton({ corridorSlug, corridorName }: { corridorSlug: string; corridorName: string }) {
  const handleSponsor = async () => {
    try {
      const res = await fetch('/api/stripe/corridor-sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corridor_slug: corridorSlug, corridor_name: corridorName }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Sponsor error:', err);
    }
  };

  return (
    <button
      onClick={handleSponsor}
      className="w-full bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-4 hover:border-accent/50 transition-all text-left group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-accent font-bold text-sm">⭐ Sponsor This Corridor</p>
          <p className="text-gray-500 text-xs mt-1">$199/mo · Featured placement for your business</p>
        </div>
        <span className="text-accent text-lg group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Emergency Fill — $25 one-time
// ═══════════════════════════════════════════════════════════════

export function EmergencyFillButton({ loadId, corridor }: { loadId?: string; corridor?: string }) {
  const handleFill = async () => {
    try {
      const res = await fetch('/api/stripe/emergency-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_id: loadId, corridor }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Emergency fill error:', err);
    }
  };

  return (
    <button
      onClick={handleFill}
      className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 hover:border-red-500/40 transition-all flex items-center gap-3"
    >
      <span className="text-red-400 text-lg">🚨</span>
      <div className="text-left">
        <p className="text-red-400 font-bold text-sm">Emergency Fill — $25</p>
        <p className="text-gray-500 text-[10px]">Priority matching for unfilled loads</p>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Training Enrollment — Variable price one-time
// ═══════════════════════════════════════════════════════════════

export function TrainingEnrollButton({ courseId, courseName, priceUsd }: { courseId?: string; courseName?: string; priceUsd?: number }) {
  const handleEnroll = async () => {
    try {
      const res = await fetch('/api/stripe/training-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, course_name: courseName, price_usd: priceUsd }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Enrollment error:', err);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
    >
      Enroll Now — ${priceUsd || 49}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Load Boost — $14 one-time (uses real Stripe price ID)
// ═══════════════════════════════════════════════════════════════

export function LoadBoostButton({ loadId, corridor }: { loadId?: string; corridor?: string }) {
  const handleBoost = async () => {
    try {
      const res = await fetch('/api/stripe/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_id: loadId, corridor }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Boost error:', err);
    }
  };

  return (
    <button
      onClick={handleBoost}
      className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl px-5 py-3 hover:border-yellow-500/40 transition-all flex items-center gap-3"
    >
      <span className="text-yellow-400 text-lg">🚀</span>
      <div className="text-left">
        <p className="text-yellow-400 font-bold text-sm">Boost — $14</p>
        <p className="text-gray-500 text-[10px]">Top of feed for 24 hours</p>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Manage Subscription — Opens Stripe Customer Portal
// ═══════════════════════════════════════════════════════════════

export function ManageSubscriptionButton({ customerId }: { customerId: string }) {
  const handleManage = async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
    }
  };

  return (
    <button
      onClick={handleManage}
      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3 hover:border-white/[0.15] transition-all flex items-center gap-3"
    >
      <span className="text-gray-400 text-lg">⚙️</span>
      <div className="text-left">
        <p className="text-white font-semibold text-sm">Manage Subscription</p>
        <p className="text-gray-500 text-[10px]">Upgrade, downgrade, or update payment</p>
      </div>
    </button>
  );
}
