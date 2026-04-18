'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UploadCloud, CheckCircle, Loader2 } from 'lucide-react';

export default function CertificationUpload() {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setErrorMsg(null);
        setSuccessMessage(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error('Not logged in. Please sign in to upload certifications.');

            const userId = session.user.id;
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/${docType}-${Date.now()}.${fileExt}`;

            // Upload to storage bucket
            const { error: uploadError } = await supabase.storage
                .from('certifications')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('certifications')
                .getPublicUrl(filePath);

            // Update user_profiles schema
            const updatePayload: any = {};
            if (docType === 'pilot-cert') updatePayload.pilot_certificate_url = publicUrl;
            if (docType === 'defensive-driving') updatePayload.defensive_driving_url = publicUrl;

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('id', userId);

            if (profileError) throw profileError;

            setSuccessMessage(`${docType.replace('-', ' ')} uploaded successfully!`);
        } catch (error: any) {
            console.error('Upload Error:', error);
            setErrorMsg(error.message || 'Error uploading document.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#F1A91B]" />
                Upload Certification Documents
            </h3>
            <p className="text-sm text-gray-400 mb-6">
                Upload your external pilot car certificates or defensive driving documents to add verified badges to your Haul Command profile.
            </p>

            {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm mb-6">
                    <CheckCircle className="w-5 h-5" /> {successMessage}
                </div>
            )}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pilot Card Upload */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <h4 className="font-semibold text-white mb-1">State Pilot Car Certificate</h4>
                    <p className="text-xs text-gray-500 mb-4">Upload your Wa, FL, NY, or UT certification.</p>
                    <label className="relative flex justify-center items-center px-4 py-3 bg-[#0a0a0a] border-2 border-dashed border-[#333] hover:border-[#F1A91B] rounded-lg cursor-pointer transition-colors group">
                        {uploading ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : (
                            <span className="text-sm font-medium text-gray-300 group-hover:text-[#F1A91B]">Browse File</span>
                        )}
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => handleFileUpload(e, 'pilot-cert')}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Defensive Driving Upload */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <h4 className="font-semibold text-white mb-1">Defensive Driving Course</h4>
                    <p className="text-xs text-gray-500 mb-4">Official NSC or valid state equivalent.</p>
                    <label className="relative flex justify-center items-center px-4 py-3 bg-[#0a0a0a] border-2 border-dashed border-[#333] hover:border-[#F1A91B] rounded-lg cursor-pointer transition-colors group">
                        {uploading ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : (
                            <span className="text-sm font-medium text-gray-300 group-hover:text-[#F1A91B]">Browse File</span>
                        )}
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => handleFileUpload(e, 'defensive-driving')}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
