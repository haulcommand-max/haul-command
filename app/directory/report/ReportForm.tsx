"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function ReportForm({ slug }: { slug?: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorString, setErrorString] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorString('');

    const formData = new FormData(e.currentTarget);
    const data = {
      entity_type: 'directory_listing',
      entity_id: slug || 'unknown',
      issue_type: formData.get('issue_type'),
      description: formData.get('description'),
    };

    try {
      const res = await fetch('/api/data-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to submit report');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorString(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <h3 className="text-emerald-500 font-bold text-xl mb-2">Report Submitted Successfully</h3>
        <p className="text-gray-400 mb-6 text-sm">Our Trust & Safety team will review this listing data shortly.</p>
        <Link href={slug ? `/place/${slug}` : '/directory'} className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2 rounded-lg transition-colors">
          Return to Profile
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorString && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold">
          {errorString}
        </div>
      )}
      
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Issue Type</label>
        <select name="issue_type" required className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-amber-500/50 outline-none">
          <option value="closed">Company no longer operates</option>
          <option value="wrong_contact">Phone number / Contact info is wrong</option>
          <option value="wrong_location">Address or Location is wrong</option>
          <option value="wrong_type">Entity Type is incorrect</option>
          <option value="other">Other / Unsafe activity</option>
        </select>
      </div>
      
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Details & Correct Info (Optional)</label>
        <textarea 
          name="description"
          rows={4}
          placeholder="What should the correct public data be?"
          className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-amber-500/50 outline-none resize-none"
        ></textarea>
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <button disabled={loading} type="submit" className="flex items-center justify-center w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Correction Report'}
        </button>
        <Link href={slug ? `/place/${slug}` : '/directory'} className="text-center text-sm text-gray-500 hover:text-white transition-colors py-2">
          Cancel & Return
        </Link>
      </div>
    </form>
  );
}