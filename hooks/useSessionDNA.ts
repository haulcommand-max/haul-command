'use client';

import { useEffect, useRef } from 'react';

/**
 * HAUL COMMAND - SESSION DNA EXTRACTOR
 * Silently extracts hardware signatures without blocking render.
 */
export function useSessionDNA() {
  const hasExtracted = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasExtracted.current) return;
    
    // Defer execution so we don't block the main thread
    const extractDNA = () => {
      try {
        const hardwareConcurrency = navigator.hardwareConcurrency || 0;
        const deviceMemory = (navigator as any).deviceMemory || 0;
        const screenResolution = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        
        // 1. Canvas Fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let canvasHash = 'unsupported';
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('HaulCommand-DNA-v1: 2026', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('AntiGravity Defense', 4, 17);
          // Simplified quick hash of canvas data
          canvasHash = btoa(canvas.toDataURL().slice(-100)).substring(0, 32);
        }

        // 2. WebGL Fingerprint
        let webglHash = 'unsupported';
        try {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (ext) {
              const vendor = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
              const renderer = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
              webglHash = btoa(`${vendor}::${renderer}`);
            }
          }
        } catch (e) {}

        const payload = {
          user_agent: navigator.userAgent,
          canvas_fingerprint: canvasHash,
          webgl_fingerprint: webglHash,
          fonts_hash: 'not_collected', // Omitted for speed
          screen_resolution: screenResolution,
          hardware_concurrency: hardwareConcurrency,
          device_memory: deviceMemory,
        };

        // Fire & Forget to Edge route
        fetch('/api/defense/dna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});

        hasExtracted.current = true;
      } catch (err) {
        console.error('Core telemetry extraction prevented:', err);
      }
    };

    // Use requestIdleCallback if available, fallback to setTimeout so we don't block LCP
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(extractDNA);
    } else {
      setTimeout(extractDNA, 2000);
    }
  }, []);
}
