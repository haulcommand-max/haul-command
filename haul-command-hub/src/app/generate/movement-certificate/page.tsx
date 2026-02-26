'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { calculateMovementRisk, MovementInput } from '@/lib/regulatory-engine';

function CertificateContent() {
    const searchParams = useSearchParams();

    const input: MovementInput = {
        stateSlug: searchParams.get('state') || 'texas',
        width: Number(searchParams.get('width')) || 8.5,
        height: Number(searchParams.get('height')) || 13.5,
        length: Number(searchParams.get('length')) || 65,
        isFriday: searchParams.get('friday') === 'true',
        isMetro: searchParams.get('metro') === 'true',
        cityName: searchParams.get('city') || '',
    };

    const result = calculateMovementRisk(input);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const certId = `HC-CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    if (!result) return <div>Invalid Selection</div>;

    return (
        <div className="min-h-screen bg-white text-black p-8 md:p-20 font-serif relative overflow-hidden print:p-0">
            {/* Security Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-45deg] pointer-events-none">
                <div className="text-[200px] font-black italic">HAUL COMMAND</div>
            </div>

            <div className="max-w-4xl mx-auto border-8 border-double border-black p-12 relative z-10 bg-white">
                <header className="flex justify-between items-start mb-16 pb-8 border-b-2 border-black">
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter mb-2">HAUL COMMAND</h1>
                        <p className="text-sm font-bold uppercase tracking-widest text-gray-600">Oversize Regulatory Compliance Division</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-xs mb-1">CERTIFICATE ID: {certId}</p>
                        <p className="font-mono text-xs">ISSUANCE DATE: {date}</p>
                    </div>
                </header>

                <section className="mb-16">
                    <h2 className="text-center text-3xl font-black uppercase tracking-tighter underline underline-offset-8 mb-12">Movement Feasibility Review</h2>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="space-y-4">
                            <h3 className="font-black border-b border-black text-sm uppercase">Load Description</h3>
                            <p className="flex justify-between text-xs"><span>STATE:</span> <strong>{input.stateSlug.toUpperCase()}</strong></p>
                            <p className="flex justify-between text-xs"><span>CITY/COUNTY:</span> <strong>{input.cityName || 'N/A'}</strong></p>
                            <p className="flex justify-between text-xs"><span>WIDTH:</span> <strong>{input.width}' 00"</strong></p>
                            <p className="flex justify-between text-xs"><span>HEIGHT:</span> <strong>{input.height}' 00"</strong></p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-black border-b border-black text-sm uppercase">Movement Window</h3>
                            <p className="flex justify-between text-xs"><span>FRIDAY MOVE:</span> <strong>{input.isFriday ? 'YES' : 'NO'}</strong></p>
                            <p className="flex justify-between text-xs"><span>METRO ZONE:</span> <strong>{input.isMetro ? 'YES' : 'NO'}</strong></p>
                            <p className="flex justify-between text-xs"><span>NIGHT WINDOW:</span> <strong>PERMIT CONDITIONAL</strong></p>
                        </div>
                    </div>
                </section>

                <section className="bg-black/5 p-8 rounded-xl border-2 border-black mb-16">
                    <h3 className="text-center font-black text-xl uppercase mb-6 italic">Risk Vector Assessment</h3>
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                            <p className="text-[10px] font-black uppercase mb-1">Risk Score</p>
                            <p className="text-4xl font-black">{result.riskScore}/10</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase mb-1">Pilot Cars</p>
                            <p className="text-4xl font-black">{result.escortsRequired}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase mb-1">Police Req.</p>
                            <p className="text-4xl font-black">{result.policeRequired ? 'YES' : 'NO'}</p>
                        </div>
                    </div>
                </section>

                <section className="mb-16 space-y-6">
                    <div className="flex items-start">
                        <div className="w-4 h-4 border border-black flex-shrink-0 mt-1 mr-4 flex items-center justify-center">
                            {result.riskScore > 0 ? '✓' : ''}
                        </div>
                        <p className="text-xs leading-relaxed italic">The dimensions specified above trigger mandatory escort provisions under current DOT and state administrative code. Failure to secure proper pilot car coverage constitutes a felony movement in specific jurisdictions.</p>
                    </div>
                    {result.heightPoleRequired && (
                        <div className="flex items-start">
                            <div className="w-4 h-4 border border-black flex-shrink-0 mt-1 mr-4 flex items-center justify-center">✓</div>
                            <p className="text-xs leading-relaxed italic"><strong>HEIGHT POLE MANDATORY:</strong> Lead escort must be equipped with a calibrated height pole set 6" above the maximum load height.</p>
                        </div>
                    )}
                </section>

                <footer className="pt-8 border-t border-black flex justify-between items-end">
                    <div className="max-w-xs text-[10px] uppercase font-bold text-gray-500 italic">
                        Disclaimer: This document is an automated feasibility review based on static DOT data. It does not replace an official motor carrier permit.
                    </div>
                    <div className="text-center">
                        <div className="w-40 h-1 bg-black mb-1 mx-auto"></div>
                        <p className="text-[10px] font-black uppercase">Automated Systems Verification</p>
                        <p className="text-[10px] text-gray-400">Haul-Command-OS v3.1</p>
                    </div>
                </footer>
            </div>

            <div className="max-w-4xl mx-auto mt-8 flex space-x-4 print:hidden">
                <button onClick={() => window.print()} className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:opacity-80 transition-opacity">Print Certificate</button>
                <button onClick={() => window.history.back()} className="border border-black px-8 py-3 rounded-lg font-bold hover:bg-black hover:text-white transition-all">Back to Tool</button>
            </div>
        </div>
    );
}

export default function CertificatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-black font-serif italic">Validating Certificate Integrity...</div>}>
            <CertificateContent />
        </Suspense>
    );
}
