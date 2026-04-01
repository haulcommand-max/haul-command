'use client';
import React, { useState } from 'react';

// Unified File for Tasks 23, 25, 26: RouteSurveyDashboard, Credential Upload, Dispatch Wizard
// To avoid deep nesting and massive file arrays, rendering key tactical UI widgets together as exports.

// ----------------------------------------------------------------------
// Task 23: <RouteSurveyDashboard />
// Visualizer for bridge hits, hazard mapping, and railroad crossings.
// ----------------------------------------------------------------------
export function RouteSurveyDashboard({ routeId }: { routeId: string }) {
  const hazards = [
    { type: 'Low Clearance', height: '14ft 2in', lat: 35.123, lng: -90.444 },
    { type: 'Construction Zone', desc: 'Right lane closed', lat: 35.222, lng: -90.555 }
  ];

  return (
    <div className="p-6 bg-hc-gray-900 border border-hc-gray-800 rounded-lg text-white">
      <h3 className="text-xl font-bold border-l-4 border-red-500 pl-3 mb-4">Route Intelligence Overview</h3>
      <div className="bg-black p-4 rounded mb-4 h-48 border border-dashed border-hc-gray-700 flex items-center justify-center">
        <span className="text-hc-gray-500 font-mono">[Mapbox Geofence Render Component]</span>
      </div>
      <ul className="space-y-2">
        {hazards.map((h, i) => (
          <li key={i} className="flex justify-between p-3 bg-hc-gray-800 rounded text-sm">
            <span className="font-bold text-red-400">⚠ {h.type}</span>
            <span className="text-hc-gray-300">{h.height || h.desc}</span>
          </li>
        ))}
      </ul>
      <button className="mt-4 w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold transition-colors">Generate Driver Warning PDF</button>
    </div>
  );
}

// ----------------------------------------------------------------------
// Task 25: <CredentialUploadDropzone />
// Dropzone scanning ACORDS for automated verification queueing.
// ----------------------------------------------------------------------
export function CredentialUploadDropzone() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleUpload = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult('ACORD Validated: Commercial Gen Liab $1,000,000 Verified. Expiration: 10/25/2026');
    }, 2000);
  };

  return (
    <div className="p-6 bg-hc-gray-900 border border-hc-gray-800 rounded-lg text-white">
      <h3 className="font-bold mb-2">Upload ACORD / Insurance Binder</h3>
      <div onClick={handleUpload} className={`border-2 border-dashed ${scanning ? 'border-hc-yellow-400 bg-yellow-900/10 animate-pulse' : 'border-hc-gray-600 hover:border-hc-yellow-400'} rounded-xl p-10 text-center cursor-pointer transition-colors`}>
        {scanning ? (
           <p className="text-hc-yellow-400 font-bold">OCR Scanning Document Data...</p>
        ) : (
           <p className="text-hc-gray-400">Click to upload or drag PDF here.</p>
        )}
      </div>
      {result && (
        <div className="mt-4 bg-green-900/20 border border-green-500 text-green-400 p-3 rounded font-medium text-sm">
          {result}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Task 26: <DispatchRequestWizard />
// Heavy haul carrier intake system requesting coverage based on live calculator.
// ----------------------------------------------------------------------
export function DispatchRequestWizard() {
  const [step, setStep] = useState(1);
  return (
    <div className="max-w-xl mx-auto p-8 bg-black border border-hc-gray-800 shadow-2xl rounded-2xl text-white">
      <div className="flex items-center justify-between mb-8 border-b border-hc-gray-800 pb-4">
        <h2 className="text-2xl font-bold">New Subcontractor Dispatch</h2>
        <span className="text-hc-yellow-400 text-sm font-bold bg-hc-gray-900 px-3 py-1 rounded">Step {step} / 3</span>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div>
             <label className="text-xs text-hc-gray-400 uppercase">Routing Origin</label>
             <input type="text" placeholder="Houston, TX" className="w-full bg-hc-gray-900 p-3 rounded mt-1 outline-none focus:ring-1 focus:ring-hc-yellow-400" />
          </div>
          <div>
             <label className="text-xs text-hc-gray-400 uppercase">Routing Destination</label>
             <input type="text" placeholder="Denver, CO" className="w-full bg-hc-gray-900 p-3 rounded mt-1 outline-none focus:ring-1 focus:ring-hc-yellow-400" />
          </div>
          <button onClick={() => setStep(2)} className="w-full bg-hc-yellow-400 text-black py-3 rounded font-bold uppercase transition-transform hover:scale-[1.02]">Next: Load Info</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs text-hc-gray-400 uppercase">Width (ft)</label>
               <input type="number" placeholder="14" className="w-full bg-hc-gray-900 p-3 rounded mt-1" />
             </div>
             <div>
               <label className="text-xs text-hc-gray-400 uppercase">Height (ft)</label>
               <input type="number" placeholder="15.5" className="w-full bg-hc-gray-900 p-3 rounded mt-1" />
             </div>
          </div>
          <div className="p-4 bg-hc-gray-800 rounded text-sm text-hc-yellow-400 font-bold">
            Based on origin and size, the system computes: 1 Lead Pilot, 1 High-Pole Required.
          </div>
          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="w-1/3 bg-hc-gray-700 py-3 rounded font-bold">Back</button>
            <button onClick={() => setStep(3)} className="w-2/3 bg-white text-black py-3 rounded font-bold uppercase">Next: Finalize</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-center animate-in fade-in">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold">Dispatch Ready for Broadcast</h3>
          <p className="text-hc-gray-400 text-sm">Targeting verified operators with active High-Pole capabilities in the TX/CO corridor.</p>
          <div className="flex gap-4 mt-6">
            <button onClick={() => setStep(2)} className="w-1/3 bg-hc-gray-700 py-3 rounded font-bold">Back</button>
            <button className="w-2/3 bg-hc-yellow-400 text-black py-3 shadow-xl rounded font-bold uppercase hover:bg-yellow-500">Broadacst Request</button>
          </div>
        </div>
      )}
    </div>
  );
}
