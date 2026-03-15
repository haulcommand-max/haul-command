'use client'

import { Suspense } from 'react'
import LoginCard from '@/components/auth/LoginCard'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#030712] via-[#0B1120] to-[#030712] p-4">
      <Suspense fallback={
        <div className="w-full max-w-md animate-pulse rounded-[28px] border border-amber-500/20 bg-[#0b1020] p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 h-3 w-24 rounded bg-white/10" />
            <div className="mx-auto h-8 w-48 rounded bg-white/10" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      }>
        <LoginCard />
      </Suspense>
    </div>
  )
}
