'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Calendar, Scale, Ruler, FileText, UploadCloud, ChevronRight, CheckCircle2 } from 'lucide-react'

type Step = 'details' | 'dimensions' | 'contact' | 'success'

export function LoadBoardPostClient() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState<Step>('details')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    service_type: 'pilot_car',
    pickup_location: '',
    delivery_location: '',
    pickup_date: '',
    load_description: '',
    width_ft: '',
    height_ft: '',
    length_ft: '',
    weight_lbs: '',
    notes: '',
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Basic validation
      if (!formData.contact_email || !formData.pickup_location || !formData.delivery_location) {
        throw new Error('Please fill out all required fields.')
      }

      const { data: { user } } = await supabase.auth.getUser()

      const payload = {
        ...formData,
        requested_by: user?.id || null,
        width_ft: formData.width_ft ? parseFloat(formData.width_ft) : null,
        height_ft: formData.height_ft ? parseFloat(formData.height_ft) : null,
        length_ft: formData.length_ft ? parseFloat(formData.length_ft) : null,
        weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs, 10) : null,
      }

      const { error: insertError } = await supabase
        .from('hc_route_requests')
        .insert([payload])

      if (insertError) throw insertError

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-green-500/30 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Request Posted Successfully</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Your route request is now live on the load board. Operators matching your criteria will be notified instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => router.push('/load-board')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-medium"
          >
            Go to Load Board
          </button>
          <button 
            onClick={() => {
              setFormData({...formData, pickup_location: '', delivery_location: '', load_description: ''})
              setStep('details')
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)] shadow-blue-500/20"
          >
            Post Another Load
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/80">
        <div className={`flex items-center gap-2 ${step === 'details' ? 'text-blue-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'details' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 border border-slate-700'}`}>1</div>
          <span className="hidden sm:inline font-medium">Route Details</span>
        </div>
        <div className="flex-1 h-px bg-slate-700/50 mx-4" />
        <div className={`flex items-center gap-2 ${step === 'dimensions' ? 'text-blue-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'dimensions' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 border border-slate-700'}`}>2</div>
          <span className="hidden sm:inline font-medium">Dimensions</span>
        </div>
        <div className="flex-1 h-px bg-slate-700/50 mx-4" />
        <div className={`flex items-center gap-2 ${step === 'contact' ? 'text-blue-400' : 'text-slate-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'contact' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 border border-slate-700'}`}>3</div>
          <span className="hidden sm:inline font-medium">Review</span>
        </div>
      </div>

      {error && (
        <div className="px-6 pt-6">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        
        {step === 'details' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Service Required</label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="pilot_car">Pilot Car / Escort</option>
                <option value="high_pole">High Pole Escort</option>
                <option value="steerman">Steerman / Rear Steer</option>
                <option value="route_surveyor">Route Surveyor</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pickup Location <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    name="pickup_location"
                    value={formData.pickup_location}
                    onChange={handleChange}
                    placeholder="e.g. Houston, TX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Delivery Location <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    name="delivery_location"
                    value={formData.delivery_location}
                    onChange={handleChange}
                    placeholder="e.g. Dallas, TX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Pickup Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Load Description</label>
              <input
                name="load_description"
                value={formData.load_description}
                onChange={handleChange}
                placeholder="e.g. CAT 345 Excavator"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep('dimensions')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium shadow-[0_0_20px_rgba(37,99,235,0.2)] shadow-blue-500/10"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'dimensions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Width (ft)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    name="width_ft"
                    value={formData.width_ft}
                    onChange={handleChange}
                    placeholder="12.5"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Height (ft)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    name="height_ft"
                    value={formData.height_ft}
                    onChange={handleChange}
                    placeholder="14.6"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Length (ft)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    name="length_ft"
                    value={formData.length_ft}
                    onChange={handleChange}
                    placeholder="85.0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Gross Weight (lbs)</label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="number"
                  name="weight_lbs"
                  value={formData.weight_lbs}
                  onChange={handleChange}
                  placeholder="125000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes / Conditions</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Mention any curfews, specific equipment needed, or permit conditions..."
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('contact')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'contact' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-sm">
                This information will only be shared with operators who match and accept your load request.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Name</label>
                <input
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address <span className="text-red-400">*</span></label>
                <input
                  required
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="john@heavyfreight.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep('dimensions')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)] shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Broadcast Load
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
