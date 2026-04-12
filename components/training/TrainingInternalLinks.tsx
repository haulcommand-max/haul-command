"use client";

import Link from 'next/link';

type ContentEdge = {
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  link_type: string;
  anchor_text: string;
  priority: number;
};

/**
 * Renders internal links from the content_edges table.
 * This component surfaces the cross-system link graph that connects
 * training programs to glossary terms, regulations, and tools.
 * 
 * Tables used:
 *   - content_edges (from_type, from_id → to_type, to_id)
 *   - All edges are seeded in 20260409_302_training_catalog_seed.sql
 */
export function TrainingInternalLinks({ edges }: { edges: ContentEdge[] }) {
  if (!edges || edges.length === 0) return null;

  // Build URL from edge type + ID
  const buildHref = (type: string, id: string) => {
    switch (type) {
      case 'glossary': return `/glossary/${id}`;
      case 'regulation': return `/rules/${id}`;
      case 'training': return `/training/${id}`;
      case 'tool': return `/tools/${id}`;
      case 'page': return id.startsWith('/') ? id : `/${id}`;
      default: return `/${type}/${id}`;
    }
  };

  // Group edges by link_type for organized display
  const grouped: Record<string, ContentEdge[]> = {};
  edges.forEach(e => {
    // Only show outbound links FROM training → other types
    // and reverse links (glossary → training as "Related Training")
    const key = e.from_type === 'training' ? e.link_type : 'related_training';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const sectionLabels: Record<string, { title: string; icon: string }> = {
    explains: { title: 'Glossary Terms Covered', icon: '📖' },
    trains_for: { title: 'Regulations Covered', icon: '⚖️' },
    supports: { title: 'Related Tools', icon: '🔧' },
    next_action: { title: 'Next Steps', icon: '➡️' },
    related_training: { title: 'Related Training', icon: '🎓' },
  };

  return (
    <section style={{
      padding: '48px 24px',
      maxWidth: 1100,
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8,
        letterSpacing: '-0.02em',
      }}>
        Connected Knowledge
      </h2>
      <p style={{ color: '#6a6a7a', fontSize: 14, marginBottom: 32 }}>
        Every training program connects to regulations, glossary terms, and tools across the platform.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {Object.entries(grouped).map(([linkType, items]) => {
          const section = sectionLabels[linkType] || { title: linkType, icon: '🔗' };
          return (
            <div key={linkType} style={{
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: '20px 24px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                fontSize: 13, fontWeight: 700, color: '#F5A623',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.slice(0, 8).map((edge, i) => {
                  const isOutbound = edge.from_type === 'training';
                  const targetType = isOutbound ? edge.to_type : edge.from_type;
                  const targetId = isOutbound ? edge.to_id : edge.from_id;
                  const href = buildHref(targetType, targetId);

                  return (
                    <Link
                      key={`${edge.from_id}-${edge.to_id}-${i}`}
                      href={href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 13, color: '#b0b0c0',
                        textDecoration: 'none',
                        padding: '6px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#F5A623';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#b0b0c0';
                      }}
                    >
                      <span style={{ color: '#4a4a5a', fontSize: 11 }}>↗</span>
                      <span>{edge.anchor_text || targetId}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
