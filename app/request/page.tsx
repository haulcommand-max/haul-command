'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SERVICE_LABELS: Record<string,string> = {
  pilot_car:'Pilot Car', escort_vehicle:'Escort Vehicle', high_pole:'High Pole',
  steerman:'Steerman', route_surveyor:'Route Surveyor', heavy_towing:'Heavy Towing',
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className=" bg-[#07090d] flex items-center justify-center"><div className="h-8 w-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" /></div>}>
      <RequestPageInner />
    </Suspense>
  )
}

function RequestPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const operatorId = params.get('operator') ?? ''
  const serviceType = params.get('service') ?? 'pilot_car'
  const state = params.get('state') ?? ''

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    contact_name:'', contact_email:'', contact_phone:'',
    pickup_location:'', delivery_location:'',
    pickup_date:'', load_description:'',
    width_ft:'', height_ft:'', length_ft:'', weight_lbs:'',
    notes:'',
  })

  function set(f: string, v: string) { setForm(p=>({...p,[f]:v})) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.contact_email || !form.pickup_location || !form.delivery_location) {
      setError('Email, pickup, and delivery are required.'); return
    }
    setLoading(true)
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('hc_route_requests').insert({
        requested_by: user?.id ?? null,
        operator_hc_id: operatorId || null,
        service_type: serviceType,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        pickup_location: form.pickup_location.trim(),
        delivery_location: form.delivery_location.trim(),
        pickup_date: form.pickup_date || null,
        load_description: form.load_description.trim() || null,
        width_ft: form.width_ft ? parseFloat(form.width_ft) : null,
        height_ft: form.height_ft ? parseFloat(form.height_ft) : null,
        length_ft: form.length_ft ? parseFloat(form.length_ft) : null,
        weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
        notes: form.notes.trim() || null,
        status: 'pending',
      })
      if (err) throw err
      setDone(true)
    } catch(err:any) { setError(err.message ?? 'Failed to submit request.') }
    finally { setLoading(false) }
  }

  if (done) return (
    <div className=" bg-[#07090d] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">âœ…</div>
        <h1 className="text-xl font-bold text-[#22c55e] mb-2">Request Sent!</h1>
        <p className="text-sm text-[#8a9ab0] mb-6">Your load request has been submitted. The operator will be notified immediately via push notification.</p>
        <div className="flex flex-col gap-2">
          <button onClick={()=>router.push('/find-capacity')} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 rounded-xl text-sm">Find More Capacity</button>
          <button onClick={()=>router.push('/load-board')} className="border border-[#1e3048] text-[#8a9ab0] py-3 rounded-xl text-sm">Post to Load Board</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className=" bg-[#07090d] text-[#f0f2f5]">
      <div className="px-4 lg:px-10 py-10 max-w-2xl mx-auto">
        <p className="text-[11px] tracking-[0.2em] text-[#3b82f6] font-semibold mb-2">LOAD REQUEST</p>
        <h1 className="text-2xl font-extrabold text-[#f0f2f5] mb-1">
          Request {SERVICE_LABELS[serviceType] ?? 'Operator'}{state ? ` â€” ${state}` : ''}
        </h1>
        {operatorId && <p className="text-xs text-[#566880] mb-6 font-mono">Operator: {operatorId}</p>}
        <p className="text-sm text-[#8a9ab0] mb-8">Fill in your load details. The operator will receive a push notification and respond within their normal response window.</p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs font-semibold text-[#566880] tracking-wider">YOUR CONTACT INFO</p>
            {[{f:'contact_name',label:'YOUR NAME',ph:'Jane Smith',req:false},{f:'contact_email',label:'EMAIL',ph:'you@company.com',req:true},{f:'contact_phone',label:'PHONE',ph:'+1 555 000 0000',req:false}].map(({f,label,ph,req})=>(
              <div key={f}>
                <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{label}{req&&<span className="text-red-400 ml-0.5">*</span>}</label>
                <input value={(form as any)[f]} onChange={e=>set(f,e.target.value)} placeholder={ph}
                  className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#3b82f6] focus:outline-none"/>
              </div>
            ))}
          </div>

          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs font-semibold text-[#566880] tracking-wider">ROUTE &amp; SCHEDULE</p>
            {[{f:'pickup_location',label:'PICKUP LOCATION',ph:'Houston, TX',req:true},{f:'delivery_location',label:'DELIVERY LOCATION',ph:'Baton Rouge, LA',req:true}].map(({f,label,ph,req})=>(
              <div key={f}>
                <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{label}{req&&<span className="text-red-400 ml-0.5">*</span>}</label>
                <input value={(form as any)[f]} onChange={e=>set(f,e.target.value)} placeholder={ph}
                  className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#3b82f6] focus:outline-none"/>
              </div>
            ))}
            <div>
              <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">PICKUP DATE</label>
              <input type="date" value={form.pickup_date} onChange={e=>set('pickup_date',e.target.value)}
                className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] focus:border-[#3b82f6] focus:outline-none"/>
            </div>
          </div>

          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs font-semibold text-[#566880] tracking-wider">LOAD DIMENSIONS (OPTIONAL BUT RECOMMENDED)</p>
            <div className="grid grid-cols-2 gap-3">
              {[{f:'width_ft',ph:'12'},{f:'height_ft',ph:'14'},{f:'length_ft',ph:'100'},{f:'weight_lbs',ph:'80000'}].map(({f,ph})=>(
                <div key={f}>
                  <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{f.replace('_',' ').toUpperCase()}</label>
                  <input type="number" value={(form as any)[f]} onChange={e=>set(f,e.target.value)} placeholder={ph}
                    className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#3b82f6] focus:outline-none"/>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">ADDITIONAL NOTES</label>
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="e.g. Night move required. Police escort needed."
                className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#3b82f6] focus:outline-none resize-none"/>
            </div>
          </div>

          {error&&<p className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={loading} className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-sm transition-colors">
            {loading ? 'Sendingâ€¦' : 'Send Load Request â†’'}
          </button>
          <p className="text-[10px] text-[#3a5068] text-center">The operator receives a push notification immediately. Your contact details are only shared with this operator.</p>
        </form>
      </div>
    </div>
  )
}