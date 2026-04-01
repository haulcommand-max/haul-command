"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Banknote, Clock, FileCheck, ShieldCheck, ArrowRight, Upload } from 'lucide-react';
import PulsingButton from '@/components/ui/PulsingButton';

interface FactoringProgram {
    id: string;
    name: string;
    fee_percentage: number;
    advance_rate: number;
    payout_speed_hours: number;
    description: string;
}

interface FactoringDashProps {
    bookingId: string;
    totalAmountUsd: number;
    brokerId: string;
}

export default function FactoringDash({ bookingId, totalAmountUsd, brokerId }: FactoringDashProps) {
    const supabase = createClient();
    const [program, setProgram] = useState<FactoringProgram | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [payoutData, setPayoutData] = useState<any>(null);
    const [step, setStep] = useState<'offer' | 'upload_pod' | 'success'>('offer');

    useEffect(() => {
        async function fetchProgram() {
            // Load the default active factoring program
            const { data } = await supabase
                .from('factoring_programs')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .single();

            if (data) {
                setProgram(data);

                // Estimate payout using RPC
                const { data: calcData } = await supabase.rpc('calculate_factoring_payout', {
                    p_amount: totalAmountUsd,
                    p_program_id: data.id
                });
                if (calcData) setPayoutData(calcData);
            }
        }
        fetchProgram();
    }, [totalAmountUsd]);

    const handleAcceptFactoring = async () => {
        setIsProcessing(true);
        // Step 1: Accept terms, move to POD upload
        setTimeout(() => {
            setStep('upload_pod');
            setIsProcessing(false);
        }, 800);
    };

    const handleUploadPOD = async () => {
        setIsProcessing(true);
        // Simulate POD upload to storage and fetching request ID
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Create factoring request
            const { data, error } = await supabase.from('factoring_requests').insert({
                operator_id: user.id,
                broker_id: brokerId,
                booking_id: bookingId,
                program_id: program?.id,
                amount_total: payoutData.original_amount,
                amount_advanced: payoutData.advance_amount,
                fee_amount: payoutData.fee_amount,
                status: 'pod_review',
                pod_url: 'https://cdn.haulcommand.com/pod/demo.pdf'
            }).select().single();

            if (error) throw error;
            setStep('success');
        } catch (e) {
            console.error("Factoring submission failed:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!program || !payoutData) return <div className="animate-pulse bg-slate-900 rounded-2xl h-64 w-full"></div>;

    if (step === 'success') {
        return (
            <div className="bg-slate-900 border border-green-500/30 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Funding Approved in Principle</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                    Your Proof of Delivery is under review. ${payoutData.advance_amount.toFixed(2)} will be dispatched to your linked bank account within {payoutData.payout_speed_hours} hours.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl font-medium text-slate-300">
                    <Clock className="w-4 h-4 text-amber-500" /> Transfer Pending
                </div>
            </div>
        );
    }

    if (step === 'upload_pod') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-2xl font-black text-white mb-2">Upload Proof of Delivery</h3>
                <p className="text-slate-400 mb-8">
                    To release your ${payoutData.advance_amount.toFixed(2)} payout, upload a clear photo or PDF of the signed Bill of Lading.
                </p>

                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center hover:border-amber-500/50 transition-colors cursor-pointer mb-6">
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-4" />
                    <div className="font-bold text-slate-300 text-lg">Tap to upload POD</div>
                    <div className="text-sm text-slate-500 mt-1">Accepts PDF, JPG, PNG</div>
                </div>

                <PulsingButton
                    onClick={handleUploadPOD}
                    disabled={isProcessing}
                    className="w-full flex justify-center py-4"
                >
                    {isProcessing ? "Processing..." : "Submit for Funding"}
                </PulsingButton>
            </div>
        );
    }

    // Step 1: Offer
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-1 overflow-hidden relative shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/5 rounded-[22px] p-6 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
                    <Banknote className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{program.name}</span>
                </div>

                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                    Get Paid Tomorrow
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Skip the 30-day broker wait. We'll advance you ${payoutData.advance_amount.toFixed(2)} tomorrow for a flat {program.fee_percentage}% fee.
                </p>

                <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-slate-400 font-medium">Invoice Total</span>
                        <span className="text-white font-bold">${payoutData.original_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <span className="text-slate-400 font-medium">{program.fee_percentage}% Factoring Fee</span>
                        <span className="text-red-400 font-bold">-${payoutData.fee_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <span className="text-amber-500 font-bold">Payout Tomorrow</span>
                        <span className="text-amber-500 font-black text-xl">${payoutData.advance_amount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-colors">
                        Wait 30 Days
                    </button>
                    <PulsingButton
                        onClick={handleAcceptFactoring}
                        disabled={isProcessing}
                        className="flex-1 flex justify-center py-4"
                        variant="primary"
                    >
                        {isProcessing ? "Loading..." : "Get Paid Tomorrow"}
                    </PulsingButton>
                </div>
            </div>
        </div>
    );
}
