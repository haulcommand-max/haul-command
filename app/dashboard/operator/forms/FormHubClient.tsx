"use client";

import React, { useState } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Download, PenTool, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function FormHubClient({ userId, templates, documents, profile }: any) {
  const [activeTab, setActiveTab] = useState<'required' | 'completed'>('required');
  const [signingTemplate, setSigningTemplate] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localDocs, setLocalDocs] = useState<any[]>(documents);

  const pendingTemplates = templates.filter((t: any) => 
    !localDocs.some((d: any) => d.template_id === t.id && d.status === 'submitted')
  );
  
  const completedDocs = localDocs.filter((d: any) => d.status === 'submitted' || d.status === 'verified');

  const initiateSign = (t: any) => {
    // Auto-fill from profile if we have hits
    const autoFilled: any = {};
    const fields = t.schema_fields || [];
    fields.forEach((f: any) => {
      if (f.id === 'business_name' && profile?.business_name) autoFilled[f.id] = profile.business_name;
      if (f.id === 'ein' && profile?.ein_ssn) autoFilled[f.id] = profile.ein_ssn;
    });
    
    setFormData(autoFilled);
    setSigningTemplate(t);
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        operator_id: userId,
        template_id: signingTemplate.id,
        title: `${signingTemplate.title} - Signed`,
        status: 'submitted',
        form_data: formData,
        signature_data: {
          signed_at: new Date().toISOString(),
          ip: "client-verified",
          consent: true
        }
      };

      const res = await fetch('/api/compliance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit form");
      const { data } = await res.json();
      
      setLocalDocs([data, ...localDocs]);
      setSigningTemplate(null);
      alert("Document securely signed and stored.");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 bg-[#121214] flex flex-col gap-1">
            <AlertCircle className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-2xl font-black text-white">{pendingTemplates.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Action Required</span>
          </div>
        </Card>
        <Card>
          <div className="p-4 bg-[#121214] flex flex-col gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-2xl font-black text-white">{completedDocs.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Verified Files</span>
          </div>
        </Card>
        <Card>
          <div className="p-4 bg-[#121214] flex flex-col gap-1">
            <Clock className="w-4 h-4 text-blue-400 mb-1" />
            <span className="text-2xl font-black text-white">0</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expiring Soon (&lt;30d)</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('required')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
            activeTab === 'required' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Action Required ({pendingTemplates.length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
            activeTab === 'completed' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          My File Cabinet ({completedDocs.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl p-6">
        {activeTab === 'required' && (
          <div className="space-y-4">
            {pendingTemplates.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <p className="font-bold text-white uppercase tracking-widest text-sm">All Clear</p>
                <p className="text-slate-400 text-sm">You have no missing compliance documents.</p>
              </div>
            ) : (
              pendingTemplates.map((t: any) => (
                <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/10 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{t.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{t.description}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-[#1e3048] text-[#8a9ab0] rounded">
                          {t.jurisdiction_code}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-[#1e3048] text-[#8a9ab0] rounded">
                          {t.form_category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => initiateSign(t)}
                    className="bg-amber-500 hover:bg-amber-400 text-white font-bold uppercase tracking-widest whitespace-nowrap"
                  >
                    <PenTool className="w-4 h-4 mr-2" /> Auto-Fill & Sign
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
           <div className="space-y-4">
           {completedDocs.length === 0 ? (
             <div className="text-center py-10 opacity-50">
               <FileText className="w-12 h-12 mx-auto text-slate-500 mb-3" />
               <p className="text-slate-400 text-sm">Your file cabinet is empty.</p>
             </div>
           ) : (
             completedDocs.map((doc: any) => (
               <div key={doc.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl gap-4">
                 <div className="flex items-start gap-4">
                   <div className="bg-emerald-500/10 p-3 rounded-lg">
                     <CheckCircle className="w-6 h-6 text-emerald-400" />
                   </div>
                   <div>
                     <h3 className="font-bold text-white text-lg">{doc.title}</h3>
                     <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-mono">
                       ID: {doc.id.split('-')[0]} â€¢ Signed: {new Date(doc.created_at).toLocaleDateString()}
                     </p>
                   </div>
                 </div>
                 <Button variant="outline" className="border-white/10 text-white/70 hover:text-white uppercase tracking-widest text-xs">
                   <Download className="w-4 h-4 mr-2" /> View PDF
                 </Button>
               </div>
             ))
           )}
         </div>
        )}
      </div>

      {/* Signing Modal */}
      {signingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121214] border border-white/10 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-black/50">
              <h2 className="font-bold text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-500" /> {signingTemplate.title}
              </h2>
              <button onClick={() => setSigningTemplate(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-400">
                Please verify the auto-filled data before applying your digital signature. This document acts as a legally binding attestation.
              </p>

              {signingTemplate.schema_fields?.map((field: any) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {field.label}
                  </label>
                  {field.type === 'boolean' ? (
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-amber-500"
                        checked={formData[field.id] === true}
                        onChange={(e) => setFormData({...formData, [field.id]: e.target.checked})}
                      />
                      <span className="text-sm text-white">I confirm the above</span>
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-6">
                <p className="text-xs text-blue-300 font-medium">
                  By clicking "Sign & Store", you authorize Haul Command OS to stamp this document with your verified profile credentials and attach it to your operator compliance profile.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 bg-black/50 flex gap-3">
              <span className="flex-1"></span>
              <Button variant="ghost" onClick={() => setSigningTemplate(null)} className="text-slate-400 hover:text-white uppercase tracking-widest text-xs">
                Cancel
              </Button>
              <Button 
                onClick={submitForm} 
                className="bg-amber-500 hover:bg-amber-400 text-white font-bold uppercase tracking-widest"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Stamping Form...' : 'Sign & Store Document'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}