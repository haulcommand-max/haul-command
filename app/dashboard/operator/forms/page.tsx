import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, FileText, CheckCircle, Clock, AlertCircle, Download, PenTool } from 'lucide-react';
import { FormHubClient } from './FormHubClient';

export const metadata = {
  title: 'Compliance Hub | Haul Command',
  description: 'Digital forms and compliance storage for escort operators.',
};

export default async function OperatorFormsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?return=/dashboard/operator/forms');
  }

  // 1. Fetch available templates
  const { data: rawTemplates, error: tErr } = await supabase
    .from('hc_form_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // 2. Fetch user's existing documents
  const { data: rawDocuments, error: dErr } = await supabase
    .from('hc_operator_documents')
    .select('*')
    .eq('operator_id', session.user.id)
    .order('created_at', { ascending: false });

  // 3. Fetch operator profile for auto-fill data
  const { data: profile } = await supabase
    .from('hc_global_operators')
    .select('business_name, ein_ssn, certifications')
    .eq('user_id', session.user.id)
    .single();

  const templates = rawTemplates || [];
  const documents = rawDocuments || [];

  return (
    <div className="min-h-screen bg-[#07090d] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="mb-8">
          <Link href="/dashboard/operator" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-white transition-colors mb-4 uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Command
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Compliance Hub</h1>
              <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
                Manage your credentials, sign required route surveys, and keep your W-9 up to date. Auto-fill pulls directly from your operator profile.
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border text-emerald-400 bg-emerald-400/10 border-emerald-400/20 mb-2">
                ✓ System Active
              </span>
            </div>
          </div>
        </div>

        <FormHubClient 
          userId={session.user.id}
          templates={templates}
          documents={documents}
          profile={profile}
        />

      </div>
    </div>
  );
}
