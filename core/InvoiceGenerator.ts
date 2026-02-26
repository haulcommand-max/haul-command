
/**
 * Invoice Generator (The "FinTech Lock-In")
 * Generates PDF Invoices from Trip Financials.
 */

import { createClient } from '@supabase/supabase-js';
// import { jsPDF } from 'jspdf'; // Mocking import for now

interface TripFinancials {
    booking_id: string;
    deadhead_miles: number;
    detention_hours: number;
    hotel_cost: number;
    tolls_cost: number;
    misc_fees: number;
    rate_agreed: number; // Base rate
    rate_type: 'FLAT' | 'PER_MILE';
    loaded_miles: number;
}

export class InvoiceGenerator {
    private supabase;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Generate Invoice Data Object (Ready for PDF)
     */
    async generateInvoiceData(bookingId: string) {
        // 1. Fetch Financials
        const { data: financials, error } = await this.supabase
            .from('trip_financials')
            .select('*')
            .eq('booking_id', bookingId)
            .single();

        if (error) throw error;

        // 2. Fetch Offer Details
        const { data: offer } = await this.supabase
            .from('habe_offers')
            .select('*')
            .eq('id', bookingId)
            .single();

        // 3. Calculate Totals
        const basePay = offer.offer_rate_type === 'FLAT'
            ? offer.offer_rate_value
            : (offer.offer_rate_value * (financials.loaded_miles || 0));

        const detentionPay = financials.detention_hours * 50; // $50/hr standard
        const total = basePay + detentionPay + financials.hotel_cost + financials.tolls_cost + financials.misc_fees;

        return {
            invoiceNumber: `INV-${bookingId.substring(0, 8).toUpperCase()}`,
            date: new Date().toISOString(),
            lineItems: [
                { desc: "Base Rate", amount: basePay },
                { desc: `Detention (${financials.detention_hours} hrs)`, amount: detentionPay },
                { desc: "Hotel Reimbursement", amount: financials.hotel_cost },
                { desc: "Tolls", amount: financials.tolls_cost },
                { desc: "Misc Fees", amount: financials.misc_fees }
            ],
            totalAmount: total,
            currency: 'USD'
        };
    }

    /**
     * Mock PDF Generation (Would use jsPDF or PDFKit)
     */
    async createPdf(invoiceData: any): Promise<Buffer> {
        console.log(`[InvoiceGenerator] Generating PDF for ${invoiceData.invoiceNumber}`);
        console.log(`[InvoiceGenerator] Total: $${invoiceData.totalAmount}`);
        // Return dummy buffer
        return Buffer.from("%PDF-1.4 ... (Mock PDF Data)");
    }
}
