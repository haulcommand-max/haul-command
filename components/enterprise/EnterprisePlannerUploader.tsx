"use client";

import { useState } from "react";
import { UploadCloud, FileType, CheckCircle, AlertCircle, X, ChevronRight, BarChart } from "lucide-react";

export default function EnterprisePlannerUploader() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  
  // Mock results of parsed CSV
  const [routesParsed, setRoutesParsed] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsed(false);
  };

  const processFile = () => {
    if (!file) return;
    setIsUploading(true);
    
    // Simulate parsing processing time
    setTimeout(() => {
      setIsUploading(false);
      setIsParsed(true);
      setRoutesParsed(Math.floor(Math.random() * 50) + 12); // Random mock routes
    }, 1500);
  };

  const resetUploader = () => {
    setFile(null);
    setIsParsed(false);
    setRoutesParsed(0);
  };

  return (
    <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl overflow-hidden relative">
      <div className="p-5 border-b border-[#1e3048] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
             <BarChart className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#f0f2f5]">Project Upload Engine</h2>
            <p className="text-[11px] text-[#566880] mt-0.5">Bulk allocate capacity by uploading standard TMS templates directly into the market.</p>
          </div>
        </div>
        <button 
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#2a4060] text-gray-400 hover:text-white transition-colors"
          onClick={() => alert('Download template feature coming soon.')}
        >
          Download CSV Template
        </button>
      </div>

      <div className="p-6">
        {!file ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all ${
              isDragOver 
                ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' 
                : 'border-[#2a4060] hover:border-gray-500 cursor-pointer'
            }`}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".csv,.xlsx" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className="w-16 h-16 bg-[#1a2636] rounded-full flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className={`w-8 h-8 ${isDragOver ? 'text-blue-400' : 'text-[#566880]'}`} />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Drag & Drop Route File</h3>
            <p className="text-[#566880] text-sm text-center max-w-sm">
              Upload your heavy haul volume requirements (.CSV or .XLSX) to instantly generate smart dispatch bids across the network.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {!isParsed ? (
              <div className="p-6 border border-[#2a4060] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FileType className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{file.name}</h3>
                    <p className="text-[#566880] text-xs">{(file.size / 1024).toFixed(1)} KB · Ready for ingestion</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={resetUploader}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                    disabled={isUploading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={processFile}
                    disabled={isUploading}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                      isUploading 
                        ? 'bg-[#1a2636] text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    }`}
                  >
                    {isUploading ? (
                      <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Map Routes'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Upload Successful</h3>
                      <p className="text-gray-400 text-sm">{routesParsed} routes extracted and verified against corridor intelligence.</p>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-[#0a0d14] p-3 rounded-lg border border-[#1e3048]">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Matched Equipment</p>
                          <p className="text-white font-bold text-lg mt-0.5">100%</p>
                        </div>
                        <div className="bg-[#0a0d14] p-3 rounded-lg border border-[#1e3048]">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Estimated Capacity</p>
                          <p className="text-emerald-400 font-bold text-lg mt-0.5">High</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2">
                    Execute Bulk Dispatch <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
