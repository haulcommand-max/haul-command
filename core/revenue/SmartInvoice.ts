// ══════════════════════════════════════════════════════════════
// SMART INVOICE GENERATOR — Revenue Leak #2
// Auto-generates invoices with 3% escrow fee baked in.
// Integrates with Stripe for payment processing.
// ══════════════════════════════════════════════════════════════

export interface InvoiceLineItem {
  description: string;
  hours?: number;
  miles?: number;
  rate: number;
  rateType: 'hourly' | 'per_mile' | 'flat';
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  jobId: string;
  operatorId: string;
  operatorName: string;
  operatorEmail: string;
  brokerId?: string;
  brokerName: string;
  brokerEmail: string;
  issuedDate: string;
  dueDate: string;
  corridor: string;
  originCity: string;
  destinationCity: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  escrowFee: number;         // 3% platform fee
  escrowFeePercent: number;  // 3
  platformFee: number;       // = escrowFee (same thing, clearer name)
  taxRate?: number;
  taxAmount?: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed';
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  notes?: string;
}

const ESCROW_FEE_PERCENT = 3;  // Non-negotiable for verified jobs

export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `HC-${y}${m}${d}-${rand}`;
}

export function calculateInvoice(lineItems: InvoiceLineItem[], currency = 'USD', taxRate = 0): {
  subtotal: number; escrowFee: number; taxAmount: number; total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const escrowFee = Math.round(subtotal * ESCROW_FEE_PERCENT) / 100;
  const taxableAmount = subtotal + escrowFee;
  const taxAmount = taxRate > 0 ? Math.round(taxableAmount * taxRate) / 100 : 0;
  const total = subtotal + escrowFee + taxAmount;
  return { subtotal, escrowFee, taxAmount, total };
}

export function buildLineItem(
  description: string,
  quantity: number,
  rate: number,
  rateType: 'hourly' | 'per_mile' | 'flat'
): InvoiceLineItem {
  const amount = rateType === 'flat' ? rate : quantity * rate;
  return {
    description,
    ...(rateType === 'hourly' ? { hours: quantity } : rateType === 'per_mile' ? { miles: quantity } : {}),
    rate, rateType, amount,
  };
}

export function generateInvoiceHTML(invoice: InvoiceData): string {
  const gold = '#C6923A';
  const bg = '#0B0B0C';
  const surface = '#161619';
  const text = '#F0F0F2';
  const muted = '#6B6B75';

  const itemRows = invoice.lineItems.map(item => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
      <td style="padding: 12px 16px; color: ${text}; font-size: 13px; font-weight: 500;">${item.description}</td>
      <td style="padding: 12px 16px; color: ${muted}; font-size: 13px; text-align: center;">
        ${item.hours ? `${item.hours}h` : item.miles ? `${item.miles}mi` : '1'}
      </td>
      <td style="padding: 12px 16px; color: ${muted}; font-size: 13px; text-align: right;">
        $${item.rate.toFixed(2)}/${item.rateType === 'hourly' ? 'hr' : item.rateType === 'per_mile' ? 'mi' : 'flat'}
      </td>
      <td style="padding: 12px 16px; color: ${text}; font-size: 14px; font-weight: 700; text-align: right;">
        $${item.amount.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const statusColors: Record<string, string> = {
    draft: muted, sent: '#3b82f6', paid: '#22c55e', overdue: '#ef4444', disputed: '#f59e0b',
  };

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: ${bg}; color: ${text}; }
</style></head>
<body>
<div style="max-width: 800px; margin: 0 auto; padding: 40px;">
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px;">
    <div>
      <div style="font-size: 10px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.15em;">Invoice</div>
      <div style="font-size: 28px; font-weight: 900; color: ${text}; margin-top: 4px;">${invoice.invoiceNumber}</div>
      <div style="display: inline-flex; padding: 3px 10px; border-radius: 6px; margin-top: 8px;
        background: rgba(${invoice.status === 'paid' ? '34,197,94' : '107,114,128'},0.1);
        color: ${statusColors[invoice.status] || muted}; font-size: 10px; font-weight: 800; text-transform: uppercase;">
        ${invoice.status}
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; color: ${muted};">Issued: ${invoice.issuedDate}</div>
      <div style="font-size: 11px; color: ${muted}; margin-top: 2px;">Due: ${invoice.dueDate}</div>
      <div style="font-size: 11px; color: ${muted}; margin-top: 2px;">${invoice.corridor}</div>
    </div>
  </div>

  <!-- Parties -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;">
    <div style="background: ${surface}; border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <div style="font-size: 9px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">From</div>
      <div style="font-size: 14px; font-weight: 700; color: ${text};">${invoice.operatorName}</div>
      <div style="font-size: 12px; color: ${muted}; margin-top: 4px;">${invoice.operatorEmail}</div>
    </div>
    <div style="background: ${surface}; border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <div style="font-size: 9px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Bill To</div>
      <div style="font-size: 14px; font-weight: 700; color: ${text};">${invoice.brokerName}</div>
      <div style="font-size: 12px; color: ${muted}; margin-top: 4px;">${invoice.brokerEmail}</div>
    </div>
  </div>

  <!-- Line Items -->
  <table style="width: 100%; border-collapse: collapse; background: ${surface}; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 20px;">
    <thead>
      <tr style="background: rgba(198,146,58,0.06);">
        <th style="padding: 10px 16px; text-align: left; font-size: 9px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Description</th>
        <th style="padding: 10px 16px; text-align: center; font-size: 9px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Qty</th>
        <th style="padding: 10px 16px; text-align: right; font-size: 9px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Rate</th>
        <th style="padding: 10px 16px; text-align: right; font-size: 9px; font-weight: 800; color: ${gold}; text-transform: uppercase; letter-spacing: 0.1em;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Totals -->
  <div style="display: flex; justify-content: flex-end;">
    <div style="width: 280px;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
        <span style="color: ${muted};">Subtotal</span>
        <span style="color: ${text}; font-weight: 600;">$${invoice.subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <span style="color: ${muted};">Platform Fee (${invoice.escrowFeePercent}%)</span>
        <span style="color: ${muted};">$${invoice.escrowFee.toFixed(2)}</span>
      </div>
      ${invoice.taxAmount ? `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
        <span style="color: ${muted};">Tax</span>
        <span style="color: ${muted};">$${invoice.taxAmount.toFixed(2)}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; border-top: 2px solid ${gold}; margin-top: 4px;">
        <span style="color: ${text}; font-weight: 800;">Total</span>
        <span style="color: ${gold}; font-weight: 900;">$${invoice.total.toFixed(2)}</span>
      </div>
    </div>
  </div>

  ${invoice.notes ? `<div style="margin-top: 20px; padding: 16px; background: ${surface}; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">
    <div style="font-size: 9px; font-weight: 800; color: ${muted}; text-transform: uppercase; margin-bottom: 6px;">Notes</div>
    <div style="font-size: 12px; color: ${muted}; line-height: 1.6;">${invoice.notes}</div>
  </div>` : ''}
</div>
</body></html>`;
}
