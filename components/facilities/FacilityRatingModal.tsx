"use client";

import { useState } from "react";
import { Star, MapPin, Truck, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface FacilityRatingModalProps {
  facilityId: string;
  facilityName: string;
  operatorId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FacilityRatingModal({ facilityId, facilityName, operatorId, isOpen, onClose }: FacilityRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [waitTime, setWaitTime] = useState("");
  const [easyAccess, setEasyAccess] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    
    try {
      await supabase.from('facility_reviews').insert({
        facility_id: facilityId,
        operator_id: operatorId,
        rating,
        wait_time_mins: waitTime ? parseInt(waitTime) : null,
        easy_heavy_haul_access: easyAccess,
        comment
      });
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-950 border border-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-emerald-400 fill-emerald-400" />
          </div>
          <h2 className="text-xl font-bold font-head text-white mb-2">Review Submitted</h2>
          <p className="text-gray-400 text-sm">Your feedback helps map the truth for other heavy haul operators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        
        <div className="bg-gray-900 border-b border-gray-800 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-head text-white">Rate Facility</h2>
          </div>
          <p className="text-gray-400 text-sm font-medium">{facilityName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Overall Rating */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block text-center">Overall Experience</label>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      (hoveredRating || rating) >= star 
                        ? 'text-emerald-400 fill-emerald-400' 
                        : 'text-gray-700 fill-gray-800'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gray-800" />

          {/* Heavy Haul Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 tracking-wider">Wait Time (Mins)</label>
              <input 
                type="number" 
                placeholder="e.g. 45"
                value={waitTime}
                onChange={(e) => setWaitTime(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 tracking-wider">Heavy Haul Access?</label>
              <div className="flex space-x-2">
                <button 
                  type="button"
                  onClick={() => setEasyAccess(true)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${easyAccess === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
                >
                  Easy
                </button>
                <button 
                  type="button"
                  onClick={() => setEasyAccess(false)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${easyAccess === false ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
                >
                  Tight
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 tracking-wider flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" /> Field Notes
            </label>
            <textarea 
              placeholder="Drop yard conditions, guard shack speed, parking..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-transparent border border-gray-800 text-gray-400 hover:text-white rounded-xl font-bold tracking-wide transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-bold tracking-wide transition-all ${
                rating > 0 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'SAVING...' : 'POST REVIEW'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
