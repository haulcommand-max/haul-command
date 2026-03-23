/**
 * POST /api/invoices/generate
 * Smart Invoice Generator — Revenue Leak #2
 * Auto-generates professional invoices with 3% escrow fee.
 * Integrates with Stripe for payment processing.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  generateInvoiceNumber,
  calculateInvoice,
  buildLineItem,
  generateInvoiceHTML,
  type InvoiceData,
  type InvoiceLineItem,
} from '@/core/revenue/SmartInvoice';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const ESCROW_FEE_PERCENT = 3;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      operatorId, operatorName, operatorEmail,
      brokerId, brokerName, brokerEmail,
      jobId, corridor, originCity, destinationCity,
      items, currency, taxRate, notes, format,
    } = body;

    if (!operatorId || !brokerName || !brokerEmail || !items?.length) {
      return NextResponse.json({
        error: 'operatorId, brokerName, brokerEmail, and items are required',
      }, { status: 400 });
    }

    // Build line items
    const lineItems: InvoiceLineItem[] = items.map((item: any) => 
      buildLineItem(
        item.description || 'Escort Service',
        item.quantity || 1,
        item.rate || 0,
        item.rateType || 'hourly',
      )
    );

    // Calculate totals
    const totals = calculateInvoice(lineItems, currency || 'USD', taxRate || 0);

    // Build invoice
    const invoice: InvoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      jobId: jobId || '',
      operatorId,
      operatorName: operatorName || 'Operator',
      operatorEmail: operatorEmail || '',
      brokerId,
      brokerName,
      brokerEmail,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // Net 30
      corridor: corridor || '',
      originCity: originCity || '',
      destinationCity: destinationCity || '',
      lineItems,
      subtotal: totals.subtotal,
      escrowFee: totals.escrowFee,
      escrowFeePercent: ESCROW_FEE_PERCENT,
      platformFee: totals.escrowFee,
      taxRate: taxRate || 0,
      taxAmount: totals.taxAmount,
      total: totals.total,
      currency: currency || 'USD',
      status: 'draft',
      notes,
    };

    // Save to database
    const db = getSupabaseAdmin();
    const { data: saved, error: saveError } = await db
      .from('invoices')
      .insert({
        invoice_number: invoice.invoiceNumber,
        operator_id: invoice.operatorId,
        broker_id: invoice.brokerId,
        job_id: invoice.jobId,
        subtotal: Math.round(invoice.subtotal * 100), // Store in cents
        platform_fee: Math.round(invoice.escrowFee * 100),
        tax_amount: Math.round((invoice.taxAmount || 0) * 100),
        total: Math.round(invoice.total * 100),
        currency: invoice.currency,
        status: invoice.status,
        metadata: {
          line_items: invoice.lineItems,
          corridor: invoice.corridor,
          origin: invoice.originCity,
          destination: invoice.destinationCity,
          broker_name: invoice.brokerName,
          broker_email: invoice.brokerEmail,
          operator_name: invoice.operatorName,
          operator_email: invoice.operatorEmail,
          notes: invoice.notes,
        },
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Generate HTML
    const html = generateInvoiceHTML(invoice);

    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    return NextResponse.json({
      invoice,
      invoiceId: saved?.id,
      html,
      stripePaymentLink: null, // Would be generated after Stripe invoice creation
    });

  } catch (error: any) {
    console.error('[INVOICE GENERATION ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to generate invoice' }, { status: 500 });
  }
}
