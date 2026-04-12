'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

const PROVIDER_ICONS: Record<OAuthProvider, React.ReactNode> = {
  google: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  apple: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  ),
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  linkedin_oidc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
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
  // All 4 OAuth providers always visible above fold
  return appleFirst
    ? ['apple', 'google', 'facebook', 'linkedin_oidc', 'phone', 'email']
    : ['facebook', 'google', 'linkedin_oidc', 'apple', 'phone', 'email']
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
  const [enabledProviders, setEnabledProviders] = useState<Set<string> | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setAppleFirst(shouldShowAppleFirst(navigator.userAgent))
    }
  }, [])

  // Fetch which providers are actually enabled in Supabase Auth
  useEffect(() => {
    async function checkProviders() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
          { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } }
        )
        if (res.ok) {
          const data = await res.json()
          const ext = data?.external ?? {}
          const enabled = new Set<string>()
          if (ext.google) enabled.add('google')
          if (ext.apple) enabled.add('apple')
          if (ext.facebook) enabled.add('facebook')
          if (ext.linkedin_oidc || ext.linkedin) enabled.add('linkedin_oidc')
          setEnabledProviders(enabled)
        }
      } catch {
        // If we can't check, show all (fail-open for UX)
        setEnabledProviders(null)
      }
    }
    checkProviders()
  }, [])

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'auth_callback_failed') {
      setError('We could not complete sign-in. Please try again.')
    }
  }, [searchParams])

  const loginOrder = useMemo(() => getLoginOrder(appleFirst), [appleFirst])

  // Only show providers that are actually enabled in Supabase Auth
  // If enabledProviders hasn't loaded yet (null), show all to avoid flash
  const allOAuth = loginOrder.filter((b): b is OAuthProvider =>
    b !== 'phone' && b !== 'email'
  )
  const topProviders = enabledProviders
    ? allOAuth.filter(p => enabledProviders.has(p))
    : allOAuth.slice(0, 4)

  const disabledProviders = enabledProviders
    ? allOAuth.filter(p => !enabledProviders.has(p))
    : []

  const moreProviders = loginOrder.filter((b): b is OAuthProvider =>
    b !== 'phone' && b !== 'email'
  ).slice(4)

  function resetFeedback() {
    setMessage(null)
    setError(null)
  }

  async function signInWithProvider(provider: OAuthProvider) {
    try {
      resetFeedback()
      setLoading(provider)

      const returnUrl = searchParams.get('return') || '/app'
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`,
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

      const returnUrl = searchParams.get('return') || '/app'
      setMessage('Phone verified. Signing you in...')
      router.refresh()
      window.location.href = returnUrl
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

      const returnUrl = searchParams.get('return') || '/app'
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`,
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

      {/* Primary OAuth buttons — only enabled providers */}
      <div style={{ display: 'grid', gap: 10 }}>
        {topProviders.map((provider) => {
          const isGoogle = provider === 'google'
          return (
            <button aria-label="Interactive Button"
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

        {/* Disabled providers — visible but inactive */}
        {disabledProviders.map((provider) => (
          <div
            key={provider}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.04)',
              background: 'rgba(255, 255, 255, 0.02)',
              color: 'rgba(255, 255, 255, 0.25)',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'default',
            }}
          >
            <span style={{ fontSize: 18, opacity: 0.4 }}>{PROVIDER_ICONS[provider]}</span>
            {PROVIDER_LABELS[provider].replace('Continue with', '')} — Coming Soon
          </div>
        ))}
      </div>

      {/* More options toggle */}
      <button aria-label="Interactive Button"
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
            <button aria-label="Interactive Button"
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
                <button aria-label="Interactive Button"
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
                  <button aria-label="Interactive Button"
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

              <button aria-label="Interactive Button"
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
