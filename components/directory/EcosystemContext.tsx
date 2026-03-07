'use client';

/**
 * EcosystemContext — Shows the listing is connected to something bigger
 * Displays surfaces, corridors, related categories, and network scope
 */

interface EcosystemContextProps {
    businessName: string;
    city: string;
    state: string;
    country: string;
    surfaces?: { name: string; slug: string }[];
    corridors?: { name: string; slug: string }[];
    category?: string;
    relatedCategories?: string[];
    totalCountries?: number;
    totalSurfaces?: number;
}

export default function EcosystemContext({
    businessName,
    city,
    state,
    country,
    surfaces = [],
    corridors = [],
    category,
    relatedCategories = [],
    totalCountries = 57,
    totalSurfaces = 358000,
}: EcosystemContextProps) {
    return (
        <div className="eco-context">
            <h3 className="eco-title">Part of the HAUL COMMAND Network</h3>
            <p className="eco-subtitle">
                {businessName} is connected to the world&apos;s largest heavy haul directory
            </p>

            <div className="eco-grid">
                {/* Network Stats */}
                <div className="eco-stat">
                    <span className="eco-stat-number">{totalCountries}</span>
                    <span className="eco-stat-label">Countries</span>
                </div>
                <div className="eco-stat">
                    <span className="eco-stat-number">{(totalSurfaces / 1000).toFixed(0)}K+</span>
                    <span className="eco-stat-label">Surfaces</span>
                </div>
                <div className="eco-stat">
                    <span className="eco-stat-number">24/7</span>
                    <span className="eco-stat-label">Directory</span>
                </div>
            </div>

            {/* Connected Surfaces */}
            {surfaces.length > 0 && (
                <div className="eco-section">
                    <h4 className="eco-section-title">📍 Connected Territories</h4>
                    <div className="eco-tags">
                        {surfaces.slice(0, 6).map(s => (
                            <a key={s.slug} href={`/place/${s.slug}`} className="eco-tag">
                                {s.name}
                            </a>
                        ))}
                        {surfaces.length > 6 && (
                            <span className="eco-tag more">+{surfaces.length - 6} more</span>
                        )}
                    </div>
                </div>
            )}

            {/* Connected Corridors */}
            {corridors.length > 0 && (
                <div className="eco-section">
                    <h4 className="eco-section-title">🛣️ Corridor Coverage</h4>
                    <div className="eco-tags">
                        {corridors.map(c => (
                            <a key={c.slug} href={`/corridors/${c.slug}`} className="eco-tag corridor">
                                {c.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Placement */}
            {category && (
                <div className="eco-section">
                    <h4 className="eco-section-title">🏷️ Listed Under</h4>
                    <div className="eco-tags">
                        <span className="eco-tag active">{category}</span>
                        {relatedCategories.slice(0, 4).map(rc => (
                            <span key={rc} className="eco-tag">{rc}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Location context */}
            <div className="eco-location">
                <span className="eco-loc-icon">🌍</span>
                <span>{city}, {state}, {country} — searchable in all regional and corridor searches</span>
            </div>

            <style jsx>{`
        .eco-context {
          background: linear-gradient(135deg, rgba(11, 17, 32, 0.95), rgba(15, 23, 42, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 24px;
        }
        .eco-title {
          font-size: 16px;
          font-weight: 700;
          color: #F9FAFB;
          margin: 0 0 4px;
        }
        .eco-subtitle {
          font-size: 13px;
          color: #9CA3AF;
          margin: 0 0 20px;
        }
        .eco-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .eco-stat {
          text-align: center;
          padding: 12px;
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.12);
          border-radius: 8px;
        }
        .eco-stat-number {
          display: block;
          font-size: 20px;
          font-weight: 800;
          color: #F59E0B;
        }
        .eco-stat-label {
          display: block;
          font-size: 11px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .eco-section {
          margin-bottom: 16px;
        }
        .eco-section-title {
          font-size: 13px;
          font-weight: 600;
          color: #D1D5DB;
          margin: 0 0 8px;
        }
        .eco-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .eco-tag {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #D1D5DB;
          text-decoration: none;
          transition: all 0.2s;
        }
        .eco-tag:hover {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
          color: #F59E0B;
        }
        .eco-tag.corridor {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
          color: #93C5FD;
        }
        .eco-tag.active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #6EE7B7;
        }
        .eco-tag.more {
          color: #6B7280;
          cursor: default;
        }
        .eco-location {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: #9CA3AF;
        }
        .eco-loc-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
      `}</style>
        </div>
    );
}
