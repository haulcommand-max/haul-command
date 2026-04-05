"use client";

import { useState } from "react";
import { FileText, Upload, Clock, Search, Folder, MoreVertical, Plus, CheckCircle2, ShieldCheck, MailWarning, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

// Minimal mockup of forms database and state
const MOCK_FORMS = [
  { id: 1, title: "Master Service Agreement (MSA)", type: "Contract", status: "Completed", date: "Oct 12, 2025", expiring: false },
  { id: 2, title: "W-9 Tax Form", type: "Tax", status: "Completed", date: "Jan 1, 2026", expiring: false },
  { id: 3, title: "Certificate of Insurance (Acord)", type: "Insurance", status: "Expiring Soon", date: "May 1, 2026", expiring: true },
  { id: 4, title: "Route Survey Form (TX-310)", type: "Compliance", status: "Draft", date: "Today", expiring: false },
];

export default function FormsHubPage() {
  const [activeTab, setActiveTab] = useState<"vault" | "templates" | "reminders">("vault");

  return (
    <div className="flex-1 lg:max-w-7xl mx-auto w-full p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Folder className="h-7 w-7 text-indigo-400" /> 
            Forms Hub & Vault
          </h1>
          <p className="text-slate-400 mt-1">Manage compliance, fast-fill contracts, and track expirations in one place.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20">
            <Plus className="h-4 w-4 mr-2" /> New Form
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-6">
        <button 
          className={`pb-3 font-medium transition-colors border-b-2 ${activeTab === 'vault' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          onClick={() => setActiveTab('vault')}
        >
          My Vault
        </button>
        <button 
          className={`pb-3 font-medium transition-colors border-b-2 ${activeTab === 'templates' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          onClick={() => setActiveTab('templates')}
        >
          Autofill Templates
        </button>
        <button 
          className={`pb-3 font-medium transition-colors border-b-2 w-full max-w-[140px] flex items-center justify-between ${activeTab === 'reminders' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          onClick={() => setActiveTab('reminders')}
        >
          <span>Reminders</span>
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">1</span>
        </button>
      </div>

      {/* Constraints & Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search documents, IDs, or contacts..." 
            className="pl-10 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800">
            Filter <MoreVertical className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </div>
      </div>

      {/* Main Table / View */}
      {activeTab === "vault" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="border-b border-slate-800 bg-slate-900/50 p-4 font-bold text-slate-300 flex justify-between items-center">
            <span>Recent Documents</span>
          </div>
          <div className="divide-y divide-slate-800/50">
            {MOCK_FORMS.map((form) => (
              <div key={form.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-800/20 transition-colors">
                <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${form.expiring ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{form.title}</h4>
                    <span className="text-xs text-slate-500">{form.type}</span>
                  </div>
                </div>
                <div className="col-span-6 md:col-span-3 text-sm flex items-center">
                   {form.expiring ? (
                      <span className="flex items-center text-red-400 bg-red-400/10 px-2 py-1 rounded-md text-xs font-bold border border-red-500/20">
                        <MailWarning className="h-3 w-3 mr-1" /> {form.status}
                      </span>
                   ) : form.status === 'Completed' ? (
                      <span className="flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-xs font-bold border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {form.status}
                      </span>
                   ) : (
                      <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded-md text-xs font-bold border border-slate-700">
                         {form.status}
                      </span>
                   )}
                </div>
                <div className="col-span-4 md:col-span-2 text-sm text-slate-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1 opacity-50" /> {form.date}
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Empty State Mock */}
      {activeTab === "templates" && (
         <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 border fill-transparent border-indigo-500/30 rounded-xl p-6 relative overflow-hidden group">
               <ShieldCheck className="h-8 w-8 text-indigo-400 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">Carrier Onboarding Packet</h3>
               <p className="text-sm text-slate-400 mb-6">Autofill your W-9, Insurance parameters, and Authority letters in one click.</p>
               <Button className="w-full bg-indigo-600 hover:bg-indigo-500">Enable Autofill</Button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
               <FileText className="h-8 w-8 text-slate-500 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">Blank Route Survey</h3>
               <p className="text-sm text-slate-400 mb-6">Standard 15-point route checklist for local municipal approvals.</p>
               <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">Use Template</Button>
            </div>
         </div>
      )}

      {/* NextMoves / Storage Note */}
      <div className="mt-8 bg-blue-900/10 border border-blue-900/30 rounded-xl p-4 flex gap-4 items-start">
        <ShieldCheck className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-white text-sm mb-1">Encrypted Storage Active</h4>
          <p className="text-xs text-slate-400">
            All your files and autofill parameters are stored leveraging AES-256 encryption within the Haul Command Vault infrastructure. Do not share your 6-digit export PIN with dispatch.
          </p>
        </div>
      </div>

    </div>
  );
}
