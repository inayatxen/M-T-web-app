import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  label: string;
  onEnd: (dataUrl: string) => void;
  onClear: () => void;
  initialDataUrl?: string;
}

export function SignaturePad({ label, onEnd, onClear, initialDataUrl }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        onClear();
      } else {
        onEnd(sigCanvas.current.toDataURL('image/png'));
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={clear}
          className="text-[9px] text-rose-500 hover:text-rose-600 font-bold uppercase"
        >
          Clear
        </button>
      </div>
      <div className="border-2 border-dashed border-slate-300 bg-white rounded-lg overflow-hidden relative" style={{ height: 100 }}>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{ className: 'w-full h-full' }}
          onEnd={handleEnd}
          backgroundColor="transparent"
          penColor="#312e81"
        />
        {initialDataUrl && !sigCanvas.current && (
           <img src={initialDataUrl} className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50" alt="initial signature" />
        )}
      </div>
    </div>
  );
}
