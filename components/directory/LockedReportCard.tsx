'use client';

/**
 * Locked Report Card — Shows on unclaimed seeded listing pages
 * Makes incompleteness feel costly. Creates urgency to claim.
 */

interface LockedReportCardProps {
    claimed: boolean;
    businessName: string;
    claimUrl: string;
    // Only used when claimed:
    trustScore?: number | null;
    trustTier?: string | null;
    complianceStatus?: string;
    reliabilityStatus?: string;
    profileStrength?: string;
    freshnessStatus?: string;
    dispatchReadiness?: string;
    completionPct?: number;
}

const LOCK_ICON = '🔒';
const WARN_ICON = '⚠️';

export default function LockedReportCard({
    claimed,
    businessName,
    claimUrl,
    trustScore,
    trustTier,
    complianceStatus,
    reliabilityStatus,
    profileStrength,
    freshnessStatus,
    dispatchReadiness,
    completionPct,
}: LockedReportCardProps) {
    if (!claimed) {
        return (
            <div className="report-card-locked">
                <div className="rc-header">
                    <h3>Trust Report Card</h3>
                    <span className="rc-badge locked">Locked</span>
                </div>

                <div className="rc-rows">
                    <Row label="Trust Score" value={LOCK_ICON} status="locked" />
                    <Row label="Compliance" value="Incomplete" status="warn" />
                    <Row label="Reliability" value={`${LOCK_ICON} Locked until activity`} status="locked" />
                    <Row label="Profile Strength" value="Low / Incomplete" status="critical" />
                    <Row label="Freshness" value="Not activated" status="locked" />
                    <Row label="Dispatch Readiness" value="Not eligible yet" status="critical" />
                </div>

                <div className="rc-cta-block">
                    <p className="rc-cta-text">
                        Claim and complete your profile to activate your Report Card.
                    </p>
                    <a href={claimUrl} className="rc-cta-btn">
                        Claim This Listing
                    </a>
                    <a href={`${claimUrl}?view=unlock`} className="rc-cta-secondary">
                        See What Claiming Unlocks
                    </a>
                </div>

                <style jsx>{`
          .report-card-locked {
            background: linear-gradient(135deg, rgba(11, 17, 32, 0.95), rgba(15, 23, 42, 0.95));
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-radius: 12px;
            padding: 24px;
            backdrop-filter: blur(12px);
          }
          .rc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .rc-header h3 {
            font-size: 16px;
            font-weight: 700;
            color: #F9FAFB;
            margin: 0;
          }
          .rc-badge {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 6px;
          }
          .rc-badge.locked {
            background: rgba(239, 68, 68, 0.15);
            color: #EF4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .rc-rows {
            display: flex;
            flex-direction: column;
            gap: 0;
          }
          .rc-cta-block {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            text-align: center;
          }
          .rc-cta-text {
            font-size: 13px;
            color: #9CA3AF;
            margin: 0 0 12px;
          }
          .rc-cta-btn {
            display: inline-block;
            background: #F59E0B;
            color: #030712;
            font-weight: 700;
            padding: 12px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.2s;
          }
          .rc-cta-btn:hover {
            background: #D97706;
            transform: translateY(-1px);
          }
          .rc-cta-secondary {
            display: block;
            margin-top: 8px;
            font-size: 13px;
            color: #F59E0B;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
        `}</style>
            </div>
        );
    }

    // ── Claimed version: live report card ──
    return (
        <div className="report-card-live">
            <div className="rc-header">
                <h3>Trust Report Card</h3>
                <span className={`rc-badge ${trustTier || 'basic'}`}>
                    {trustTier ? trustTier.charAt(0).toUpperCase() + trustTier.slice(1) : 'Basic'}
                </span>
            </div>

            {completionPct !== undefined && (
                <div className="rc-progress">
                    <div className="rc-progress-bar" style={{ width: `${completionPct}%` }} />
                    <span className="rc-progress-label">{completionPct}% Complete</span>
                </div>
            )}

            <div className="rc-rows">
                <Row
                    label="Trust Score"
                    value={trustScore != null ? `${trustScore}/100` : `${LOCK_ICON} Complete to 70% to activate`}
                    status={trustScore != null ? (trustScore >= 75 ? 'good' : trustScore >= 50 ? 'ok' : 'warn') : 'locked'}
                />
                <Row
                    label="Compliance"
                    value={complianceStatus === 'verified' ? '✅ Verified' : `${WARN_ICON} Incomplete`}
                    status={complianceStatus === 'verified' ? 'good' : 'warn'}
                />
                <Row
                    label="Reliability"
                    value={reliabilityStatus === 'active' ? '✅ Active' : `${LOCK_ICON} Locked`}
                    status={reliabilityStatus === 'active' ? 'good' : 'locked'}
                />
                <Row
                    label="Profile Strength"
                    value={profileStrength || 'Incomplete'}
                    status={
                        profileStrength === 'strong' ? 'good' :
                            profileStrength === 'moderate' ? 'ok' : 'warn'
                    }
                />
                <Row
                    label="Freshness"
                    value={
                        freshnessStatus === 'fresh' ? '🟢 Fresh' :
                            freshnessStatus === 'stale' ? '🟡 Stale' : '🔴 Not Activated'
                    }
                    status={freshnessStatus === 'fresh' ? 'good' : freshnessStatus === 'stale' ? 'ok' : 'critical'}
                />
                <Row
                    label="Dispatch Readiness"
                    value={
                        dispatchReadiness === 'eligible' ? '✅ Eligible' :
                            dispatchReadiness === 'nearly' ? '🟡 Nearly Ready' : '❌ Not Eligible'
                    }
                    status={dispatchReadiness === 'eligible' ? 'good' : dispatchReadiness === 'nearly' ? 'ok' : 'critical'}
                />
            </div>

            <style jsx>{`
        .report-card-live {
          background: linear-gradient(135deg, rgba(11, 17, 32, 0.95), rgba(15, 23, 42, 0.95));
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          padding: 24px;
          backdrop-filter: blur(12px);
        }
        .rc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .rc-header h3 { font-size: 16px; font-weight: 700; color: #F9FAFB; margin: 0; }
        .rc-badge {
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; padding: 4px 10px; border-radius: 6px;
        }
        .rc-badge.elite { background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid #F59E0B; }
        .rc-badge.strong { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.4); }
        .rc-badge.verified { background: rgba(59,130,246,0.15); color: #3B82F6; border: 1px solid rgba(59,130,246,0.3); }
        .rc-badge.basic { background: rgba(107,114,128,0.15); color: #9CA3AF; border: 1px solid rgba(107,114,128,0.3); }
        .rc-progress {
          position: relative; height: 6px; background: rgba(255,255,255,0.08);
          border-radius: 3px; margin-bottom: 16px; overflow: hidden;
        }
        .rc-progress-bar {
          position: absolute; top: 0; left: 0; height: 100%;
          background: linear-gradient(90deg, #F59E0B, #10B981);
          border-radius: 3px; transition: width 0.5s ease;
        }
        .rc-progress-label {
          position: absolute; right: 0; top: -18px;
          font-size: 11px; color: #9CA3AF;
        }
        .rc-rows { display: flex; flex-direction: column; gap: 0; }
      `}</style>
        </div>
    );
}

// ── Row component ──
function Row({ label, value, status }: { label: string; value: string; status: 'good' | 'ok' | 'warn' | 'critical' | 'locked' }) {
    const colors = {
        good: '#10B981',
        ok: '#F59E0B',
        warn: '#F59E0B',
        critical: '#EF4444',
        locked: '#6B7280',
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors[status] }}>{value}</span>
        </div>
    );
}
