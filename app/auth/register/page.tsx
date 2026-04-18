import { Suspense } from 'react'
import RegisterClient from './RegisterClient'

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            minHeight: '100dvh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--m-bg, #060b12)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              padding: 28,
              borderRadius: 28,
              border: '1px solid rgba(198, 146, 58, 0.12)',
              background: 'rgba(14, 17, 24, 0.98)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 16px',
                  borderRadius: 16,
                  background: 'rgba(198, 146, 58, 0.08)',
                }}
              />
              <div style={{ height: 12, width: 180, borderRadius: 6, background: 'rgba(255, 255, 255, 0.06)', margin: '0 auto 12px' }} />
              <div style={{ height: 28, width: 240, borderRadius: 8, background: 'rgba(255, 255, 255, 0.06)', margin: '0 auto' }} />
            </div>
          </div>
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  )
}