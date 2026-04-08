'use client';

import { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl?: string | null;
  onProgress?: (percent: number) => void;
}

export function VideoPlayer({ lessonId, videoUrl, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [offline, setOffline] = useState(false);
  const reportedComplete = useRef(false);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = Math.floor((v.currentTime / v.duration) * 100);
    setProgress(pct);
    if (pct >= 90 && !reportedComplete.current) {
      reportedComplete.current = true;
      onProgress?.(pct);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const seek = (pct: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = (pct / 100) * duration;
  };

  const changeSpeed = (s: number) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // If no video URL, show a high-end Masterclass-style fallback with geometric placeholder
  if (!videoUrl) {
    return (
      <div style={{
        position: 'relative',
        background: 'linear-gradient(rgba(5,5,8,0.7), rgba(17,17,22,0.9)), url(/training-video-placeholder.png) center/cover no-repeat',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        aspectRatio: '16/9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: '#8a8a9e',
        fontSize: 16,
        textAlign: 'center',
        padding: 32,
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Abstract background grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        {/* Glowing orb */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(212,168,68,0.08) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', marginBottom: 8, zIndex: 1
        }}>
          <span style={{ fontSize: 32, opacity: 0.7 }}>🎬</span>
        </div>

        <div style={{ zIndex: 1 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.02em' }}>
            Production Pending
          </h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 360, color: '#9ca3af' }}>
            This training video is currently being processed. You can bypass the video and read the exact transcript and instructions below.
          </p>
        </div>

        <button aria-label="Interactive Button"
          onClick={() => onProgress?.(100)}
          style={{
            zIndex: 1, marginTop: 16, padding: '12px 28px', borderRadius: 12,
            background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.3)',
            color: '#D4A844', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            transition: 'all 0.2s ease', letterSpacing: '0.04em', textTransform: 'uppercase'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(212,168,68,0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(212,168,68,0.1)'; }}
        >
          Skip Video & Mark Read
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000', position: 'relative' }}>
      {offline && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.9)', color: '#fff', padding: '6px 16px',
          borderRadius: 20, fontSize: 12, fontWeight: 700, zIndex: 10,
        }}>
          ⚠️ You're offline — video may not load
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        style={{ width: '100%', display: 'block' }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        data-lesson-id={lessonId}
      />

      {/* Controls */}
      <div style={{
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
        padding: '16px 16px 12px',
      }}>
        {/* Progress bar */}
        <div
          style={{
            height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2,
            cursor: 'pointer', marginBottom: 12, position: 'relative',
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            seek(pct);
          }}
        >
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #F5A623, #FFD700)',
            borderRadius: 2, transition: 'width 0.1s',
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Play/pause */}
          <button aria-label="Interactive Button" onClick={togglePlay} style={{
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: 20, padding: '2px 6px',
          }}>
            {playing ? '⏸' : '▶'}
          </button>

          {/* Time */}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime((progress / 100) * duration)} / {formatTime(duration)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Speed */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[0.75, 1, 1.25, 1.5].map(s => (
              <button aria-label="Interactive Button"
                key={s}
                onClick={() => changeSpeed(s)}
                style={{
                  background: speed === s ? '#F5A623' : 'rgba(255,255,255,0.1)',
                  color: speed === s ? '#000' : '#fff',
                  border: 'none', borderRadius: 4,
                  padding: '3px 7px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* CC placeholder */}
          <button aria-label="Interactive Button" style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            borderRadius: 4, padding: '3px 7px', fontSize: 11, cursor: 'pointer',
          }}>
            CC
          </button>
        </div>
      </div>
    </div>
  );
}
