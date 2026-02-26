import React, { useState } from 'react';
import { VerificationGate, VerificationRequest } from '../../../core/compliance/VerificationGate';

import { ReciprocityEngine, ReciprocityResult } from '../../../core/compliance/ReciprocityEngine';

export default function VerificationPortal() {
    const [driverId, setDriverId] = useState('DRV-TEMP-123');
    const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'VERIFIED' | 'REJECTED'>('IDLE');
    const [files, setFiles] = useState<File[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // Reciprocity State
    const [originRecip, setOriginRecip] = useState('US-FL');
    const [destRecip, setDestRecip] = useState('US-GA');
    const [recipStatus, setRecipStatus] = useState<ReciprocityResult | null>(null);

    const gate = new VerificationGate();
    const recipEngine = new ReciprocityEngine();

    const handleReciprocityCheck = async () => {
        addLog(`Checking Reciprocity: ${originRecip} -> ${destRecip}...`);
        const result = await recipEngine.checkReciprocity(originRecip, destRecip);
        setRecipStatus(result);
        addLog(result.isAccepted ? `✅ APPROVED: ${result.notes}` : `❌ REJECTED: ${result.notes}`);
    };

    const handleUpload = async (type: VerificationRequest['type'], file: File) => {
        setStatus('VERIFYING');
        addLog(`Uploading ${type}...`);

        // Mock Image URL (In reality, upload to Supabase Storage -> Get URL)
        const mockUrl = URL.createObjectURL(file);

        const request: VerificationRequest = {
            driver_id: driverId,
            job_id: 'JOB-INIT-001',
            image_url: mockUrl, // Passing blob URL for now
            timestamp: Date.now(),
            type: type
        };

        try {
            addLog(`Analyzing ${type} with Vision AI...`);
            const result = await gate.submitEvidence(request);

            if (result.verified) {
                setStatus('VERIFIED');
                addLog(`✅ VERIFIED: ${type} (Confidence: ${result.confidence})`);
            } else {
                setStatus('REJECTED');
                addLog(`❌ REJECTED: ${result.reason} (Confidence: ${result.confidence})`);
            }
        } catch (error) {
            addLog(`Error: ${error}`);
            setStatus('REJECTED');
        }
    };

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    return (
        <div className="text-white">
            {/* <h1 className="text-2xl font-bold mb-2 text-amber-500">🚧 Compliance Gate</h1>
          Removed header as it is now in the Mobile Frame header
      */}
            <p className="text-slate-400 mb-6">Upload evidence to enter the Haul Command Network.</p>

            <div className="space-y-4">
                {/* Amber Lights Section */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <h3 className="font-semibold text-sm flex items-center mb-1">
                        <span className="mr-2">🚨</span> Amber Light Verification
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">Must be visible at 500ft. SAE J845 certified.</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUpload('AMBER_LIGHTS', e.target.files[0])}
                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700"
                    />
                </div>

                {/* Height Pole Section */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-lg flex items-center">
                        <span className="mr-2">📏</span> High Pole Verification
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">Photo of pole extended to 16ft with load mock-up.</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUpload('HIGH_POLE', e.target.files[0])}
                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                </div>

                {/* Reciprocity Check Section */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                    <h3 className="font-semibold text-lg flex items-center mb-1">
                        <span className="mr-2">🗺️</span> Reciprocity Check
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">Verify if your certification is valid for this load.</p>
                    <div className="flex gap-2">
                        <select
                            value={originRecip}
                            onChange={(e) => setOriginRecip(e.target.value)}
                            className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-700 flex-1"
                        >
                            <option value="US-FL">Origin: Florida (FL)</option>
                            <option value="US-WA">Origin: Washington (WA)</option>
                            <option value="US-GA">Origin: Georgia (GA)</option>
                            <option value="US-NY">Origin: New York (NY)</option>
                        </select>
                        <select
                            value={destRecip}
                            onChange={(e) => setDestRecip(e.target.value)}
                            className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-700 flex-1"
                        >
                            <option value="US-GA">Dest: Georgia (GA)</option>
                            <option value="US-NY">Dest: New York (NY)</option>
                            <option value="US-FL">Dest: Florida (FL)</option>
                            <option value="US-WA">Dest: Washington (WA)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleReciprocityCheck}
                        className={`mt-3 w-full text-white text-xs font-bold py-2 rounded transition-colors ${recipStatus?.isAccepted === false ? 'bg-red-600 hover:bg-red-700' :
                            recipStatus?.isAccepted === true ? 'bg-emerald-600 hover:bg-emerald-700' :
                                'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {recipStatus ? (recipStatus.isAccepted ? '✅ PERMITTED' : '❌ PROHIBITED') : 'Verify Certification'}
                    </button>
                    {recipStatus && (
                        <div className={`mt-2 p-2 rounded text-xs border ${recipStatus.isAccepted ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-200' : 'bg-red-900/30 border-red-500/50 text-red-200'
                            }`}>
                            {recipStatus.notes}
                        </div>
                    )}
                </div>
            </div>

            {/* Logs Console */}
            <div className="bg-black p-4 rounded-lg font-mono text-xs h-40 overflow-y-auto border border-green-900/50 shadow-inner">
                {logs.length === 0 && <span className="text-slate-600">System Ready. Waiting for evidence...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="text-green-400">{log}</div>
                ))}
            </div>
        </div>
    );
}
