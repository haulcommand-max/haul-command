'use client';
import { useState } from 'react';

export default function DisputeEvidenceUploader({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setLoading(true);
    // Simulating file upload to storage bucket
    setTimeout(() => {
      setLoading(false);
      alert('Dispute evidence safely escrowed. Mediation team notified.');
    }, 1500);
  };

  return (
    <div className="p-4 border border-red-500/30 bg-red-950/20 rounded-xl mt-4">
      <h3 className="text-red-400 font-bold mb-2">Raise Escrow Dispute</h3>
      <p className="text-sm text-gray-400 mb-4">Upload BOL/POD or geofencing logs to mediate platform payment release.</p>
      <input type="file" multiple accept="image/*,.pdf" onChange={handleUpload} className="hidden" id="evidence-upload" />
      <label htmlFor="evidence-upload" className="inline-block px-4 py-2 bg-red-900/40 hover:bg-red-800 text-red-200 rounded cursor-pointer transition-colors text-sm font-semibold">
        {loading ? 'Securing Evidence...' : 'Upload Evidence (BOL/POD)'}
      </label>
    </div>
  );
}
