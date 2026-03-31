'use client';

import React, { useState } from 'react';

// Haul Command Credential & Trust Layer
// Derived from Freedom Pilot & Evergreen audits: Digitizing analog PDFs into an OS trust graph.
// Handles Vendor ACORD, Liability limits, and Certifications.

export default function CredentialWalletIntake() {
  const [step, setStep] = useState(1);
  const [vendorData, setVendorData] = useState({
    companyName: '',
    ein_tax_id: '',
    agreesToTerms: false
  });

  return (
    <div className="max-w-2xl mx-auto bg-black text-hc-gray-50 p-8 rounded-2xl shadow-2xl border border-hc-gray-800">
      <div className="mb-8 border-b border-hc-gray-800 pb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Vendor Compliance Wallet</h2>
          <p className="text-sm text-hc-gray-400 mt-1">Global Operator Verification Setup</p>
        </div>
        <div className="flex gap-2 text-hc-yellow-400 font-bold bg-hc-gray-900 px-4 py-2 rounded-full text-sm">
          Step {step} of 3
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h3 className="text-lg font-bold mb-4">Identity & B2B Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-hc-gray-400 mb-1">Registered Company Name</label>
                <input 
                  type="text" required
                  className="w-full bg-hc-gray-900 border border-hc-gray-700 rounded p-3 focus:border-hc-yellow-400 focus:outline-none" 
                  value={vendorData.companyName}
                  onChange={e => setVendorData({...vendorData, companyName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-hc-gray-400 mb-1">Employer Identification (EIN/VAT/ABN)</label>
                <input 
                  type="text" required
                  className="w-full bg-hc-gray-900 border border-hc-gray-700 rounded p-3 focus:border-hc-yellow-400 focus:outline-none" 
                  value={vendorData.ein_tax_id}
                  onChange={e => setVendorData({...vendorData, ein_tax_id: e.target.value})}
                />
              </div>
            </div>
          </div>
          <button 
            onClick={() => setStep(2)}
            className="w-full bg-white text-black font-bold py-4 rounded hover:bg-gray-200 transition-colors"
          >
            Continue to Insurance & ACORD
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h3 className="text-lg font-bold mb-4">Insurance Compliance Upload</h3>
            <div className="bg-hc-gray-900 border-2 border-dashed border-hc-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-hc-yellow-400 transition-colors">
              <span className="text-4xl block mb-2">📁</span>
              <p className="font-bold">Upload ACORD Certificate</p>
              <p className="text-xs text-hc-gray-400 mt-2">Must show minimum $1M Auto & General Liability.</p>
              <p className="text-xs text-hc-yellow-400 mt-1">Our AI extracts expiration dates directly from the document.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setStep(1)}
              className="w-1/3 bg-hc-gray-800 text-white font-bold py-4 rounded hover:bg-hc-gray-700 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={() => setStep(3)}
              className="w-2/3 bg-white text-black font-bold py-4 rounded hover:bg-gray-200 transition-colors"
            >
              Continue to Certifications
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h3 className="text-lg font-bold mb-4">Certifications & Passports</h3>
            <div className="space-y-3">
              <div className="p-4 bg-hc-gray-900 border border-hc-gray-800 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">State/Regional Escort License</p>
                  <p className="text-xs text-hc-gray-500">WA PEVO, BF3, Level 1</p>
                </div>
                <button className="text-xs bg-hc-gray-800 text-hc-gray-300 px-3 py-1 rounded border border-hc-gray-700 hover:text-white">Upload / Sync</button>
              </div>
              <div className="p-4 bg-hc-gray-900 border border-hc-gray-800 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">Port Authority Clearance</p>
                  <p className="text-xs text-hc-gray-500">TWIC, MSIC, MTSC</p>
                </div>
                <button className="text-xs bg-hc-gray-800 text-hc-gray-300 px-3 py-1 rounded border border-hc-gray-700 hover:text-white">Upload / Sync</button>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-hc-gray-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" onChange={(e) => setVendorData({...vendorData, agreesToTerms: e.target.checked})}/>
              <span className="text-xs text-hc-gray-400">
                I agree to the Haul Command B2B Subcontractor Agreement. I acknowledge that direct payment from drivers is prohibited and incidents must be reported via this app within 24 hours. (Derived from Freedom Pilot policy layer).
              </span>
            </label>
          </div>
          <button 
            disabled={!vendorData.agreesToTerms}
            className="w-full bg-hc-yellow-400 hover:bg-yellow-500 disabled:bg-hc-gray-800 disabled:text-hc-gray-600 disabled:border-transparent text-hc-gray-900 border border-hc-yellow-400 font-bold py-4 rounded transition-colors"
          >
            Submit Wallet for Verification
          </button>
        </div>
      )}
    </div>
  );
}
