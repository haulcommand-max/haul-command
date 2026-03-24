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

  // If no video URL, show placeholder with proper messaging
  if (!videoUrl) {
    return (
      <div style={{
        background: 'linear-gradient(160deg, #111120 0%, #0c0c18 100%)',
        border: '1px solid rgba(245,166,35,0.15)',
        borderRadius: 16,
        aspectRatio: '16/9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: '#6a6a7a',
        fontSize: 15,
        textAlign: 'center',
        padding: 32,
      }}>
        <div style={{ fontSize: 40 }}>🎬</div>
        <div style={{ fontWeight: 700, color: '#e8e8e8' }}>Video Coming Soon</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 300 }}>
          This video lesson is in production. Read the text content below to complete this lesson.
        </div>
        <button
          onClick={() => onProgress?.(100)}
          style={{
            marginTop: 8, padding: '10px 20px', borderRadius: 8,
            background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)',
            color: '#F5A623', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Mark as Watched →
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
          <button onClick={togglePlay} style={{
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
              <button
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
          <button style={{
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
