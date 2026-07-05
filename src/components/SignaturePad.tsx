import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, PenTool, Image as ImageIcon, Trash2 } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onEnd: (dataUrl: string) => void;
  onClear: () => void;
  initialDataUrl?: string;
}

export function SignaturePad({ label, onEnd, onClear, initialDataUrl }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'draw' | 'upload'>(initialDataUrl ? 'upload' : 'draw');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 110 });
  const [loadedInitial, setLoadedInitial] = useState(false);

  // Measure container and set canvas width/height so that coordinate mapping is 1:1
  useEffect(() => {
    if (mode !== 'draw' || !containerRef.current) return;

    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mode]);

  // Load initial signature if provided
  useEffect(() => {
    if (mode === 'draw') {
      setLoadedInitial(false);
    }
  }, [mode]);

  useEffect(() => {
    if (initialDataUrl && sigCanvas.current && mode === 'draw' && !loadedInitial && dimensions.width > 300) {
      sigCanvas.current.fromDataURL(initialDataUrl);
      setLoadedInitial(true);
    }
  }, [initialDataUrl, mode, dimensions, loadedInitial]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG or JPG) for signature.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onEnd(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        
        <div className="flex items-center gap-3">
          {/* Mode Switchers */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setMode('draw');
                clear();
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer select-none ${
                mode === 'draw'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <PenTool className="w-2.5 h-2.5" />
              Draw
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('upload');
                clear();
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer select-none ${
                mode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Upload className="w-2.5 h-2.5" />
              Upload
            </button>
          </div>

          {(initialDataUrl || (mode === 'draw' && sigCanvas.current && !sigCanvas.current.isEmpty())) && (
            <button
              type="button"
              onClick={clear}
              className="text-[9px] text-rose-500 hover:text-rose-600 font-bold uppercase cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-2.5 h-2.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {mode === 'draw' ? (
        <div 
          ref={containerRef}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white rounded-lg overflow-hidden relative" 
          style={{ height: 110 }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{ 
              width: dimensions.width,
              height: dimensions.height,
              className: 'cursor-crosshair block w-full h-full' 
            }}
            onEnd={handleEnd}
            backgroundColor="transparent"
            penColor="#0f172a"
          />
          <div className="absolute bottom-1 right-2 pointer-events-none select-none">
            <span className="text-[8px] text-slate-400 font-semibold uppercase">Sign inside box</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative p-3 transition-all cursor-pointer bg-white ${
            initialDataUrl
              ? 'border-indigo-500 bg-indigo-50/10'
              : isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
          style={{ height: 110 }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {initialDataUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <img
                src={initialDataUrl}
                className="max-h-[65px] object-contain p-1"
                alt="Uploaded signature"
              />
              <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold mt-1 uppercase tracking-tight">
                Signature Image Loaded
              </span>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <div className="flex justify-center text-slate-400 dark:text-slate-500">
                <ImageIcon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-600">
                Drag &amp; drop signature or <span className="text-indigo-600 dark:text-indigo-500">browse</span>
              </p>
              <p className="text-[8px] text-slate-400 font-medium">
                Supports PNG, JPG (transparent recommended)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
