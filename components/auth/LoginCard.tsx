'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { LOGO_MARK_SRC, ALT_TEXT, TAGLINE_SHORT } from '@/lib/config/brand'

type OAuthProvider = 'google' | 'apple' | 'facebook' | 'linkedin_oidc'
type LoginBlock = OAuthProvider | 'phone' | 'email'

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  facebook: 'Continue with Facebook',
  linkedin_oidc: 'Continue with LinkedIn',
}

const PROVIDER_ICONS: Record<OAuthProvider, string> = {
  google: '🔍',
  apple: '🍎',
  facebook: '📘',
  linkedin_oidc: '💼',
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
  const [showMore, setShowMore] = useState(false)

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

  // Top 3 providers shown immediately, rest behind "More options"
  const topProviders = loginOrder.filter((b): b is OAuthProvider =>
    b !== 'phone' && b !== 'email'
  ).slice(0, 3)

  const moreProviders = loginOrder.filter((b): b is OAuthProvider =>
    b !== 'phone' && b !== 'email'
  ).slice(3)

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
      window.location.href = '/home'
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

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 420,
        borderRadius: 24,
        border: '1px solid rgba(198, 146, 58, 0.18)',
        background: 'linear-gradient(170deg, rgba(14, 17, 24, 0.98), rgba(8, 10, 16, 0.96))',
        boxShadow: '0 24px 80px -12px rgba(0, 0, 0, 0.65), 0 0 40px -8px rgba(198, 146, 58, 0.08)',
        padding: 'clamp(20px, 4vw, 28px)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Gold accent stripe at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, rgba(198, 146, 58, 0.6), var(--hc-gold-400, #C6923A), rgba(198, 146, 58, 0.6))',
        }}
      />

      {/* Brand header — compact for mobile */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 3vw, 28px)' }}>
        <div
          style={{
            width: 48,
            height: 48,
            margin: '0 auto clamp(10px, 2vw, 16px)',
            borderRadius: 14,
            background: 'rgba(198, 146, 58, 0.1)',
            border: '1px solid rgba(198, 146, 58, 0.16)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Image
            src={LOGO_MARK_SRC}
            alt={ALT_TEXT}
            width={32}
            height={32}
            priority
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--hc-gold-400, #C6923A)',
            marginBottom: 8,
          }}
        >
          {TAGLINE_SHORT}
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
            fontWeight: 900,
            color: 'var(--m-text-primary, #f5f7fb)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: '0 0 6px',
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--m-text-muted, #8f97a7)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Sign in the way that works best on your device
        </p>
      </div>

      {/* Primary OAuth buttons */}
      <div style={{ display: 'grid', gap: 10 }}>
        {topProviders.map((provider) => {
          const isGoogle = provider === 'google'
          return (
            <button
              key={provider}
              type="button"
              onClick={() => signInWithProvider(provider)}
              disabled={loading !== null}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 16,
                border: isGoogle
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: isGoogle
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.06)',
                color: isGoogle ? '#1a1a1a' : 'var(--m-text-primary, #f5f7fb)',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null && loading !== provider ? 0.5 : 1,
                transition: 'all 160ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>{PROVIDER_ICONS[provider]}</span>
              {loading === provider ? 'Connecting...' : PROVIDER_LABELS[provider]}
            </button>
          )
        })}
      </div>

      {/* More options toggle */}
      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        style={{
          width: '100%',
          margin: '16px 0 0',
          padding: '10px 0',
          background: 'none',
          border: 'none',
          color: 'var(--m-text-muted, #8f97a7)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {showMore ? 'Fewer options' : 'More sign-in options'}
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 200ms ease',
            transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
            fontSize: 10,
          }}
        >
          ▼
        </span>
      </button>

      {/* Expanded: remaining providers + phone + email */}
      {showMore && (
        <div
          style={{
            display: 'grid',
            gap: 10,
            marginTop: 4,
            animation: 'fadeIn 200ms ease',
          }}
        >
          {/* Extra OAuth providers */}
          {moreProviders.map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => signInWithProvider(provider)}
              disabled={loading !== null}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--m-text-primary, #f5f7fb)',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null ? 0.5 : 1,
                transition: 'all 160ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>{PROVIDER_ICONS[provider]}</span>
              {loading === provider ? 'Connecting...' : PROVIDER_LABELS[provider]}
            </button>
          ))}

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '4px 0',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--m-text-muted, #8f97a7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />
          </div>

          {/* Phone OTP block */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)' }}>
              Phone sign-in
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--m-text-muted, #8f97a7)', lineHeight: 1.5 }}>
              Full number with country code, e.g. +14155550123
            </div>
            <form onSubmit={phoneCodeSent ? verifyPhoneOtp : sendPhoneOtp} style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+14155550123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--m-text-primary, #f5f7fb)',
                  padding: '0 14px',
                  fontSize: 15,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
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
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--m-text-primary, #f5f7fb)',
                    padding: '0 14px',
                    fontSize: 15,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  disabled={loading !== null || !phone || (phoneCodeSent && !otpCode)}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 14,
                    border: 'none',
                    background: 'var(--hc-gold-400, #C6923A)',
                    color: '#0a0a0f',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: loading !== null ? 'not-allowed' : 'pointer',
                    opacity: (loading !== null || !phone) ? 0.5 : 1,
                    transition: 'all 160ms ease',
                  }}
                >
                  {loading === 'phone-send'
                    ? 'Sending...'
                    : loading === 'phone-verify'
                    ? 'Verifying...'
                    : phoneCodeSent
                    ? 'Verify Code'
                    : 'Send Code'}
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
                    style={{
                      height: 48,
                      padding: '0 16px',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: 'var(--m-text-primary, #f5f7fb)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Magic link block */}
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)' }}>
              Magic link
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--m-text-muted, #8f97a7)', lineHeight: 1.5 }}>
              We&apos;ll email you a secure sign-in link.
            </div>
            <form onSubmit={sendMagicLink} style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--m-text-primary, #f5f7fb)',
                  padding: '0 14px',
                  fontSize: 15,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />

              <button
                type="submit"
                disabled={loading !== null || !email}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  border: 'none',
                  background: 'var(--hc-gold-400, #C6923A)',
                  color: '#0a0a0f',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: (loading !== null || !email) ? 0.5 : 1,
                  transition: 'all 160ms ease',
                }}
              >
                {loading === 'email' ? 'Sending link...' : 'Send Magic Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {(message || error) && (
        <div style={{ marginTop: 16 }}>
          {message && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.18)',
                color: '#86EFAC',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          )}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.18)',
                color: '#FCA5A5',
                fontSize: 13,
                lineHeight: 1.5,
                marginTop: message ? 8 : 0,
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {/* Legal footer */}
      <p
        style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--m-text-muted, #8f97a7)',
          lineHeight: 1.6,
          opacity: 0.7,
        }}
      >
        By continuing, you agree to Haul Command&apos;s Terms and Privacy Policy.
      </p>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
