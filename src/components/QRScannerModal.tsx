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
  QrCode
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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
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
              try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = context.createOscillator();
                const gainNode = context.createGain();
                osc.connect(gainNode);
                gainNode.connect(context.destination);
                osc.frequency.setValueAtTime(880, context.currentTime); // high tone beep
                gainNode.gain.setValueAtTime(0.08, context.currentTime);
                osc.start();
                osc.stop(context.currentTime + 0.1);
              } catch (e) {
                // mute audio failures
              }

              // Trigger decode completion
              stopCameraStream();
              onScan(resultText);
            }
            if (error && error.name !== 'NotFoundException') {
               // Log actual errors, not finding a barcode is expected
            }
          }
        );
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasCameraPermission(false);
      setIsScanning(false);
      setScannerError(
        err.name === 'NotAllowedError' || err.message?.includes('Permission')
          ? 'Camera access denied by user. Refer to browser site permissions.' 
          : `Failed to acquire video stream: ${err.message || err}`
      );
    }
  };

  // Start scanning on open
  useEffect(() => {
    if (isOpen) {
      setScanResult('');
      setFileError('');
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => stopCameraStream();
  }, [isOpen]);

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
        onScan(resultText);
      } else {
        setFileError('Could not decode a valid barcode/QR code in this image. Ensure it is crisp, centered, and well-lit.');
      }
    } catch (err) {
      setFileError('Could not decode a valid barcode/QR code in this image. Ensure it is crisp, centered, and well-lit.');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-8">
        
        {/* Header bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
            aria-label="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Ribbon */}
        <div className="bg-blue-950/40 px-4 py-2 border-b border-blue-900/40 text-[10.5px] text-blue-300 flex items-start gap-1.5 leading-tight">
          <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            Place a meter barcode/QR card containing meter ID or consumer details inside the frame. 
            Forms will parse JSON objects or plain codes automatically.
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-4">
          
          {/* Active Camera Feed Stage */}
          {hasCameraPermission !== false && !scannerError && (
            <div className="relative aspect-video rounded-md bg-black border border-slate-850 overflow-hidden shadow-inner group">
              {isScanning && (
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                  
                  {/* Glowing Laser Scan Target Rect */}
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-blue-400/55 rounded flex items-center justify-center">
                    {/* Focus ticks */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 -mt-1.5 -ml-1.5" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 -mt-1.5 -mr-1.5" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 -mb-1.5 -ml-1.5" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 -mb-1.5 -mr-1.5" />

                    {/* Laser overlay bar */}
                    <div className="absolute w-full h-[2px] bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.7)] animate-bounce" />
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="mt-4 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-[10px] text-blue-300 font-bold tracking-widest uppercase flex items-center gap-1">
                    <Loader2 className="w-3" />
                     Live Analysis Active
                  </div>
                </div>
              )}

              {/* Feed markup */}
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            </div>
          )}

          {/* Camera controls and device dropdown */}
          {hasCameraPermission === true && devices.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-850">
              <Camera className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Source:</span>
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="flex-1 text-xs font-semibold bg-transparent text-white focus:outline-none cursor-pointer"
              >
                {devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-slate-900 text-white">
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fallback File Uploader Zone */}
          <div className="space-y-2">
            <div className="text-[10.5px] uppercase font-black tracking-widest text-slate-400 block pb-1 border-b border-slate-800">
              Alternative Media Input
            </div>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 py-6 text-center transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-950/20' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
              }`}
            >
              <Upload className="w-5 h-5 text-slate-550 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300">Drag or drop QR image here</p>
              <p className="text-[10px] text-slate-450 mt-1">Accepts PNG, JPG, or PDF snapshots</p>
              
              <label className="mt-3 inline-block px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10.5px] rounded cursor-pointer transition-colors active:scale-95">
                Browse Files
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
              <div className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-rose-300 text-[10px] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-400" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Camera Scanning Errors & Fallbacks (e.g., Blocked Permissions) */}
          {(hasCameraPermission === false || scannerError) && (
            <div className="p-3 bg-amber-950/10 border border-amber-900/30 text-amber-300 rounded text-xs leading-relaxed space-y-1.5">
              <div className="font-extrabold flex items-center gap-1 text-amber-400 uppercase tracking-wide text-[10px]">
                <AlertCircle className="w-4 h-4" />
                Laboratory Camera Ingress Disabled
              </div>
              <p className="text-[11px] text-amber-205">
                {scannerError || "Local browser frame configuration blocked direct camera streams. You can utilize the Drag & Drop image uploader container instead to scan high-res meter card copies successfully."}
              </p>
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="mt-1 px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/35 border border-amber-700/50 rounded font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 text-white cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3" />
                Grant Access / Retry Camera Initializer
              </button>
            </div>
          )}

          {/* Success Decoded Text Log Preview */}
          {scanResult && (
            <div className="p-3 rounded bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 space-y-1 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase text-emerald-400 tracking-wider">
                <Check className="w-4 h-4 animate-ping duration-1000 shrink-0" />
                Success: Decode Intact
              </div>
              <p className="text-[11px] font-mono select-all bg-slate-950 p-2 rounded whitespace-pre-wrap max-h-24 overflow-y-auto border border-emerald-900/10 text-slate-200">
                {scanResult}
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer bar */}
        <div className="bg-slate-950 px-4 py-3 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Decoded card indices auto-fill targets</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs rounded transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
