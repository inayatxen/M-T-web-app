import React, { useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface PhotoCaptureProps {
  label?: string;
  photoUrl?: string;
  onChange: (url: string | undefined) => void;
}

export function PhotoCapture({ label = "Capture Nameplate Photo", photoUrl, onChange }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">{label}</label>}
      
      {!photoUrl ? (
        <div className="flex gap-2">
           <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Take Photo</span>
          </button>
          
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 group h-32">
          <img src={photoUrl} alt="Captured" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
