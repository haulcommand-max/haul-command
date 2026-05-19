'use client';

/**
 * ClaimValueContrast — Visual comparison of unclaimed vs claimed state
 * Shows on unclaimed listing pages to drive claim conversion
 */

interface ClaimValueContrastProps {
    claimUrl: string;
}

export default function ClaimValueContrast({ claimUrl }: ClaimValueContrastProps) {
    return (
        <div className="value-contrast">
            <h3 className="vc-title">What changes when you claim</h3>

            <div className="vc-grid">
                {/* Unclaimed column */}
                <div className="vc-col unclaimed">
                    <div className="vc-col-header">
                        <span className="vc-icon"></span>
                        <span>Unclaimed</span>
                    </div>
                    <ul>
                        <li className="negative">Limited profile control</li>
                        <li className="negative">Proof assets not attached</li>
                        <li className="negative">Weaker placement signals</li>
                        <li className="negative">Report card may stay incomplete</li>
                        <li className="negative">Availability not operator-managed</li>
                        <li className="negative">Dispatch fit still needs review</li>
                        <li className="negative">Leaderboard signals limited</li>
                        <li className="negative">Comparison surfaces use incomplete data</li>
                    </ul>
                </div>

                {/* Claimed column */}
                <div className="vc-col claimed">
                    <div className="vc-col-header">
                        <span className="vc-icon"></span>
                        <span>Claimed</span>
                    </div>
                    <ul>
                        <li className="positive">Full profile control</li>
                        <li className="positive">Can submit proof for review</li>
                        <li className="positive">Eligible for stronger placement signals</li>
                        <li className="positive">Report card can be completed</li>
                        <li className="positive">Can manage availability signals</li>
                        <li className="positive">Can qualify for dispatch matching after proof review</li>
                        <li className="positive">Leaderboard signals can activate</li>
                        <li className="positive">Comparison surfaces can use better data</li>
                    </ul>
                </div>
            </div>

            <div className="vc-cta">
                <a href={claimUrl} className="vc-btn">Claim This Listing</a>
                <p className="vc-subtext">Takes about 2 minutes. No credit card needed.</p>
            </div>

            <style jsx>{`
        .value-contrast {
          background: linear-gradient(135deg, rgba(11, 17, 32, 0.95), rgba(15, 23, 42, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 24px;
        }
        .vc-title {
          font-size: 16px;
          font-weight: 700;
          color: #F9FAFB;
          margin: 0 0 20px;
          text-align: center;
        }
        .vc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 481px) {
          .vc-grid { grid-template-columns: 1fr 1fr; }
        }
        .vc-col {
          border-radius: 8px;
          padding: 16px;
        }
        .vc-col.unclaimed {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.15);
        }
        .vc-col.claimed {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .vc-col-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .vc-col.unclaimed .vc-col-header { color: #EF4444; }
        .vc-col.claimed .vc-col-header { color: #10B981; }
        .vc-icon { font-size: 18px; }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        li {
          font-size: 13px;
          padding-left: 20px;
          position: relative;
          color: #D1D5DB;
        }
        li::before {
          position: absolute;
          left: 0;
          top: 0;
        }
        li.negative::before { content: ''; color: #EF4444; }
        li.positive::before { content: ''; color: #10B981; }
        .vc-cta {
          margin-top: 20px;
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .vc-btn {
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
        .vc-btn:hover {
          background: #D97706;
          transform: translateY(-1px);
        }
        .vc-subtext {
          font-size: 12px;
          color: #6B7280;
          margin-top: 8px;
        }
      `}</style>
        </div>
    );
}
