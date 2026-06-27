/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { 
  X, 
  Camera, 
  Upload, 
  AlertCircle, 
  Check, 
  Loader2, 
  RefreshCw, 
  HelpCircle,
  QrCode,
  Keyboard,
  Sparkles,
  FileJson,
  Zap,
  Search
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
  placeholderText?: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Barcode & QR Laboratory Scanner",
  placeholderText = "Center a meter ID card, barcode, or laboratory seal QR code within the frame"
}: QRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>('');
  
  // Manual Input state
  const [manualText, setManualText] = useState<string>('');
  const [manualInputError, setManualInputError] = useState<string>('');
  
  // Camera zoom state
  const [zoom, setZoom] = useState<number>(1);

  // Reset zoom when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
    }
  }, [isOpen]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        // Suppress stop errors
      }
      controlsRef.current = null;
    }
    setIsScanning(false);
  };

  // Enumerate cameras and request stream
  const startCamera = async (deviceId?: string) => {
    stopCameraStream();
    setScannerError('');
    setIsScanning(true);

    try {
      // Enumerate other video sources
      const allDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(allDevices);

      let targetDeviceId = deviceId;
      if (!targetDeviceId && allDevices.length > 0) {
        // Prefer rear camera if available
        const backCamera = allDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        targetDeviceId = backCamera ? backCamera.deviceId : allDevices[0].deviceId;
      }

      if (targetDeviceId) {
        setSelectedDeviceId(targetDeviceId);
      }

      setHasCameraPermission(true);

      const codeReader = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        controlsRef.current = await codeReader.decodeFromVideoDevice(
          targetDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const resultText = result.getText().trim();
              setScanResult(resultText);
              
              // Audio feedback if allowed by user context
              triggerBeep();

              // Trigger decode completion
              stopCameraStream();
              onScan(resultText);
            }
          }
        );
        // Apply initial hardware zoom after a short delay
        setTimeout(() => {
          applyHardwareZoom(zoom);
        }, 300);
      }
    } catch (err: any) {
      console.warn("Camera access warning:", err);
      setHasCameraPermission(false);
      setIsScanning(false);
      setScannerError(
        err.name === 'NotAllowedError' || err.message?.includes('Permission')
          ? 'Camera access denied by browser site settings.' 
          : `No webcam detected or stream blocked: ${err.message || err}`
      );
    }
  };

  // Apply hardware camera zoom constraint if supported by browser / hardware
  const applyHardwareZoom = async (zoomValue: number) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getVideoTracks();
      if (tracks && tracks.length > 0) {
        const track = tracks[0];
        try {
          const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : null;
          if (capabilities && 'zoom' in capabilities) {
            const zoomCap = (capabilities as any).zoom;
            const minZoom = zoomCap.min || 1;
            const maxZoom = zoomCap.max || 3;
            const targetZoom = Math.max(minZoom, Math.min(maxZoom, zoomValue));
            await track.applyConstraints({
              advanced: [{ zoom: targetZoom } as any]
            });
          }
        } catch (err) {
          console.warn("Failed to apply hardware zoom constraint:", err);
        }
      }
    }
  };

  // Monitor zoom changes to apply hardware zoom dynamically
  useEffect(() => {
    if (isScanning) {
      applyHardwareZoom(zoom);
    }
  }, [zoom, isScanning]);

  // Play audio beep on successful scan
  const triggerBeep = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gainNode = context.createGain();
      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.frequency.setValueAtTime(950, context.currentTime); // Crisp scan tone
      gainNode.gain.setValueAtTime(0.06, context.currentTime);
      osc.start();
      osc.stop(context.currentTime + 0.08);
    } catch (e) {
      // ignore audio errors
    }
  };

  // Start scanning on open (or when switching tabs)
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      setScanResult('');
      setFileError('');
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => stopCameraStream();
  }, [isOpen, activeTab]);

  // Device change handler
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // File upload reader fallback
  const processImageFile = async (file: File) => {
    setFileError('');
    if (!file.type.startsWith('image/')) {
      setFileError('The selected file must be an image.');
      return;
    }

    try {
      const imgUrl = URL.createObjectURL(file);
      const codeReader = new BrowserMultiFormatReader();
      const result = await codeReader.decodeFromImageUrl(imgUrl);
      if (result) {
        const resultText = result.getText().trim();
        setScanResult(resultText);
        triggerBeep();
        onScan(resultText);
      } else {
        setFileError('No QR/Barcode found in this image. Ensure it is sharp, clear, and highly focused.');
      }
    } catch (err) {
      setFileError('Barcode recognition failed for this image. Try another image or use manual entry below.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave" || e.type === "drop") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualInputError('');
    const trimmed = manualText.trim();
    if (!trimmed) {
      setManualInputError('Please type or select a barcode code to simulate scanning.');
      return;
    }
    
    triggerBeep();
    onScan(trimmed);
  };

  // Demo Simulation Presets
  const simulationPresets = [
    {
      name: "Single Phase Dispute Meter (Full JSON specs)",
      type: "JSON Specification Card",
      icon: <FileJson className="w-3.5 h-3.5 text-indigo-400" />,
      value: JSON.stringify({
        consumerAccount: "14125893049581",
        consumerName: "Muhammad Younas",
        fatherName: "Fazal Ghafoor",
        meterType: "single_phase",
        meterNumber: "MTR-SP-2026-9045",
        serialNumber: "SN-90812-PESCO",
        make: "KBK Electronics",
        receivedFrom: "Mardan Rural Division",
        reasonForTesting: "Consumer Dispute (Slow Running Complaint)",
        remarks: "Received via manual dispute desk register inward tag."
      }, null, 2)
    },
    {
      name: "Three Phase Whole Current Meter (Full JSON specs)",
      type: "JSON Specification Card",
      icon: <FileJson className="w-3.5 h-3.5 text-indigo-400" />,
      value: JSON.stringify({
        consumerAccount: "14211593840291",
        consumerName: "Ahmad Shah",
        fatherName: "Sher Shah",
        meterType: "three_phase_whole",
        meterNumber: "MTR-3PH-55928",
        serialNumber: "SN-77281-W",
        make: "Microtech Industries",
        receivedFrom: "Mardan Cantt Division",
        reasonForTesting: "Damaged Terminal Cover & Burnt Display",
        remarks: "Line testing request submitted by Sub-Divisional Officer."
      }, null, 2)
    },
    {
      name: "Typical Meter Serial Number Tag",
      type: "Raw Code Tag",
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      value: "SN-90812-PESCO"
    },
    {
      name: "Typical Meter Number Identifier",
      type: "Raw Code Tag",
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      value: "MTR-SP-2026-9045"
    },
    {
      name: "Standard Consumer Account ID",
      type: "Raw Code Tag",
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      value: "14125893049581"
    },
    {
      name: "Existing Report Reference Number",
      type: "Raw Code Tag",
      icon: <Search className="w-3.5 h-3.5 text-blue-400" />,
      value: "REP-2026-0012"
    }
  ];

  if (!isOpen) return null;

  // Detect if pasted text looks like JSON
  const isPastedJson = (() => {
    try {
      const trimmed = manualText.trim();
      return trimmed.startsWith('{') && trimmed.endsWith('}');
    } catch {
      return false;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl shadow-2xl max-w-2xl md:max-w-3xl w-full overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-150">
        
        {/* Header bar */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
              <QrCode className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">{title}</h3>
              <p className="text-[10px] text-slate-400">High-performance optical &amp; manual keyway emulator</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs to Switch Modes */}
        <div className="grid grid-cols-2 bg-slate-950/50 border-b border-slate-850 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera / Image Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Keyboard / Simulator
          </button>
        </div>

        {/* Info Ribbon */}
        <div className="bg-slate-950 px-5 py-2.5 border-b border-slate-850 text-[10.5px] text-slate-400 flex items-start gap-1.5 leading-tight">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            {activeTab === 'camera' 
              ? placeholderText
              : "Use manual typing or simulate pre-defined laboratory tags to easily register, search, or update without an active camera stream."
            }
          </div>
        </div>

        {/* Scrollable Container Box */}
        <div className="p-5 flex-1 flex flex-col space-y-5 overflow-y-auto max-h-[75vh]">
          
          {activeTab === 'camera' ? (
            <>
              {/* TAB 1: ACTIVE CAMERA SCANNING */}
              {hasCameraPermission !== false && !scannerError ? (
                <div className="relative h-[290px] sm:h-[390px] md:h-[460px] rounded-xl bg-black border border-slate-850 overflow-hidden shadow-inner group">
                  {isScanning && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                      
                      {/* Glowing Laser Scan Target Rect */}
                      <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-76 md:h-76 border-2 border-dashed border-indigo-400/60 rounded-xl flex items-center justify-center">
                        {/* Focus ticks */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-indigo-400 -mt-1.5 -ml-1.5 rounded-tl-md" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-indigo-400 -mt-1.5 -mr-1.5 rounded-tr-md" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-indigo-400 -mb-1.5 -ml-1.5 rounded-bl-md" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-indigo-400 -mb-1.5 -mr-1.5 rounded-br-md" />

                        {/* Laser overlay bar */}
                        <div className="absolute w-full h-[2px] bg-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.7)] animate-bounce" />
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/95 text-[9.5px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5 border border-emerald-950">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Webcam Analyzing Feed...
                      </div>
                    </div>
                  )}

                  {/* Video Stream */}
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    muted
                    playsInline
                  />

                  {/* Zoom Controls Overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-slate-800 shadow-xl pointer-events-auto transition-all">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-1 select-none">Zoom</span>
                    {[1, 1.5, 2, 3].map((level) => (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setZoom(level)}
                        className={`w-7 h-7 rounded-full text-[11px] font-black transition-all flex items-center justify-center cursor-pointer ${
                          zoom === level
                            ? 'bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-400/20'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {level}x
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* CAMERA UNAVAILABLE ALERT BANNER */
                <div className="p-4 bg-amber-950/15 border border-amber-900/45 text-amber-300 rounded-xl space-y-2 leading-relaxed">
                  <div className="font-extrabold flex items-center gap-2 text-amber-400 uppercase tracking-wide text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Webcam Access Bypassed
                  </div>
                  <p className="text-[11px] text-amber-200">
                    {scannerError || "Local browser frame configuration blocked direct camera streams. You can utilize the Drag & Drop image uploader container instead or switch to Keyboard / Simulator tab to paste asset records."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(selectedDeviceId)}
                      className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/35 border border-amber-700/50 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-white cursor-pointer duration-150 active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-white cursor-pointer duration-150 active:scale-95 shadow-sm"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      Switch to Manual Mode
                    </button>
                  </div>
                </div>
              )}

              {/* Device Selector */}
              {hasCameraPermission === true && devices.length > 1 && (
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-[10px] uppercase font-bold text-slate-400">Select Camera:</span>
                  <select
                    value={selectedDeviceId}
                    onChange={handleDeviceChange}
                    className="flex-1 text-xs font-black bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    {devices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId} className="bg-slate-900 text-white">
                        {device.label || `Webcam Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* File Uploader fallback */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 block pb-1 border-b border-slate-800">
                  Static Sticker Scan Fallback
                </div>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 py-6 text-center transition-all ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-950/20' 
                      : 'border-slate-800 hover:border-slate-750 bg-slate-950/40'
                  }`}
                >
                  <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-300">Drag &amp; drop tag photo here</p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts high-res snapshot files of barcode labels</p>
                  
                  <label className="mt-3 inline-block px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-[10.5px] uppercase tracking-wide rounded-lg cursor-pointer transition-colors active:scale-95 shadow-sm">
                    Browse File
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          processImageFile(e.target.files[0]);
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                </div>

                {fileError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/50 text-rose-300 text-[10.5px] flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* TAB 2: MANUAL TEXT ENTRY & SIMULATION PANEL */}
              <form onSubmit={handleManualSubmit} className="space-y-3.5">
                <div className="flex justify-between items-center pb-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Keyboard Input Channel
                  </label>
                  {isPastedJson && (
                    <span className="text-[8.5px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-md flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      JSON Specs Detected
                    </span>
                  )}
                </div>
                
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste scanned barcode string, serial numbers (e.g. SN-90812-PESCO), or drag full JSON specification card variables..."
                  className="w-full h-32 p-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all duration-150 active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Submit Manual Code (Trigger Ingress)
                  </button>
                  {manualText && (
                    <button
                      type="button"
                      onClick={() => setManualText('')}
                      className="px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {manualInputError && (
                  <p className="text-rose-400 text-[10.5px] font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {manualInputError}
                  </p>
                )}
              </form>

              {/* QUICK CLICK EMULATOR PRESETS */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 block pb-1 border-b border-slate-800 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  Instant Laboratory Simulation Presets (Click to Scan)
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {simulationPresets.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setManualText(preset.value);
                        // Instantly fire search or fill
                        triggerBeep();
                        onScan(preset.value);
                      }}
                      className="p-3 text-left bg-slate-950/40 hover:bg-indigo-950/20 border border-slate-850 hover:border-indigo-900/60 rounded-xl transition-all flex flex-col justify-between group cursor-pointer duration-100"
                    >
                      <div className="flex justify-between items-start gap-1 w-full">
                        <span className="text-[11px] font-black text-slate-200 group-hover:text-indigo-200 leading-tight">
                          {preset.name}
                        </span>
                        {preset.icon}
                      </div>
                      <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-slate-500 mt-2 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 self-start">
                        {preset.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Decoded Output Log Preview (Universal) */}
          {scanResult && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase text-emerald-400 tracking-wider">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                Decoded Registry Hash Confirmed
              </div>
              <p className="text-[11px] font-mono select-all bg-slate-950 p-2.5 rounded-lg whitespace-pre-wrap max-h-24 overflow-y-auto border border-emerald-900/20 text-slate-100">
                {scanResult}
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer bar */}
        <div className="bg-slate-950 px-5 py-4 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Automatic form sync is pre-wired.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wide rounded-xl transition-all cursor-pointer duration-150 active:scale-95 shadow-sm"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
