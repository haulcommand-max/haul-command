export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function POST(req: Request) {
    try {
        const { jurisdiction_code } = await req.json();
        if (!jurisdiction_code) {
            return NextResponse.json({ success: false, error: "Missing jurisdiction_code" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.rpc("get_jurisdiction_drawer", { p_jurisdiction_code: jurisdiction_code });
        if (error || !data) {
            return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
        }

        if (!data.meta || !data.meta.name) {
            return NextResponse.json({ success: false, error: "No data yet for this jurisdiction" }, { status: 404 });
        }

        const doc = new jsPDF();

        // Title
        doc.setFontSize(22);
        doc.text(`Haul Command - State Packet`, 14, 20);
        doc.setFontSize(16);
        doc.text(`${data.meta.name} (${jurisdiction_code})`, 14, 30);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toISOString()}`, 14, 38);

        // Operators Table
        if (data.operators && data.operators.length > 0) {
            doc.setFontSize(14);
            doc.text("Verified Operators", 14, 50);

            const operatorRows = data.operators.map((op: any) => [
                op.business_name,
                op.phone,
                op.rating?.toFixed(1) || "N/A",
                op.verified ? "Yes" : "No"
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Business Name', 'Phone', 'Rating', 'Verified']],
                body: operatorRows,
            });
        }

        // Rulepacks Table
        const currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 60;
        if (data.rulepacks && data.rulepacks.length > 0) {
            doc.setFontSize(14);
            doc.text("Rules & Regulations", 14, currentY);

            const ruleRows = data.rulepacks.map((rp: any) => [
                rp.topic,
                rp.summary
            ]);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Topic', 'Summary']],
                body: ruleRows,
            });
        }

        // Support Contacts
        const nextY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : currentY + 20;
        if (data.support_contacts && data.support_contacts.length > 0) {
            doc.setFontSize(14);
            doc.text("Support & Emergency", 14, nextY);

            const supportRows = data.support_contacts.map((sc: any) => [
                sc.contact_type,
                sc.label,
                sc.phone || "N/A"
            ]);

            autoTable(doc, {
                startY: nextY + 5,
                head: [['Type', 'Label', 'Phone']],
                body: supportRows,
            });
        }

        const pdfArrayBuffer = doc.output('arraybuffer');
        const filename = `packet_${jurisdiction_code}_${Date.now()}.pdf`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('jurisdiction-exports')
            .upload(filename, pdfArrayBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
        }

        const { data: publicData } = supabase
            .storage
            .from('jurisdiction-exports')
            .getPublicUrl(filename);

        return NextResponse.json({
            success: true,
            pdf_url: publicData.publicUrl
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
