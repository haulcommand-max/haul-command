"use client";

import { useState } from "react";
import { ArrowRight, MapPin, Navigation, Calendar, Clock, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function OperatorRepositionPostPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClientComponentClient();

  const [form, setForm] = useState({
    originCity: "",
    originState: "",
    destCity: "",
    destState: "",
    departDate: new Date().toISOString().split("T")[0],
    detourMiles: "50",
    rateNote: "Negotiable",
  });

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         alert("You must be logged in as an operator to post a repositioning broadcast.");
         setIsSubmitting(false);
         return;
      }

      // 2. Insert directly into repositioning_posts
      // The RLS allows authenticated users to insert where operator_id = auth.uid()
      const { error } = await supabase.from('repositioning_posts').insert([
        {
          operator_id: user.id,
          origin_city: form.originCity,
          origin_state: form.originState,
          dest_city: form.destCity,
          dest_state: form.destState,
          depart_date: form.departDate,
          willing_to_detour_miles: parseInt(form.detourMiles) || 50,
          rate_note: form.rateNote,
          status: 'active',
          is_active: true
        }
      ]);

      if (error) {
        console.error("Error posting reposition:", error);
        alert("Failed to post: " + error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      alert("System error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 lg:max-w-4xl mx-auto w-full p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-2 mb-2">
          <Navigation className="h-7 w-7 text-emerald-400" />
          Broadcast Deadhead Route
        </h1>
        <p className="text-slate-400 text-lg">
          Moving an empty truck? Post your origin and destination. Brokers and primary carriers actively search this feed to book you on your way home.
        </p>
      </div>

      {success ? (
         <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-10 text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Route Broadcast Live</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Your repositioning route is now active on the global broker network. Dispatchers will see your exact availability and exact route overlap.
            </p>
            <div className="flex justify-center gap-4">
               <Button onClick={() => setSuccess(false)} variant="outline" className="border-slate-700 text-slate-300">
                  Post Another Route
               </Button>
               <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={() => window.location.href='/reposition'}>
                  View Public Feed
               </Button>
            </div>
         </div>
      ) : (
         <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
           <div className="bg-slate-900/50 border-b border-slate-800 p-6 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">Route Details</h2>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                High Priority Feed
              </span>
           </div>
           
           <div className="p-6 md:p-8 space-y-8">
             
             {/* Origin */}
             <div className="relative">
                <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-slate-800 -z-10" />
                <div className="flex gap-4">
                   <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shrink-0 border border-slate-700 z-10">
                     <MapPin className="h-5 w-5 text-amber-400" />
                   </div>
                   <div className="flex-1 space-y-2">
                     <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Starting Point (Empty)</label>
                     <div className="flex gap-4">
                        <Input 
                          placeholder="City (e.g. Phoenix)" 
                          required 
                          className="bg-slate-950 border-slate-800 h-14 text-white flex-1"
                          value={form.originCity}
                          onChange={(e) => updateForm('originCity', e.target.value)}
                        />
                        <Input 
                          placeholder="State (e.g. AZ)" 
                          required 
                          maxLength={2} 
                          className="bg-slate-950 border-slate-800 h-14 text-white w-24 uppercase"
                          value={form.originState}
                          onChange={(e) => updateForm('originState', e.target.value.toUpperCase())}
                        />
                     </div>
                   </div>
                </div>
             </div>

             {/* Destination */}
             <div className="flex gap-4">
                 <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shrink-0 border border-slate-700 z-10">
                   <MapPin className="h-5 w-5 text-emerald-400" />
                 </div>
                 <div className="flex-1 space-y-2">
                   <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Heading Towards</label>
                   <div className="flex gap-4">
                      <Input 
                        placeholder="City (e.g. Dallas) - Optional" 
                        className="bg-slate-950 border-slate-800 h-14 text-white flex-1"
                        value={form.destCity}
                        onChange={(e) => updateForm('destCity', e.target.value)}
                      />
                      <Input 
                        placeholder="State (TX)" 
                        required 
                        maxLength={2} 
                        className="bg-slate-950 border-slate-800 h-14 text-white w-24 uppercase"
                        value={form.destState}
                        onChange={(e) => updateForm('destState', e.target.value.toUpperCase())}
                      />
                   </div>
                 </div>
             </div>

             <div className="border-t border-slate-800 pt-8 mt-4 grid md:grid-cols-3 gap-6">
                 {/* Timing */}
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Departure Date
                    </label>
                    <Input 
                      type="date"
                      required
                      className="bg-slate-950 border-slate-800 h-14 text-white"
                      value={form.departDate}
                      onChange={(e) => updateForm('departDate', e.target.value)}
                    />
                 </div>
                 
                 {/* Flexibility */}
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Truck className="h-4 w-4" /> Detour flexibility
                    </label>
                    <div className="relative">
                      <Input 
                        type="number"
                        className="bg-slate-950 border-slate-800 h-14 text-white pr-16"
                        value={form.detourMiles}
                        onChange={(e) => updateForm('detourMiles', e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">miles</span>
                    </div>
                 </div>

                 {/* Rate */}
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      💰 Desired Rate
                    </label>
                    <Input 
                      placeholder="e.g. $450/day or Negotiable"
                      className="bg-slate-950 border-slate-800 h-14 text-white"
                      value={form.rateNote}
                      onChange={(e) => updateForm('rateNote', e.target.value)}
                    />
                 </div>
             </div>
           </div>

           <div className="bg-slate-900/80 border-t border-slate-800 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-500 max-w-sm">
                Your broadcast will be automatically categorized as <strong className="text-emerald-400">Backhaul Capacity</strong> and injected directly into broker dispatch mapping systems.
              </p>
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-lg shadow-lg shadow-emerald-900/20">
                 {isSubmitting ? "Broadcasting Network..." : "Broadcast Route"} <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
           </div>
         </form>
      )}

    </div>
  );
}
