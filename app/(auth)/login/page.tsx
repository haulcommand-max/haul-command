'use client'

import { Suspense } from 'react'
import LoginCard from '@/components/auth/LoginCard'

export default function LoginPage() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'radial-gradient(circle at 30% 20%, rgba(198, 146, 58, 0.06), transparent 50%), var(--m-bg, #060b12)',
      }}
    >
      <Suspense fallback={
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 28,
            border: '1px solid rgba(198, 146, 58, 0.12)',
            background: 'rgba(14, 17, 24, 0.98)',
            padding: 28,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                borderRadius: 16,
                background: 'rgba(198, 146, 58, 0.08)',
              }}
            />
            <div style={{ height: 12, width: 120, borderRadius: 6, background: 'rgba(255, 255, 255, 0.06)', margin: '0 auto 12px' }} />
            <div style={{ height: 28, width: 200, borderRadius: 8, background: 'rgba(255, 255, 255, 0.06)', margin: '0 auto' }} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 52, borderRadius: 16, background: 'rgba(255, 255, 255, 0.04)' }} />
            ))}
          </div>
        </div>
      }>
        <LoginCard />
      </Suspense>
    </div>
  )
}