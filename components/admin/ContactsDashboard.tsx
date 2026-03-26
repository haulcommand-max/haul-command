'use client';

import React, { useState, useMemo, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   Contacts Command Dashboard — 1.5M Entity Table
   Internal Refine-style data table for operators, brokers, carriers
   ═══════════════════════════════════════════════════════════════ */

interface Contact {
  id: string;
  type: 'operator' | 'broker' | 'carrier' | 'shipper' | 'repair_shop';
  name: string;
  company: string;
  email: string;
  phone: string;
  state: string;
  country: string;
  trust_score: number;
  verified: boolean;
  tier: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  revenue_cents: number;
  last_active: string;
  created_at: string;
  tags: string[];
}

interface ContactsDashboardProps {
  contacts: Contact[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  onSort?: (field: string, dir: 'asc' | 'desc') => void;
  onExport?: () => void;
  onBulkAction?: (action: string, ids: string[]) => void;
  loading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  operator: '#C6923A',
  broker: '#4299E1',
  carrier: '#9F7AEA',
  shipper: '#22C55E',
  repair_shop: '#F59E0B',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  inactive: '#888',
  pending: '#F59E0B',
  suspended: '#EF4444',
};

export function ContactsDashboard({
  contacts,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onFilter,
  onSort,
  onExport,
  onBulkAction,
  loading,
}: ContactsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');

  const allSelected = contacts.length > 0 && contacts.every(c => selectedIds.has(c.id));
  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  }, [allSelected, contacts]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSort = (field: string) => {
    const dir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDir(dir);
    onSort?.(field, dir);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    onSearch?.(q);
  };

  // Stats
  const stats = useMemo(() => {
    const operators = contacts.filter(c => c.type === 'operator').length;
    const brokers = contacts.filter(c => c.type === 'broker').length;
    const verified = contacts.filter(c => c.verified).length;
    const revenue = contacts.reduce((s, c) => s + c.revenue_cents, 0);
    return { operators, brokers, verified, revenue };
  }, [contacts]);

  return (
    <div className="cd">
      {/* Header */}
      <div className="cd-header">
        <div className="cd-title-area">
          <h2 className="cd-title">📡 Contact Intelligence</h2>
          <span className="cd-total">{totalCount.toLocaleString()} entities</span>
        </div>
        <div className="cd-header-actions">
          <button className="cd-export" onClick={onExport}>📤 Export CSV</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="cd-stats">
        <div className="cd-stat">
          <div className="cd-stat-val">{totalCount.toLocaleString()}</div>
          <div className="cd-stat-lbl">Total Contacts</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-val" style={{ color: '#C6923A' }}>{stats.operators}</div>
          <div className="cd-stat-lbl">Operators</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-val" style={{ color: '#4299E1' }}>{stats.brokers}</div>
          <div className="cd-stat-lbl">Brokers</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-val" style={{ color: '#22C55E' }}>{stats.verified}</div>
          <div className="cd-stat-lbl">Verified</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-val" style={{ color: '#22C55E' }}>${(stats.revenue / 100).toLocaleString()}</div>
          <div className="cd-stat-lbl">Revenue</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cd-toolbar">
        <div className="cd-search">
          <span className="cd-search-icon">🔍</span>
          <input
            className="cd-search-input"
            placeholder="Search name, email, company, state…"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <div className="cd-filters">
          <select className="cd-select" value={filterType} onChange={e => { setFilterType(e.target.value); onFilter?.({ type: e.target.value }); }}>
            <option value="all">All Types</option>
            <option value="operator">Operators</option>
            <option value="broker">Brokers</option>
            <option value="carrier">Carriers</option>
            <option value="shipper">Shippers</option>
            <option value="repair_shop">Repair Shops</option>
          </select>
          <select className="cd-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); onFilter?.({ status: e.target.value }); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <select className="cd-select" value={filterCountry} onChange={e => { setFilterCountry(e.target.value); onFilter?.({ country: e.target.value }); }}>
            <option value="all">All Countries</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="cd-bulk">
          <span>{selectedIds.size} selected</span>
          <button onClick={() => onBulkAction?.('verify', [...selectedIds])}>✓ Verify</button>
          <button onClick={() => onBulkAction?.('tag', [...selectedIds])}>🏷️ Tag</button>
          <button onClick={() => onBulkAction?.('email', [...selectedIds])}>📧 Email</button>
          <button onClick={() => onBulkAction?.('export', [...selectedIds])}>📤 Export</button>
          <button className="cd-bulk-danger" onClick={() => onBulkAction?.('suspend', [...selectedIds])}>⛔ Suspend</button>
        </div>
      )}

      {/* Table */}
      <div className="cd-table-wrap">
        <table className="cd-table">
          <thead>
            <tr>
              <th className="cd-th-check"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th onClick={() => handleSort('type')} className="cd-th-sort">Type {sortField === 'type' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('name')} className="cd-th-sort">Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('company')} className="cd-th-sort">Company</th>
              <th>Contact</th>
              <th onClick={() => handleSort('state')} className="cd-th-sort">Location</th>
              <th onClick={() => handleSort('trust_score')} className="cd-th-sort">Trust {sortField === 'trust_score' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th onClick={() => handleSort('status')} className="cd-th-sort">Status</th>
              <th>Tier</th>
              <th onClick={() => handleSort('revenue_cents')} className="cd-th-sort">Revenue</th>
              <th onClick={() => handleSort('last_active')} className="cd-th-sort">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="cd-skeleton-row">
                  {Array.from({ length: 11 }).map((_, j) => (
                    <td key={j}><div className="cd-skeleton" /></td>
                  ))}
                </tr>
              ))
            ) : contacts.map(c => (
              <tr key={c.id} className={`cd-row ${selectedIds.has(c.id) ? 'cd-row--selected' : ''}`}>
                <td><input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleOne(c.id)} /></td>
                <td>
                  <span className="cd-type-badge" style={{ color: TYPE_COLORS[c.type], borderColor: TYPE_COLORS[c.type] + '40', background: TYPE_COLORS[c.type] + '12' }}>
                    {c.type}
                  </span>
                </td>
                <td>
                  <div className="cd-name-cell">
                    <span className="cd-name">{c.name}</span>
                    {c.verified && <span className="cd-verified-dot" />}
                  </div>
                </td>
                <td className="cd-company">{c.company}</td>
                <td>
                  <div className="cd-contact-cell">
                    <span className="cd-email">{c.email}</span>
                    <span className="cd-phone">{c.phone}</span>
                  </div>
                </td>
                <td>
                  <span className="cd-location">{c.state}, {c.country}</span>
                </td>
                <td>
                  <div className="cd-trust">
                    <div className="cd-trust-bar">
                      <div className="cd-trust-fill" style={{
                        width: `${c.trust_score}%`,
                        background: c.trust_score >= 80 ? '#22C55E' : c.trust_score >= 50 ? '#F59E0B' : '#EF4444',
                      }} />
                    </div>
                    <span className="cd-trust-val">{c.trust_score}%</span>
                  </div>
                </td>
                <td>
                  <span className="cd-status" style={{ color: STATUS_COLORS[c.status] }}>
                    <span className="cd-status-dot" style={{ background: STATUS_COLORS[c.status] }} />
                    {c.status}
                  </span>
                </td>
                <td><span className="cd-tier">{c.tier}</span></td>
                <td className="cd-revenue">${(c.revenue_cents / 100).toLocaleString()}</td>
                <td className="cd-last-active">{c.last_active}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="cd-pagination">
        <span className="cd-page-info">
          Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
        </span>
        <div className="cd-page-controls">
          <button onClick={() => onPageChange?.(1)} disabled={page === 1}>⟨⟨</button>
          <button onClick={() => onPageChange?.(page - 1)} disabled={page === 1}>⟨</button>
          <span className="cd-page-num">Page {page} of {totalPages.toLocaleString()}</span>
          <button onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}>⟩</button>
          <button onClick={() => onPageChange?.(totalPages)} disabled={page >= totalPages}>⟩⟩</button>
        </div>
      </div>

      <style jsx>{`
        .cd { background:linear-gradient(180deg,#0B0C10,#080A0E); border:1px solid rgba(255,255,255,0.06); border-radius:16px; overflow:hidden; color:#F0F0F0; font-family:var(--font-sans,'Inter',system-ui,sans-serif); }
        .cd-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 12px; }
        .cd-title-area { display:flex; align-items:center; gap:12px; }
        .cd-title { margin:0; font-size:20px; font-weight:800; }
        .cd-total { font-size:12px; color:#888; padding:4px 10px; background:rgba(255,255,255,0.04); border-radius:20px; }
        .cd-export { padding:8px 14px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); border-radius:8px; color:#ccc; font-size:12px; font-weight:600; cursor:pointer; }
        .cd-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; padding:0 24px 16px; }
        @media(max-width:768px) { .cd-stats { grid-template-columns:repeat(3,1fr); } }
        .cd-stat { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:12px; }
        .cd-stat-val { font-size:22px; font-weight:900; color:#F0F0F0; }
        .cd-stat-lbl { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:0.05em; margin-top:2px; }
        .cd-toolbar { display:flex; gap:12px; padding:0 24px 16px; flex-wrap:wrap; }
        .cd-search { position:relative; flex:1; min-width:200px; }
        .cd-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:14px; }
        .cd-search-input { width:100%; height:40px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.10); border-radius:10px; padding:0 14px 0 36px; font-size:14px; color:#F0F0F0; outline:none; }
        .cd-search-input:focus { border-color:rgba(198,146,58,0.5); }
        .cd-search-input::placeholder { color:rgba(255,255,255,0.25); }
        .cd-filters { display:flex; gap:8px; }
        .cd-select { height:40px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.10); border-radius:10px; padding:0 12px; font-size:12px; color:#ccc; outline:none; cursor:pointer; }
        .cd-bulk { display:flex; align-items:center; gap:8px; padding:8px 24px; background:rgba(198,146,58,0.06); border-top:1px solid rgba(198,146,58,0.15); border-bottom:1px solid rgba(198,146,58,0.15); }
        .cd-bulk span:first-child { font-size:12px; font-weight:600; color:#C6923A; }
        .cd-bulk button { padding:4px 10px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); border-radius:6px; color:#ccc; font-size:11px; font-weight:600; cursor:pointer; }
        .cd-bulk-danger { color:#EF4444 !important; border-color:rgba(239,68,68,0.2) !important; }
        .cd-table-wrap { overflow-x:auto; }
        .cd-table { width:100%; border-collapse:collapse; font-size:12px; }
        .cd-table thead { position:sticky; top:0; z-index:10; }
        .cd-table th { padding:10px 12px; text-align:left; font-weight:600; color:#666; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; background:#0B0C10; border-bottom:1px solid rgba(255,255,255,0.08); white-space:nowrap; }
        .cd-th-sort { cursor:pointer; user-select:none; }
        .cd-th-sort:hover { color:#C6923A; }
        .cd-th-check { width:40px; }
        .cd-row { border-bottom:1px solid rgba(255,255,255,0.03); transition:background 0.1s; }
        .cd-row:hover { background:rgba(255,255,255,0.02); }
        .cd-row--selected { background:rgba(198,146,58,0.04); }
        .cd-table td { padding:10px 12px; vertical-align:middle; }
        .cd-type-badge { font-size:9px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.04em; border:1px solid; }
        .cd-name-cell { display:flex; align-items:center; gap:6px; }
        .cd-name { font-weight:600; color:#F0F0F0; white-space:nowrap; }
        .cd-verified-dot { width:8px; height:8px; border-radius:50%; background:#22C55E; flex-shrink:0; }
        .cd-company { color:#888; white-space:nowrap; }
        .cd-contact-cell { display:flex; flex-direction:column; gap:1px; }
        .cd-email { color:#ccc; font-size:11px; }
        .cd-phone { color:#666; font-size:10px; }
        .cd-location { color:#888; white-space:nowrap; font-size:11px; }
        .cd-trust { display:flex; align-items:center; gap:6px; }
        .cd-trust-bar { width:40px; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
        .cd-trust-fill { height:100%; border-radius:2px; transition:width 0.3s; }
        .cd-trust-val { font-size:11px; font-weight:700; color:#F0F0F0; }
        .cd-status { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; text-transform:capitalize; }
        .cd-status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .cd-tier { font-size:10px; font-weight:600; color:#C6923A; padding:2px 6px; background:rgba(198,146,58,0.08); border-radius:4px; }
        .cd-revenue { font-weight:700; color:#22C55E; white-space:nowrap; }
        .cd-last-active { color:#888; white-space:nowrap; font-size:11px; }
        .cd-pagination { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-top:1px solid rgba(255,255,255,0.06); }
        .cd-page-info { font-size:11px; color:#888; }
        .cd-page-controls { display:flex; align-items:center; gap:4px; }
        .cd-page-controls button { width:32px; height:32px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#ccc; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .cd-page-controls button:disabled { opacity:0.3; cursor:not-allowed; }
        .cd-page-num { font-size:11px; color:#888; padding:0 8px; }
        .cd-skeleton-row td { padding:10px 12px; }
        .cd-skeleton { height:14px; background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%); background-size:200% 100%; border-radius:4px; animation:cd-shimmer 1.5s infinite; }
        @keyframes cd-shimmer { to { background-position:-200% 0; } }

        input[type="checkbox"] { width:16px; height:16px; accent-color:#C6923A; cursor:pointer; }
      `}</style>
    </div>
  );
}
