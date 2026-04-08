'use client';
/**
 * components/trust/DocumentStatusList.tsx
 * Haul Command — Drag-and-drop document upload + status tracker
 *
 * Shows: Pending / Verified / Rejected states per document type
 * Supports: mobile-first drag-and-drop upload
 * Wires to: /api/documents/upload
 */

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';

type DocStatus = 'missing' | 'pending' | 'verified' | 'rejected' | 'expiring';

interface DocumentRequirement {
  key: string;
  label: string;
  description: string;
  required: boolean;
  status: DocStatus;
  expiresAt?: string;
  rejectionReason?: string;
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: string; bgColor: string }> = {
  missing:  { label: 'Missing',  color: 'text-gray-500',   icon: '○', bgColor: 'bg-gray-500/10 border-gray-500/20' },
  pending:  { label: 'Pending Review', color: 'text-amber-400', icon: '⏳', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  verified: { label: 'Verified', color: 'text-green-400',  icon: '✓', bgColor: 'bg-green-500/10 border-green-500/20' },
  rejected: { label: 'Rejected', color: 'text-red-400',    icon: '✕', bgColor: 'bg-red-500/10 border-red-500/20' },
  expiring: { label: 'Expiring Soon', color: 'text-orange-400', icon: '⚠', bgColor: 'bg-orange-500/10 border-orange-500/20' },
};

interface Props {
  documents: DocumentRequirement[];
  onUploadComplete?: (key: string) => void;
}

function UploadZone({ docKey, label, onUpload }: {
  docKey: string;
  label: string;
  onUpload: (file: File, key: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      setUploading(true);
      await onUpload(file, docKey);
      setUploading(false);
    },
    [docKey, onUpload]
  );

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      await onUpload(file, docKey);
      setUploading(false);
    },
    [docKey, onUpload]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
        dragging
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-white/15 bg-white/3 hover:border-white/30'
      }`}
      role="button"
      aria-label={`Upload ${label}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={handleChange}
      />
      {uploading ? (
        <p className="text-xs text-amber-400 font-medium">Uploading…</p>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            <span className="text-white font-medium">Tap to upload</span> or drag &amp; drop
          </p>
          <p className="text-xs text-gray-600 mt-0.5">PDF, JPG, PNG — max 10MB</p>
        </>
      )}
    </div>
  );
}

export default function DocumentStatusList({ documents, onUploadComplete }: Props) {
  const [docs, setDocs] = useState(documents);

  const handleUpload = async (file: File, docKey: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docKey);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setDocs((prev) =>
          prev.map((d) => (d.key === docKey ? { ...d, status: 'pending' } : d))
        );
        onUploadComplete?.(docKey);
      }
    } catch (err) {
      console.error('[DocumentStatusList] upload error', err);
    }
  };

  const required = docs.filter((d) => d.required);
  const optional = docs.filter((d) => !d.required);
  const verifiedCount = docs.filter((d) => d.status === 'verified').length;
  const totalRequired = required.length;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Document Verification</p>
          <p className="text-xs text-gray-400">{verifiedCount} / {totalRequired} required verified</p>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${totalRequired > 0 ? (verifiedCount / totalRequired) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Required documents */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Required</p>
        <div className="space-y-3">
          {required.map((doc) => {
            const cfg = STATUS_CONFIG[doc.status];
            return (
              <div
                key={doc.key}
                className={`rounded-xl border p-4 ${cfg.bgColor}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-lg mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{doc.label}</p>
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                    {doc.status === 'rejected' && doc.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1.5 font-medium">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                    {doc.expiresAt && (
                      <p className="text-xs text-orange-400 mt-1">
                        Expires: {new Date(doc.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                    {(doc.status === 'missing' || doc.status === 'rejected') && (
                      <div className="mt-3">
                        <UploadZone
                          docKey={doc.key}
                          label={doc.label}
                          onUpload={handleUpload}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional documents */}
      {optional.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Optional (Boost Trust Score)</p>
          <div className="space-y-3">
            {optional.map((doc) => {
              const cfg = STATUS_CONFIG[doc.status];
              return (
                <div key={doc.key} className={`rounded-xl border p-4 ${cfg.bgColor}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{doc.label}</p>
                        <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                      {doc.status === 'missing' && (
                        <div className="mt-3">
                          <UploadZone docKey={doc.key} label={doc.label} onUpload={handleUpload} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
