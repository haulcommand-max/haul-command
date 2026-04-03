'use client';
/**
 * EarningsExport — Export earnings data to CSV or PDF.
 *
 * P3: Professional utility — operators need receipts for tax and accounting.
 * CSV: instant client-side generation.
 * PDF: uses browser print dialog (no server dependency).
 */
'use client';

import React, { useState, useCallback } from 'react';
import { EarningsService, formatCentsExact, type EarningsRecord } from '@/lib/earnings/earnings-service';

interface EarningsExportProps {
  userId: string;
  className?: string;
}

function toCSV(records: EarningsRecord[]): string {
  const headers = [
    'Date',
    'Job ID',
    'Source',
    'Amount',
    'Fee',
    'Net',
    'Currency',
    'Status',
    'Origin',
    'Destination',
    'Corridor',
  ];

  const rows = records.map(r => [
    new Date(r.created_at).toLocaleDateString('en-US'),
    r.job_id ?? '',
    r.source,
    (r.amount_cents / 100).toFixed(2),
    (r.fee_cents / 100).toFixed(2),
    (r.net_cents / 100).toFixed(2),
    r.currency,
    r.status,
    r.origin_state ?? '',
    r.destination_state ?? '',
    r.corridor_label ?? '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generatePDFHTML(records: EarningsRecord[]): string {
  const totalNet = records.reduce((s, r) => s + r.net_cents, 0);
  const totalFees = records.reduce((s, r) => s + r.fee_cents, 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Haul Command — Earnings Report</title>
  <style>
    @media print {
      @page { margin: 0.75in; size: letter; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #D4A844;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo { font-size: 24px; font-weight: 800; color: #D4A844; }
    .date { font-size: 13px; color: #666; }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .summary-card {
      padding: 16px;
      background: #f9f9f9;
      border-radius: 8px;
      text-align: center;
    }
    .summary-value { font-size: 24px; font-weight: 800; color: #1a1a1a; }
    .summary-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      text-align: left;
      padding: 10px 8px;
      border-bottom: 2px solid #e5e5e5;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      font-weight: 700;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    tr:hover td { background: #fafafa; }
    .text-right { text-align: right; }
    .text-green { color: #16a34a; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">HAUL COMMAND</div>
    <div class="date">Earnings Report — Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-value text-green">${formatCentsExact(totalNet)}</div>
      <div class="summary-label">Net Earnings</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${records.length}</div>
      <div class="summary-label">Total Jobs</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${formatCentsExact(totalFees)}</div>
      <div class="summary-label">Total Fees</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Source</th>
        <th>Corridor</th>
        <th class="text-right">Amount</th>
        <th class="text-right">Fee</th>
        <th class="text-right">Net</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${records.map(r => `
        <tr>
          <td>${new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
          <td>${r.source.replace(/_/g, ' ')}</td>
          <td>${r.corridor_label || r.origin_state && r.destination_state ? `${r.origin_state} → ${r.destination_state}` : '—'}</td>
          <td class="text-right">${formatCentsExact(r.amount_cents)}</td>
          <td class="text-right">${r.fee_cents > 0 ? formatCentsExact(r.fee_cents) : '—'}</td>
          <td class="text-right text-green">${formatCentsExact(r.net_cents)}</td>
          <td>${r.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    This report was generated by Haul Command Pay. For questions, contact support@haulcommand.com.
  </div>
</body>
</html>`;
}

export default function EarningsExport({ userId, className = '' }: EarningsExportProps) {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    setExporting(format);
    try {
      const service = new EarningsService();
      const records = await service.getExportData(userId);

      if (records.length === 0) {
        alert('No earnings data to export.');
        setExporting(null);
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'csv') {
        const csv = toCSV(records);
        downloadFile(csv, `haul-command-earnings-${dateStr}.csv`, 'text/csv');
      } else {
        // PDF via print dialog
        const html = generatePDFHTML(records);
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.onload = () => {
            setTimeout(() => {
              win.print();
            }, 500);
          };
        }
      }
    } catch (err) {
      console.error('[export] Error:', err);
    } finally {
      setExporting(null);
    }
  }, [userId]);

  return (
    <div className={`earnings-export ${className}`} style={{
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      <button
        aria-label="Export earnings as CSV"
        onClick={() => handleExport('csv')}
        disabled={!!exporting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: exporting === 'csv' ? '#D4A844' : 'rgba(255,255,255,0.6)',
          fontSize: 12,
          fontWeight: 700,
          cursor: exporting ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
      </button>
      <button
        aria-label="Export earnings as PDF"
        onClick={() => handleExport('pdf')}
        disabled={!!exporting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: exporting === 'pdf' ? '#D4A844' : 'rgba(255,255,255,0.6)',
          fontSize: 12,
          fontWeight: 700,
          cursor: exporting ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        {exporting === 'pdf' ? 'Generating...' : 'Export PDF'}
      </button>
    </div>
  );
}
