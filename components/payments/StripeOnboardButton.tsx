'use client'
import { useState, useEffect } from 'react'

interface Props { operatorId: string; email?: string }

export default function StripeOnboardButton({ operatorId, email }: Props) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/stripe/connect/status?operator_id=${operatorId}`)
      .then(r => r.json()).then(setStatus)
  }, [operatorId])

  const handleOnboard = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/connect/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator_id: operatorId, email }),
    })
    const { url } = await res.json()
    window.location.href = url
  }

  if (status?.charges_enabled) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <span className="text-lg">✓</span>
        <span className="text-sm font-medium">Payments Active</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleOnboard}
      disabled={loading}
      className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
    >
      {loading ? 'Redirecting...' : 'Connect Stripe Payments'}
    </button>
  )
}
