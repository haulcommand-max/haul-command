'use client';

import { useState, useRef, useCallback } from 'react';

interface ParsedCert {
  document_type?: string;
  insured_name?: string;
  company?: string;
  policy_number?: string;
  carrier?: string;
  coverage_type?: string;
  coverage_amount_usd?: number;
  effective_date?: string;
  expiry_date?: string;
  dot_number?: string;
  license_number?: string;
  valid?: boolean;
  days_until_expiry?: number;
  issues?: string[];
  raw_text_excerpt?: string;
  model?: string;
  latency_ms?: number;
}

interface CertificateUploaderProps {
  onParsed?: (data: ParsedCert) => void;
  label?: string;
}

export default function CertificateUploader({ onParsed, label = 'Upload Certificate or Credential' }: CertificateUploaderProps) {
  const [result, setResult] = useState<ParsedCert | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip data URL prefix
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/content/parse-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          mime_type: file.type || 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setResult(data);
      onParsed?.(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const validityColor = result?.valid === true ? 'text-green-400' : result?.valid === false ? 'text-red-400' : 'text-gray-400';
  const validityLabel = result?.valid === true ? '✔ Valid' : result?.valid === false ? '✗ Invalid / Expired' : '—';

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <img src={previewUrl} alt="Document preview" className="max-h-40 mx-auto rounded-lg object-contain" />
        ) : (
          <div>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-medium text-gray-300">{label}</p>
            <p className="text-xs text-gray-600 mt-1">Drop image or PDF here, or click to browse</p>
            <p className="text-xs text-gray-700 mt-1">Insurance cert, DOT authority, CDL, operator credential</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
              <p className="text-sm text-blue-400">👁️ Gemini is reading the document...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-xs text-red-400">✗ {error}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Document Parsed</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${validityColor}`}>{validityLabel}</span>
              {result.days_until_expiry !== undefined && result.days_until_expiry !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  result.days_until_expiry < 0 ? 'bg-red-500/20 text-red-400' :
                  result.days_until_expiry < 30 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {result.days_until_expiry < 0
                    ? `Expired ${Math.abs(result.days_until_expiry)}d ago`
                    : `${result.days_until_expiry}d left`
                  }
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {result.insured_name && (
              <div>
                <p className="text-xs text-gray-500">Insured</p>
                <p className="font-medium text-white">{result.insured_name}</p>
              </div>
            )}
            {result.company && (
              <div>
                <p className="text-xs text-gray-500">Company</p>
                <p className="font-medium text-white">{result.company}</p>
              </div>
            )}
            {result.carrier && (
              <div>
                <p className="text-xs text-gray-500">Carrier</p>
                <p className="font-medium text-white">{result.carrier}</p>
              </div>
            )}
            {result.policy_number && (
              <div>
                <p className="text-xs text-gray-500">Policy #</p>
                <p className="font-mono text-xs text-gray-300">{result.policy_number}</p>
              </div>
            )}
            {result.coverage_type && (
              <div>
                <p className="text-xs text-gray-500">Coverage type</p>
                <p className="font-medium text-white">{result.coverage_type}</p>
              </div>
            )}
            {result.coverage_amount_usd && (
              <div>
                <p className="text-xs text-gray-500">Coverage amount</p>
                <p className="font-medium text-white">${result.coverage_amount_usd.toLocaleString()}</p>
              </div>
            )}
            {result.effective_date && (
              <div>
                <p className="text-xs text-gray-500">Effective</p>
                <p className="font-medium text-white">{result.effective_date}</p>
              </div>
            )}
            {result.expiry_date && (
              <div>
                <p className="text-xs text-gray-500">Expires</p>
                <p className={`font-medium ${result.valid ? 'text-green-400' : 'text-red-400'}`}>{result.expiry_date}</p>
              </div>
            )}
            {result.dot_number && (
              <div>
                <p className="text-xs text-gray-500">DOT #</p>
                <p className="font-mono text-xs text-amber-400">{result.dot_number}</p>
              </div>
            )}
            {result.document_type && (
              <div>
                <p className="text-xs text-gray-500">Document type</p>
                <p className="text-xs text-gray-300 capitalize">{result.document_type.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          {/* Issues */}
          {result.issues && result.issues.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400 font-bold mb-1">⚠️ Issues detected</p>
              <ul className="space-y-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-amber-300">• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button aria-label="Interactive Button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 rounded-lg transition-colors"
            >
              Upload different document
            </button>
            {result.model && (
              <span className="text-xs text-gray-700 self-center ml-auto">
                {result.model} · {result.latency_ms ? `${(result.latency_ms / 1000).toFixed(1)}s` : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
