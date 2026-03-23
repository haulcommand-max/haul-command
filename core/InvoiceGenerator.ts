/**
 * DEPRECATED — Use core/revenue/SmartInvoice.ts instead.
 * This file re-exports the new SmartInvoice for backward compatibility.
 *
 * The new SmartInvoice system provides:
 * - Professional HTML invoice generation (Command Black + Gold theme)
 * - Automatic 3% escrow/platform fee on every verified job
 * - Multiple line item types (hourly, per_mile, flat)
 * - Tax calculation support
 * - Stripe integration hooks
 * - Status tracking (draft → sent → paid → overdue → disputed)
 */

// Re-export everything from the new consolidated invoice system
export {
  generateInvoiceNumber,
  calculateInvoice,
  buildLineItem,
  generateInvoiceHTML,
  type InvoiceData,
  type InvoiceLineItem,
} from './revenue/SmartInvoice';

// Legacy class wrapper for backward compatibility
import { generateInvoiceNumber, calculateInvoice, buildLineItem, generateInvoiceHTML, type InvoiceLineItem } from './revenue/SmartInvoice';

export class InvoiceGenerator {
  /**
   * @deprecated Use SmartInvoice functions directly instead
   */
  async generateInvoiceData(bookingId: string) {
    console.warn('[InvoiceGenerator] DEPRECATED: Use SmartInvoice.generateInvoiceNumber() and calculateInvoice() directly.');
    return {
      invoiceNumber: generateInvoiceNumber(),
      date: new Date().toISOString(),
      lineItems: [],
      totalAmount: 0,
      currency: 'USD',
    };
  }

  /**
   * @deprecated Use generateInvoiceHTML() instead for themed HTML output
   */
  async createPdf(invoiceData: any): Promise<Buffer> {
    console.warn('[InvoiceGenerator] DEPRECATED: Use generateInvoiceHTML() for HTML output, then convert to PDF.');
    return Buffer.from('%PDF-1.4 (Use SmartInvoice.generateInvoiceHTML instead)');
  }
}
