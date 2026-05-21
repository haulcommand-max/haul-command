'use client'

import { useMemo, useState } from 'react'

const STATE_FEES = [
  { code: 'TX', name: 'Texas', base: 30, mile: 0.24, escortAt: 10 },
  { code: 'CA', name: 'California', base: 42, mile: 0.14, escortAt: 12 },
  { code: 'FL', name: 'Florida', base: 44, mile: 0.22, escortAt: 12 },
  { code: 'LA', name: 'Louisiana', base: 35, mile: 0.19, escortAt: 12 },
  { code: 'OH', name: 'Ohio', base: 20, mile: 0.12, escortAt: 10 },
  { code: 'PA', name: 'Pennsylvania', base: 37, mile: 0.25, escortAt: 12 },
]

export function PermitCostPlanner() {
  const [stateCode, setStateCode] = useState('TX')
  const [width, setWidth] = useState('12')
  const [height, setHeight] = useState('14')
  const [weight, setWeight] = useState('80000')
  const [miles, setMiles] = useState('250')

  const estimate = useMemo(() => {
    const state = STATE_FEES.find((item) => item.code === stateCode) || STATE_FEES[0]
    const routeMiles = Math.max(0, Number(miles) || 0)
    const loadWidth = Math.max(0, Number(width) || 0)
    const loadHeight = Math.max(0, Number(height) || 0)
    const loadWeight = Math.max(0, Number(weight) || 0)
    const mileFees = routeMiles * state.mile
    const oversizePremium = loadWidth >= 14 || loadHeight >= 15 ? 40 : loadWidth >= state.escortAt ? 20 : 0
    const overweightPremium = loadWeight > 120000 ? 75 : loadWeight > 80000 ? 35 : 0
    const total = state.base + mileFees + oversizePremium + overweightPremium
    const escortNote = loadWidth >= state.escortAt
      ? `Escort review likely at ${state.escortAt} ft wide and above in this planning reference.`
      : `Escort may not be triggered by width in this planning reference, but route and height can still require support.`

    return { state, total, mileFees, oversizePremium, overweightPremium, escortNote }
  }, [height, miles, stateCode, weight, width])

  return (
    <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8" id="calculator">
      <h2 className="text-sm font-bold text-[#f0f2f5] mb-5">Load Dimensions &amp; Route</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">State</label>
          <select value={stateCode} onChange={(event) => setStateCode(event.target.value)} className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f5] focus:border-[#22c55e] focus:outline-none">
            {STATE_FEES.map((state) => <option key={state.code} value={state.code}>{state.code}</option>)}
          </select>
        </div>
        {[
          ['Width (ft)', width, setWidth],
          ['Height (ft)', height, setHeight],
          ['Weight (lbs)', weight, setWeight],
          ['Route miles', miles, setMiles],
        ].map(([label, value, setter]) => (
          <div key={label as string}>
            <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{label as string}</label>
            <input
              data-tool-interact
              type="number"
              value={value as string}
              onChange={(event) => (setter as (next: string) => void)(event.target.value)}
              className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#22c55e] focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#23415f] bg-[#07111d] p-4" aria-live="polite">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#8ab0d0]">{estimate.state.name} planning estimate</p>
            <p className="mt-1 text-sm text-[#8a9ab0]">{estimate.escortNote}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#566880]">Permit estimate</p>
            <p className="text-2xl font-black text-[#22c55e]">${estimate.total.toFixed(0)}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#8a9ab0]">
          <span>Base: ${estimate.state.base.toFixed(0)}</span>
          <span>Mileage: ${estimate.mileFees.toFixed(0)}</span>
          <span>Oversize: ${estimate.oversizePremium.toFixed(0)}</span>
          <span>Overweight: ${estimate.overweightPremium.toFixed(0)}</span>
        </div>
      </div>
      <p className="text-[10px] text-[#3a5068] text-center mt-3">Planning estimate only. Confirm current fees, route restrictions, and issuing requirements with the state DOT before filing.</p>
    </div>
  )
}
