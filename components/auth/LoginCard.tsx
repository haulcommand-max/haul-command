'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type OAuthProvider = 'google' | 'apple' | 'facebook' | 'linkedin_oidc'
type LoginBlock = OAuthProvider | 'phone' | 'email'

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  facebook: 'Continue with Facebook',
  linkedin_oidc: 'Continue with LinkedIn',
}

function shouldShowAppleFirst(userAgent: string) {
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|FxiOS|Edg|OPR|SamsungBrowser/i.test(userAgent)
  const isMacSafari = /Macintosh/i.test(userAgent) && isSafari

  return isIOS || isMacSafari
}

function getLoginOrder(appleFirst: boolean): LoginBlock[] {
  return appleFirst
    ? ['apple', 'google', 'facebook', 'phone', 'linkedin_oidc', 'email']
    : ['google', 'apple', 'facebook', 'phone', 'linkedin_oidc', 'email']
}

export default function LoginCard() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [appleFirst, setAppleFirst] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setAppleFirst(shouldShowAppleFirst(navigator.userAgent))
    }
  }, [])

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'auth_callback_failed') {
      setError('We could not complete sign-in. Please try again.')
    }
  }, [searchParams])

  const loginOrder = useMemo(() => getLoginOrder(appleFirst), [appleFirst])

  function resetFeedback() {
    setMessage(null)
    setError(null)
  }

  async function signInWithProvider(provider: OAuthProvider) {
    try {
      resetFeedback()
      setLoading(provider)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err?.message ?? 'Unable to start social sign-in.')
    } finally {
      setLoading(null)
    }
  }

  async function sendPhoneOtp(e: React.FormEvent) {
    e.preventDefault()

    try {
      resetFeedback()
      setLoading('phone-send')

      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
        },
      })

      if (error) throw error

      setPhoneCodeSent(true)
      setMessage('We sent a one-time code to your phone.')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to send phone code.')
    } finally {
      setLoading(null)
    }
  }

  async function verifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault()

    try {
      resetFeedback()
      setLoading('phone-verify')

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otpCode,
        type: 'sms',
      })

      if (error) throw error

      setMessage('Phone verified. Signing you in...')
      router.refresh()
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.message ?? 'Invalid code. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()

    try {
      resetFeedback()
      setLoading('email')

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage('Check your email for the magic link.')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to send magic link.')
    } finally {
      setLoading(null)
    }
  }

  function renderOAuthButton(provider: OAuthProvider) {
    const isGoogle = provider === 'google'

    return (
      <button
        key={provider}
        type="button"
        onClick={() => signInWithProvider(provider)}
        disabled={loading !== null}
        className={
          isGoogle
            ? 'w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60'
            : 'w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        {loading === provider ? 'Connecting...' : PROVIDER_LABELS[provider]}
      </button>
    )
  }

  function renderPhoneBlock() {
    return (
      <div key="phone" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold text-white">Continue with Phone</div>
          <div className="mt-1 text-xs text-white/60">
            Use your full number with country code, for example +14155550123
          </div>
        </div>

        <form onSubmit={phoneCodeSent ? verifyPhoneOtp : sendPhoneOtp} className="space-y-3">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+14155550123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none"
          />

          {phoneCodeSent && (
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none"
            />
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading !== null || !phone || (phoneCodeSent && !otpCode)}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading === 'phone-send'
                ? 'Sending code...'
                : loading === 'phone-verify'
                ? 'Verifying...'
                : phoneCodeSent
                ? 'Verify Code'
                : 'Send Phone Code'}
            </button>

            {phoneCodeSent && (
              <button
                type="button"
                onClick={() => {
                  setPhoneCodeSent(false)
                  setOtpCode('')
                  resetFeedback()
                }}
                disabled={loading !== null}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  function renderEmailBlock() {
    return (
      <div key="email" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold text-white">Continue with Magic Link</div>
          <div className="mt-1 text-xs text-white/60">
            We will email you a secure sign-in link.
          </div>
        </div>

        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none"
          />

          <button
            type="submit"
            disabled={loading !== null || !email}
            className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === 'email' ? 'Sending link...' : 'Send Magic Link'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-[28px] border border-amber-500/20 bg-[#0b1020] p-6 shadow-2xl">
      <div className="mb-6 text-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
          Haul Command
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
        <p className="mt-2 text-sm text-white/65">
          Sign in the way that feels most natural on your device
        </p>
      </div>

      <div className="space-y-3">
        {loginOrder.map((block) => {
          if (block === 'phone') return renderPhoneBlock()
          if (block === 'email') return renderEmailBlock()
          return renderOAuthButton(block)
        })}
      </div>

      {(message || error) && (
        <div className="mt-4">
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      <p className="mt-5 text-center text-xs text-white/45">
        By continuing, you agree to Haul Command&apos;s Terms and Privacy Policy.
      </p>
    </div>
  )
}
