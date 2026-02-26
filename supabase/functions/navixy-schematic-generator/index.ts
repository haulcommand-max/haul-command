// ============================================================================
// SYSTEM 2 — AUTO-SCHEMATIC GENERATOR
// ============================================================================
// Logic:    Draws a DOT-compliant vehicle diagram based on axle data.
// Inputs:   VehicleSchematic object
// Output:   PDF file (application/pdf)
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/supabase-client.ts";
import { PDFDocument, StandardFonts, rgb, degrees } from "https://esm.sh/pdf-lib@1.17.1";
import type { VehicleSchematic } from "../_shared/types.ts";

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const input: VehicleSchematic = await req.json();

        // 1. Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([792, 612]); // Landscape Letter (11x8.5)
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // 2. Draw Header
        const fontSize = 18;
        page.drawText('HAUL COMMAND — VEHICLE CONFIGURATION SCHEMATIC', {
            x: 50,
            y: height - 50,
            size: fontSize,
            font: fontBold,
            color: rgb(0, 0, 0),
        });

        page.drawText(`Configuration: ${input.config_name}`, {
            x: 50,
            y: height - 80,
            size: 12,
            font: font,
        });

        page.drawText(`Generated: ${new Date().toISOString().split('T')[0]}`, {
            x: width - 200,
            y: height - 50,
            size: 10,
            font: font,
        });

        // 3. Draw Vehicle Diagram (Simplified Side View)
        // Baseline Y for wheels
        const groundY = 200;
        const wheelRadius = 15;
        const wheelY = groundY + wheelRadius;

        // Scale Factor (fit ~100ft into ~700px width)
        // 1 ft = 7 px
        const scale = 7;
        const startX = 50;

        // Draw Ground Line
        page.drawLine({
            start: { x: 50, y: groundY },
            end: { x: width - 50, y: groundY },
            thickness: 2,
            color: rgb(0.2, 0.2, 0.2),
        });

        // Draw Axles & Tites
        for (const axle of input.axles) {
            const axleX = startX + (axle.dist_from_front_ft * scale);

            // Draw Wheel
            page.drawCircle({
                x: axleX,
                y: wheelY,
                size: wheelRadius,
                borderColor: rgb(0, 0, 0),
                borderWidth: 2,
                color: rgb(0.9, 0.9, 0.9),
            });

            // Label Axle Number
            page.drawText(`${axle.number}`, {
                x: axleX - 4,
                y: groundY - 15,
                size: 10,
                font: fontBold,
            });

            // Label Weight
            page.drawText(`${(axle.weight_lbs / 1000).toFixed(1)}k`, {
                x: axleX - 10,
                y: wheelY + 25,
                size: 9,
                font: font,
                color: rgb(0.8, 0, 0), // Red text for weight
            });
        }

        // Draw Spacings (Dimension Lines)
        let prevAxleX = -1;
        for (const axle of input.axles) {
            const axleX = startX + (axle.dist_from_front_ft * scale);

            if (prevAxleX !== -1) {
                // Draw line between axles
                const distPixels = axleX - prevAxleX;
                const distFt = (distPixels / scale).toFixed(1);

                const dimY = groundY - 40; // Below ground line

                // Horizontal line
                page.drawLine({
                    start: { x: prevAxleX, y: dimY },
                    end: { x: axleX, y: dimY },
                    thickness: 1,
                    color: rgb(0, 0, 0.8),
                });

                // Ticks
                page.drawLine({ start: { x: prevAxleX, y: dimY - 3 }, end: { x: prevAxleX, y: dimY + 3 }, thickness: 1, color: rgb(0, 0, 0.8) });
                page.drawLine({ start: { x: axleX, y: dimY - 3 }, end: { x: axleX, y: dimY + 3 }, thickness: 1, color: rgb(0, 0, 0.8) });

                // Label Distance
                page.drawText(`${distFt}'`, {
                    x: prevAxleX + (distPixels / 2) - 10,
                    y: dimY + 5,
                    size: 9,
                    font: font,
                    color: rgb(0, 0, 0.8),
                });
            }
            prevAxleX = axleX;
        }

        // 4. Draw Footer
        page.drawText('Use for Permit Application Only. Verify all measurements physically prior to trip.', {
            x: 50,
            y: 30,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // 5. Serialize
        const pdfBytes = await pdfDoc.save();

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="schematic_${input.vehicle_id}.pdf"`
            },
        });

    } catch (err) {
        return new Response(
            JSON.stringify({ error: (err as Error).message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
