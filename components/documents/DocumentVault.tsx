'use client';

import { useState } from "react";
import { format } from "date-fns";

export function DocumentVault({ defaultCois, defaultOtherDocs, userId }: { defaultCois: any[], defaultOtherDocs: any[], userId?: string }) {
    
    // Fallback UI states if empty
    const hasCoi = defaultCois && defaultCois.length > 0;
    
    return (
        <div className="space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-[#1e3048] pb-4">
                <h2 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#8ab0d0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Active Assets
                </h2>
                <button className="bg-transparent border border-[#385374] text-[#8ab0d0] px-4 py-2 hover:text-white hover:border-white transition-colors text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Upload Document
                </button>
            </div>

            {/* Current COI Card */}
            <div className="bg-[#141e28] border border-green-500/30 rounded-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3">
                    <span className="bg-green-500/20 text-green-400 border border-green-500 text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                    </span>
                </div>
                
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="w-20 h-24 bg-[#0a1118] border border-[#1e3048] rounded shadow-inner flex items-center justify-center flex-shrink-0">
                        <span className="text-[#385374] font-black uppercase text-xl">PDF</span>
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-white font-black text-xl mb-1">Certificate of Insurance (COI)</h3>
                        {hasCoi ? (
                            <p className="text-[#8ab0d0] font-mono text-sm mb-4">Expires: {format(new Date(defaultCois[0].expires_at), 'MMM dd, yyyy')}</p>
                        ) : (
                            <p className="text-[#8ab0d0] text-sm mb-4">No active COI found. Required for profile verification.</p>
                        )}

                        <div className="flex gap-3">
                            {hasCoi ? (
                                <>
                                    <button className="bg-[#1e3048] text-white px-4 py-2 text-xs font-bold uppercase rounded hover:bg-[#385374] transition-colors">View / Replace</button>
                                </>
                            ) : (
                                <button className="bg-[#e8a828] text-black px-4 py-2 text-xs font-black uppercase tracking-wider rounded">Upload COI</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Other Docs Grid */}
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#8ab0d0] pt-4 border-t border-[#1e3048]">Licenses & Certifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-[#0a1118] border border-[#1e3048] p-5 rounded-xl flex justify-between items-center hover:border-[#385374] transition-colors cursor-pointer group">
                    <div>
                        <h4 className="text-white font-bold mb-1 group-hover:text-[#e8a828] transition-colors">W-9 Tax Form</h4>
                        <p className="text-xs text-[#8ab0d0]">Updated Jan 2026</p>
                    </div>
                    <svg className="w-5 h-5 text-[#385374] group-hover:text-[#e8a828]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>

                <div className="bg-[#0a1118] border border-dashed border-[#385374] p-5 rounded-xl flex justify-center items-center hover:bg-[#141e28] hover:border-white transition-colors cursor-pointer group">
                    <span className="text-[#8ab0d0] text-sm uppercase tracking-wider font-bold group-hover:text-white flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Add State Certification
                    </span>
                </div>

            </div>
        </div>
    );
}
