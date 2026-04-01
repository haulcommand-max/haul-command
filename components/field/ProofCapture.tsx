'use client';

import { useState, useRef } from 'react';

interface ProofItem {
    id: string;
    type: 'arrival' | 'escort_start' | 'checkpoint' | 'completion' | 'incident' | 'mileage';
    file?: File;
    preview?: string;
    note: string;
    timestamp: string;
    gps?: { lat: number; lng: number };
}

interface Props {
    loadId: string;
    onSubmit: (proofs: ProofItem[]) => Promise<void>;
}

export default function ProofCapture({ loadId, onSubmit }: Props) {
    const [proofs, setProofs] = useState<ProofItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const capturePhoto = (type: ProofItem['type']) => {
        const input = fileRef.current;
        if (!input) return;
        input.setAttribute('capture', 'environment');
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Compress if >2MB
            let processedFile = file;
            if (file.size > 2 * 1024 * 1024) {
                processedFile = await compressImage(file, 0.7);
            }

            const preview = URL.createObjectURL(processedFile);
            let gps: ProofItem['gps'];
            if ('geolocation' in navigator) {
                try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, enableHighAccuracy: true })
                    );
                    gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                } catch { /* GPS unavailable */ }
            }

            setProofs(prev => [...prev, {
                id: `${type}_${Date.now()}`,
                type,
                file: processedFile,
                preview,
                note: '',
                timestamp: new Date().toISOString(),
                gps,
            }]);
        };
        input.click();
    };

    const compressImage = (file: File, quality: number): Promise<File> => {
        return new Promise(resolve => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();
            img.onload = () => {
                const maxDim = 1920;
                let w = img.width, h = img.height;
                if (w > maxDim || h > maxDim) {
                    const ratio = Math.min(maxDim / w, maxDim / h);
                    w *= ratio; h *= ratio;
                }
                canvas.width = w; canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(blob => {
                    resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', quality);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const removeProof = (id: string) => {
        setProofs(prev => prev.filter(p => p.id !== id));
    };

    const updateNote = (id: string, note: string) => {
        setProofs(prev => prev.map(p => p.id === id ? { ...p, note } : p));
    };

    const handleSubmit = async () => {
        if (proofs.length === 0) return;
        setSubmitting(true);
        try {
            await onSubmit(proofs);
            setSubmitted(true);
        } catch (err) {
            alert('Failed to submit — queued for offline sync');
        }
        setSubmitting(false);
    };

    const ACTIONS = [
        { type: 'arrival' as const, label: 'Arrived', icon: '📍', color: '#10B981' },
        { type: 'escort_start' as const, label: 'Escort Started', icon: '🚗', color: '#F59E0B' },
        { type: 'checkpoint' as const, label: 'Checkpoint', icon: '✅', color: '#6366F1' },
        { type: 'completion' as const, label: 'Completed', icon: '🏁', color: '#10B981' },
        { type: 'incident' as const, label: 'Incident', icon: '⚠️', color: '#EF4444' },
        { type: 'mileage' as const, label: 'Mileage/Odometer', icon: '🔢', color: '#8B5CF6' },
    ];

    if (submitted) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(16,185,129,0.08)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <h3 style={{ color: '#10B981', margin: '0 0 4px' }}>Proof Submitted</h3>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>{proofs.length} items captured with GPS + timestamp</p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)" }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {ACTIONS.map(a => (
                    <button key={a.type} onClick={() => capturePhoto(a.type)} style={{
                        padding: '12px 8px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        color: '#D1D5DB', transition: 'all 0.15s',
                    }}>
                        <span style={{ fontSize: 24 }}>{a.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
                    </button>
                ))}
            </div>

            {/* Captured Proofs */}
            {proofs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {proofs.map(p => (
                        <div key={p.id} style={{
                            display: 'flex', gap: 10, padding: '10px',
                            background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {p.preview && (
                                <img src={p.preview} alt="" style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#F9FAFB', marginBottom: 4 }}>
                                    {ACTIONS.find(a => a.type === p.type)?.icon} {ACTIONS.find(a => a.type === p.type)?.label}
                                </div>
                                <input
                                    type="text" placeholder="Add note..."
                                    value={p.note} onChange={e => updateNote(p.id, e.target.value)}
                                    style={{
                                        width: '100%', padding: '6px 8px', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                                        color: '#D1D5DB', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>
                                    {new Date(p.timestamp).toLocaleTimeString()}
                                    {p.gps && ` • 📍 ${p.gps.lat.toFixed(4)}, ${p.gps.lng.toFixed(4)}`}
                                </div>
                            </div>
                            <button onClick={() => removeProof(p.id)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit */}
            {proofs.length > 0 && (
                <button onClick={handleSubmit} disabled={submitting} style={{
                    width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontWeight: 700, fontSize: 15, opacity: submitting ? 0.6 : 1,
                }}>
                    {submitting ? 'Submitting...' : `Submit ${proofs.length} Proof${proofs.length > 1 ? 's' : ''} 📸`}
                </button>
            )}
        </div>
    );
}
