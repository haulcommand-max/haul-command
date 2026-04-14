'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CAMPAIGN_TYPES = [
  { value:'awareness',    label:'Brand Awareness',      desc:'Reach operators and brokers in your target market.' },
  { value:'lead_gen',     label:'Lead Generation',      desc:'Drive sign-ups, calls, or quote requests.' },
  { value:'corridor',     label:'Corridor Takeover',    desc:'Dominate a specific route or state.' },
  { value:'launch',       label:'Market Launch',        desc:'Announce entry into a new region.' },
]

const AD_ZONES = [
  { value:'country_takeover',    label:'Country Takeover',     price:499 },
  { value:'state_banner',        label:'State / Region Banner', price:149 },
  { value:'corridor_sponsor',    label:'Corridor Sponsor',      price:99  },
  { value:'live_feed_banner',    label:'Live Feed Banner',      price:199 },
  { value:'training_sponsor',    label:'Training Page Sponsor', price:149 },
  { value:'tool_sponsor',        label:'Tool Page Sponsor',     price:99  },
  { value:'directory_top',       label:'Directory Search Top',  price:249 },
  { value:'glossary_sponsor',    label:'Glossary / Regs',       price:79  },
]

const COUNTRIES = ['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR','MX','IE','SE','NO','DK','FR','ES','IT','PT','IN','TH']

const STEPS = ['Your Info','Campaign Goal','Targeting','Creative','Budget & Launch','Review']

type Form = {
  company_name: string; contact_email: string; contact_phone: string;
  campaign_type: string; campaign_name: string;
  target_country: string; target_states: string; target_corridors: string; target_categories: string; ad_zone: string;
  headline: string; body: string; cta_label: string; cta_url: string;
  bid_cents: number; daily_budget_cents: number; starts_at: string; ends_at: string; weeks: number;
}

export default function AdGridBookPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [campaignId, setCampaignId] = useState('')

  const [form, setForm] = useState<Form>({
    company_name:'', contact_email:'', contact_phone:'',
    campaign_type:'awareness', campaign_name:'',
    target_country:'US', target_states:'', target_corridors:'', target_categories:'', ad_zone:'state_banner',
    headline:'', body:'', cta_label:'Learn More', cta_url:'',
    bid_cents:14900, daily_budget_cents:49900, starts_at:'', ends_at:'', weeks:4,
  })

  function set(field: keyof Form, val: string | number) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const selectedZone = AD_ZONES.find(z=>z.value===form.ad_zone)
  const weeklyRate = selectedZone?.price ?? 149
  const total = weeklyRate * form.weeks

  function next() { setError(''); setStep(s=>Math.min(s+1,5)) }
  function back() { setStep(s=>Math.max(s-1,0)) }

  function validate() {
    if (step===0 && (!form.company_name||!form.contact_email)) { setError('Company name and email are required.'); return false }
    if (step===1 && !form.campaign_name) { setError('Campaign name is required.'); return false }
    if (step===3 && (!form.headline||!form.cta_url)) { setError('Headline and destination URL are required.'); return false }
    return true
  }

  async function submit() {
    setLoading(true); setError('')
    try {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + form.weeks * 7 * 86400000)
      const res = await fetch('/api/adgrid/campaigns', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          advertiser: { company_name:form.company_name, contact_email:form.contact_email, contact_phone:form.contact_phone },
          goal: { campaign_name:form.campaign_name, campaign_type:form.campaign_type },
          targeting: { target_country:form.target_country, target_corridors:form.target_corridors?form.target_corridors.split(','):[], target_states:form.target_states?form.target_states.split(','):[], target_categories:form.target_categories?form.target_categories.split(','):[] },
          creative: { headline:form.headline, body:form.body, cta_label:form.cta_label, cta_url:form.cta_url },
          budget: { bid_cents:weeklyRate*100, daily_budget_cents:form.daily_budget_cents, starts_at:startDate.toISOString(), ends_at:endDate.toISOString() },
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setCampaignId(data.campaign_id)
      setStep(6)
    } catch(err:any) { setError(err.message) }
    finally { setLoading(false) }
  }

  // SUCCESS
  if (step===6) return (
    <div className=" bg-[#07090d] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-5">ðŸŽ‰</div>
        <h1 className="text-2xl font-extrabold text-[#22c55e] mb-3">Campaign Submitted!</h1>
        <p className="text-sm text-[#8a9ab0] mb-2">Reference: <span className="font-mono text-[#d4950e]">{campaignId.slice(0,8).toUpperCase()}</span></p>
        <p className="text-sm text-[#8a9ab0] mb-6 leading-relaxed">Your campaign is under review. We typically approve within 2 hours. You'll receive an email confirmation shortly.</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button onClick={()=>router.push('/advertise')} className="bg-[#d4950e] hover:bg-[#c4850e] text-white font-bold py-3 rounded-xl text-sm">Back to AdGrid</button>
          <button onClick={()=>{setStep(0);setForm({...form,campaign_name:''})}} className="border border-[#1e3048] text-[#8a9ab0] py-3 rounded-xl text-sm">Book Another Campaign</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className=" bg-[#07090d] text-[#f0f2f5]">
      <div className="px-4 lg:px-10 py-10 max-w-2xl mx-auto">
        <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-2">HC ADGRID · CAMPAIGN BOOKING</p>
        <h1 className="text-2xl font-extrabold text-[#f0f2f5] mb-6">Book Your Campaign</h1>

        {/* PROGRESS */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {STEPS.map((s,i)=>(
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i<step?'bg-[#22c55e] text-white':i===step?'bg-[#d4950e] text-white':'bg-[#1e3048] text-[#566880]'
              }`}>{i<step?'âœ”':i+1}</div>
              <span className={`text-[10px] ${
                i===step?'text-[#d4950e] font-semibold':'text-[#566880]'
              }`}>{s}</span>
              {i<STEPS.length-1&&<div className="w-4 h-px bg-[#1e3048] mx-1"/>}
            </div>
          ))}
        </div>

        <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-6">

          {/* STEP 0: YOUR INFO */}
          {step===0&&(
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#f0f2f5] mb-2">Your Information</h2>
              {[{f:'company_name',label:'COMPANY NAME',ph:'Acme Insurance Co.',required:true},{f:'contact_email',label:'CONTACT EMAIL',ph:'you@company.com',required:true},{f:'contact_phone',label:'PHONE (OPTIONAL)',ph:'+1 555 000 0000',required:false}].map(({f,label,ph,required})=>(
                <div key={f}>
                  <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{label}{required&&<span className="text-red-400 ml-0.5">*</span>}</label>
                  <input value={(form as any)[f]} onChange={e=>set(f as keyof Form,e.target.value)} placeholder={ph}
                    className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#d4950e] focus:outline-none"/>
                </div>
              ))}
            </div>
          )}

          {/* STEP 1: GOAL */}
          {step===1&&(
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#f0f2f5] mb-2">Campaign Goal</h2>
              <div>
                <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">CAMPAIGN NAME <span className="text-red-400">*</span></label>
                <input value={form.campaign_name} onChange={e=>set('campaign_name',e.target.value)} placeholder="e.g. Spring 2026 Operator Acquisition"
                  className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#d4950e] focus:outline-none"/>
              </div>
              <div>
                <label className="block text-[10px] text-[#566880] mb-2 font-semibold tracking-wider">CAMPAIGN TYPE</label>
                <div className="grid grid-cols-1 gap-2">
                  {CAMPAIGN_TYPES.map(ct=>(
                    <button key={ct.value} type="button" onClick={()=>set('campaign_type',ct.value)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                        form.campaign_type===ct.value?'border-[#d4950e] bg-[#2a1f08] text-[#f0f2f5]':'border-[#1e3048] bg-[#07090d] text-[#8a9ab0] hover:border-[#d4950e40]'
                      }`}>
                      <span className="font-semibold">{ct.label}</span> — <span className="text-xs opacity-75">{ct.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TARGETING */}
          {step===2&&(
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#f0f2f5] mb-2">Targeting</h2>
              <div>
                <label className="block text-[10px] text-[#566880] mb-2 font-semibold tracking-wider">AD ZONE</label>
                <div className="flex flex-col gap-1.5">
                  {AD_ZONES.map(z=>(
                    <button key={z.value} type="button" onClick={()=>set('ad_zone',z.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                        form.ad_zone===z.value?'border-[#d4950e] bg-[#2a1f08]':'border-[#1e3048] bg-[#07090d] hover:border-[#d4950e40]'
                      }`}>
                      <span className={form.ad_zone===z.value?'text-[#f0f2f5] font-semibold':'text-[#8a9ab0]'}>{z.label}</span>
                      <span className="text-[#d4950e] font-bold">${z.price}/wk</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">TARGET COUNTRY</label>
                <select value={form.target_country} onChange={e=>set('target_country',e.target.value)}
                  className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] focus:border-[#d4950e] focus:outline-none">
                  {COUNTRIES.map(cc=><option key={cc} value={cc}>{cc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">TARGET STATES / PROVINCES (comma-separated, optional)</label>
                <input value={form.target_states} onChange={e=>set('target_states',e.target.value)} placeholder="e.g. TX, LA, MS, AL"
                  className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#d4950e] focus:outline-none"/>
              </div>
            </div>
          )}

          {/* STEP 3: CREATIVE */}
          {step===3&&(
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#f0f2f5] mb-2">Ad Creative</h2>
              <p className="text-xs text-[#566880]">Don't have creative? Leave body blank and we'll generate premium creative for you at no extra cost.</p>
              {[{f:'headline',label:'HEADLINE (max 80 chars)',ph:'Protect Every Load. Pilot Car Insurance from $49/mo.',required:true,max:80},
                {f:'body',    label:'BODY COPY (max 200 chars, optional)',ph:'Fast quotes, instant cert upload, $1M minimum coverage.',required:false,max:200},
                {f:'cta_label',label:'BUTTON LABEL',ph:'Get a Quote',required:false,max:30},
                {f:'cta_url', label:'DESTINATION URL',ph:'https://yoursite.com/haul-command',required:true,max:500}].map(({f,label,ph,required,max})=>(
                <div key={f}>
                  <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{label}{required&&<span className="text-red-400 ml-0.5">*</span>}</label>
                  <input value={(form as any)[f]} onChange={e=>set(f as keyof Form,e.target.value)} placeholder={ph} maxLength={max}
                    className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#d4950e] focus:outline-none"/>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: BUDGET */}
          {step===4&&(
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-bold text-[#f0f2f5] mb-2">Budget &amp; Launch</h2>
              <div>
                <label className="block text-[10px] text-[#566880] mb-2 font-semibold tracking-wider">CAMPAIGN DURATION</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,4,8].map(w=>(
                    <button key={w} type="button" onClick={()=>set('weeks',w)}
                      className={`py-3 rounded-xl border text-sm font-bold transition-colors ${
                        form.weeks===w?'border-[#d4950e] bg-[#2a1f08] text-[#d4950e]':'border-[#1e3048] bg-[#07090d] text-[#8a9ab0]'
                      }`}>{w}wk</button>
                  ))}
                </div>
              </div>
              <div className="bg-[#141e28] border border-[#1e3048] rounded-xl p-5 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-[#8a9ab0]">Zone</span><span className="text-[#d0dce8] font-semibold">{selectedZone?.label}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#8a9ab0]">Weekly rate</span><span className="text-[#d0dce8]">${weeklyRate}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#8a9ab0]">Duration</span><span className="text-[#d0dce8]">{form.weeks} week{form.weeks>1?'s':''}</span></div>
                <div className="border-t border-[#1e3048] pt-2 flex justify-between text-base font-bold"><span className="text-[#f0f2f5]">Total</span><span className="text-[#d4950e]">${total}</span></div>
              </div>
              <p className="text-[10px] text-[#566880]">Billed in full upon campaign approval. Campaigns can be paused anytime. No auto-renewal without your consent.</p>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step===5&&(
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#f0f2f5] mb-2">Review &amp; Submit</h2>
              {[
                ['Advertiser', form.company_name],['Email', form.contact_email],
                ['Campaign', form.campaign_name],['Type', form.campaign_type],
                ['Ad Zone', selectedZone?.label??''],['Country', form.target_country],
                ['States', form.target_states||'All'],['Headline', form.headline],
                ['CTA URL', form.cta_url],['Duration', `${form.weeks} weeks`],
                ['Total', `$${total}`],
              ].map(([label,val])=>(
                <div key={label} className="flex gap-3 text-sm border-b border-[#131c28] pb-2">
                  <span className="text-[#566880] w-24 shrink-0">{label}</span>
                  <span className="text-[#d0dce8] break-all">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error&&<p className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded-xl px-4 py-3 mb-4">{error}</p>}

        <div className="flex gap-3">
          {step>0&&<button type="button" onClick={back} className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#d4950e] px-5 py-3 rounded-xl text-sm font-semibold">Back</button>}
          {step<5
            ? <button type="button" onClick={()=>{if(validate())next()}} className="flex-1 bg-[#d4950e] hover:bg-[#c4850e] text-white font-bold py-3 rounded-xl text-sm">Continue â†’</button>
            : <button type="button" onClick={submit} disabled={loading} className="flex-1 bg-[#d4950e] hover:bg-[#c4850e] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">
                {loading?'Submitting...':'Submit Campaign â†’'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}