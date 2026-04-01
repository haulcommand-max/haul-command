'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import LoginCard from '@/components/auth/LoginCard'

/**
 * /auth/register — Registration page
 *
 * Supabase OTP-based auth creates accounts automatically for new users,
 * so registration and login share the same LoginCard component.
 * This page preserves query params (plan, intent) and presents
 * signup-oriented copy instead of "Welcome back".
 *
 * Routes here:
 *   /auth/register
 *   /auth/register?plan=pro
 *   /auth/register?plan=elite
 *   /auth/register?plan=broker
 *   /auth/register?intent=claim
 */

function RegisterContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const intent = searchParams.get('intent')

  // Determine contextual heading
  let heading = 'Create Your Free Account'
  let subheading = 'Sign up to access the world\'s largest heavy haul network — 120 countries, escrow-protected payments, verified operators.'

  if (intent === 'claim') {
    heading = 'Sign Up to Claim Your Listing'
    subheading = 'Create an account to claim and verify your operator profile. It takes less than 2 minutes.'
  } else if (plan === 'pro') {
    heading = 'Start Your Pro Plan'
    subheading = 'Create your account first, then you\'ll be directed to complete your Pro subscription.'
  } else if (plan === 'elite') {
    heading = 'Start Your Elite Plan'
    subheading = 'Create your account first, then you\'ll be directed to complete your Elite subscription.'
  } else if (plan === 'broker') {
    heading = 'Start Your Broker Seat'
    subheading = 'Create your account first, then you\'ll be directed to set up your broker dashboard.'
  } else if (plan === 'basic') {
    heading = 'Create Your Free Account'
    subheading = 'Get listed on the world\'s largest heavy haul directory. No credit card required.'
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'radial-gradient(circle at 30% 20%, rgba(198, 146, 58, 0.06), transparent 50%), var(--m-bg, #060b12)',
      }}
    >
      {/* Contextual heading above the login card */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 20,
          maxWidth: 420,
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            fontWeight: 900,
            color: '#f5f7fb',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: '0 0 8px',
          }}
        >
          {heading}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: '#8f97a7',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {subheading}
        </p>
      </div>

      <LoginCard />

      {/* "Already have an account?" link */}
      <p
        style={{
          marginTop: 16,
          textAlign: 'center',
          fontSize: 13,
          color: '#8f97a7',
        }}
      >
        Already have an account?{' '}
        <a
          href="/login"
          style={{
            color: '#C6923A',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Sign in
        </a>
      </p>
    </div>
  )
}

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
      <RegisterContent />
    </Suspense>
  )
}
