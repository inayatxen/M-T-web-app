/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import jsQR from 'jsqr';
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
  Search,
  Sliders,
  RotateCw,
  RotateCcw,
  Minimize2,
  Maximize2
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
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [imageScale, setImageScale] = useState<number>(1.0);
  const [imagePanX, setImagePanX] = useState<number>(0);
  const [imagePanY, setImagePanY] = useState<number>(0);
  const [isDecodingImage, setIsDecodingImage] = useState<boolean>(false);
  const [scanSuccessOverlay, setScanSuccessOverlay] = useState<boolean>(false);
  const [pendingScanResult, setPendingScanResult] = useState<string | null>(null);

  // Reset zoom and uploaded image when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
      setUploadedImageSrc('');
      setUploadedFile(null);
      setImageRotation(0);
      setImageScale(1.0);
      setImagePanX(0);
      setImagePanY(0);
      setIsDecodingImage(false);
      setScanSuccessOverlay(false);
      setPendingScanResult(null);
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
              handleScanSuccess(resultText);
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

  // Reusable helper to handle decodes with an elegant success delay and overlay animation
  const handleScanSuccess = (text: string, skipDelay: boolean = false) => {
    setScanResult(text);
    triggerBeep();

    if (skipDelay) {
      setPendingScanResult(text);
      return;
    }

    // Stop active camera scan scanning so the feed freezes nicely
    stopCameraStream();

    // Trigger visual feedback overlay
    setScanSuccessOverlay(true);

    // Short satisfying delay so the user clearly sees the visual confirmation overlay
    setTimeout(() => {
      setScanSuccessOverlay(false);
      setPendingScanResult(text);
    }, 1000);
  };

  const handleCancelScan = () => {
    setPendingScanResult(null);
    setScanResult('');
    if (activeTab === 'camera') {
      startCamera(selectedDeviceId);
    }
  };

  const handleConfirmScan = () => {
    if (pendingScanResult) {
      onScan(pendingScanResult);
      setPendingScanResult(null);
      setScanResult('');
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

  // Generates a canvas applying user's rotation, scale, and pan transformations
  const getTransformedCanvas = (
    img: HTMLImageElement, 
    rotation: number, 
    scale: number, 
    panX: number, 
    panY: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    let w = img.width;
    let h = img.height;
    
    // Scale down if extremely high res to speed up decoding and remove high-frequency noise
    const maxDim = 800;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    // Canvas size depends on rotation (if 90 or 270, swap dimensions so we don't clip the image!)
    const isRotated90 = rotation === 90 || rotation === 270;
    canvas.width = isRotated90 ? h : w;
    canvas.height = isRotated90 ? w : h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Solid white background to ensure optimal barcode binarization contrast
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply translations starting from canvas center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotate canvas
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Scale canvas
    ctx.scale(scale, scale);
    
    // Translate canvas based on user pan inputs (normalized relative to canvas size)
    // Map -100..100 percentage to actual canvas dimensions
    const actualPanX = (panX / 100) * w;
    const actualPanY = (panY / 100) * h;
    ctx.translate(actualPanX, actualPanY);

    // Draw the source image centered
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    return canvas;
  };

  // File upload reader fallback with robust multi-pass alignment-aware decoders
  const processImageFile = async (
    file: File, 
    r: number = 0, 
    s: number = 1.0, 
    px: number = 0, 
    py: number = 0
  ) => {
    setFileError('');
    if (!file.type.startsWith('image/')) {
      setFileError('The selected file must be an image.');
      return;
    }

    setIsDecodingImage(true);
    let decodedText: string | null = null;
    const imgUrl = URL.createObjectURL(file);
    setUploadedImageSrc(imgUrl);
    setUploadedFile(file);

    try {
      const codeReader = new BrowserMultiFormatReader();

      // Load image to HTMLImageElement
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (e) => reject(e);
        image.src = imgUrl;
      });

      // Pass 1: Draw transformed/aligned viewport
      const canvasTransformed = getTransformedCanvas(img, r, s, px, py);
      const w = canvasTransformed.width;
      const h = canvasTransformed.height;

      const ctxTransformed = canvasTransformed.getContext('2d');
      
      // Try jsQR (extremely fast, specialized for QR) on transformed image
      if (ctxTransformed) {
        try {
          const imgData = ctxTransformed.getImageData(0, 0, w, h);
          const qrResult = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: "attemptBoth"
          });
          if (qrResult && qrResult.data) {
            decodedText = qrResult.data.trim();
          }
        } catch (e) {
          console.warn("jsQR on transformed failed:", e);
        }
      }

      // If still not decoded, try ZXing multi-format on transformed image
      if (!decodedText) {
        try {
          const dataUrlTransformed = canvasTransformed.toDataURL('image/jpeg', 0.9);
          const result = await codeReader.decodeFromImageUrl(dataUrlTransformed);
          if (result) {
            decodedText = result.getText().trim();
          }
        } catch (e) {
          console.log("ZXing on transformed failed:", e);
        }
      }

      // Pass 2: Enhanced Contrast & Grayscale on transformed viewport (helps with shadow and exposure)
      if (!decodedText && ctxTransformed) {
        const canvasEnhanced = document.createElement('canvas');
        canvasEnhanced.width = w;
        canvasEnhanced.height = h;
        const ctxEnhanced = canvasEnhanced.getContext('2d');
        if (ctxEnhanced) {
          ctxEnhanced.filter = 'contrast(1.65) grayscale(1)';
          ctxEnhanced.drawImage(canvasTransformed, 0, 0);

          try {
            const imgData = ctxEnhanced.getImageData(0, 0, w, h);
            const qrResult = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "attemptBoth"
            });
            if (qrResult && qrResult.data) {
              decodedText = qrResult.data.trim();
            }
          } catch (e) {
            console.warn("jsQR on enhanced failed:", e);
          }

          if (!decodedText) {
            try {
              const dataUrlEnhanced = canvasEnhanced.toDataURL('image/jpeg', 0.9);
              const result = await codeReader.decodeFromImageUrl(dataUrlEnhanced);
              if (result) {
                decodedText = result.getText().trim();
              }
            } catch (e) {
              console.log("ZXing on enhanced failed:", e);
            }
          }
        }
      }

      // Pass 3: Deep Black High Contrast Binarization on transformed viewport
      if (!decodedText && ctxTransformed) {
        const canvasHighContrast = document.createElement('canvas');
        canvasHighContrast.width = w;
        canvasHighContrast.height = h;
        const ctxHighContrast = canvasHighContrast.getContext('2d');
        if (ctxHighContrast) {
          ctxHighContrast.filter = 'contrast(2.4) brightness(0.8) grayscale(1)';
          ctxHighContrast.drawImage(canvasTransformed, 0, 0);

          try {
            const imgData = ctxHighContrast.getImageData(0, 0, w, h);
            const qrResult = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "attemptBoth"
            });
            if (qrResult && qrResult.data) {
              decodedText = qrResult.data.trim();
            }
          } catch (e) {
            console.warn("jsQR on high contrast failed:", e);
          }

          if (!decodedText) {
            try {
              const dataUrlHighContrast = canvasHighContrast.toDataURL('image/jpeg', 0.9);
              const result = await codeReader.decodeFromImageUrl(dataUrlHighContrast);
              if (result) {
                decodedText = result.getText().trim();
              }
            } catch (e) {
              console.log("ZXing on high contrast failed:", e);
            }
          }
        }
      }

      if (decodedText) {
        handleScanSuccess(decodedText);
      } else {
        setFileError('No QR/Barcode found. Adjust rotation, zoom, or align the code in the center target frame and retry.');
      }
    } catch (err) {
      console.error(err);
      setFileError('Image processing error. Please check that the file is not corrupted, or input manually below.');
    } finally {
      setIsDecodingImage(false);
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
    
    handleScanSuccess(trimmed, true);
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

  const renderDecodedDataAlert = (dataStr: string) => {
    let parsed: any = null;
    let isJson = false;
    try {
      const trimmed = dataStr.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsed = JSON.parse(trimmed);
        isJson = true;
      }
    } catch (e) {
      // not JSON
    }

    if (isJson && parsed) {
      return (
        <div className="space-y-3">
          <div className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Scanned Equipment Specifications:</div>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {Object.entries(parsed).map(([key, val]) => {
              if (typeof val === 'object' && val !== null) {
                return (
                  <div key={key} className="col-span-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">{key}</span>
                    <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                  </div>
                );
              }
              return (
                <div key={key} className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-100 mt-1 truncate" title={String(val)}>
                    {String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Raw Decoded String/Tag Value:</div>
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-center">
          <p className="text-sm font-mono font-black text-emerald-400 break-all select-all tracking-wider">
            {dataStr}
          </p>
        </div>
      </div>
    );
  };

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
      <div className="relative bg-slate-900 border border-slate-850 text-white rounded-2xl shadow-2xl max-w-4xl lg:max-w-5xl w-full overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-150">
        
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
                <div className={`relative h-[400px] sm:h-[500px] md:h-[620px] rounded-xl bg-black overflow-hidden shadow-inner group transition-all duration-300 ${scanSuccessOverlay ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/20' : 'border border-slate-850'}`}>
                  {isScanning && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                      
                      {/* Glowing Laser Scan Target Rect */}
                      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 border-2 border-dashed border-indigo-400/60 rounded-xl flex items-center justify-center">
                        {/* Focus ticks */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-400 -mt-1.5 -ml-1.5 rounded-tl-md" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-400 -mt-1.5 -mr-1.5 rounded-tr-md" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-400 -mb-1.5 -ml-1.5 rounded-bl-md" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-400 -mb-1.5 -mr-1.5 rounded-br-md" />

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
                    className={`w-full h-full object-cover transition-all duration-300 ${scanSuccessOverlay ? 'brightness-50' : ''}`}
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    muted
                    playsInline
                  />

                  {/* Success Overlay Checkmark */}
                  {scanSuccessOverlay && (
                    <div className="absolute inset-0 bg-emerald-950/40 z-30 flex flex-col items-center justify-center animate-in fade-in duration-250">
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-in zoom-in-75 duration-250 ring-8 ring-emerald-400/20">
                        <Check className="w-10 h-10 stroke-[3]" />
                      </div>
                      <span className="mt-4 text-emerald-400 font-black tracking-widest uppercase text-xs bg-slate-950/95 border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-lg">
                        Success Decoded!
                      </span>
                    </div>
                  )}

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
                  Static Sticker Scan Fallback &amp; Image Preview
                </div>
                
                <div className={uploadedImageSrc ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-2"}>
                  {uploadedImageSrc && (
                    <div className={`rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${scanSuccessOverlay ? 'border-2 border-emerald-500 bg-emerald-950/10 ring-4 ring-emerald-500/10' : 'border border-slate-800 bg-slate-950/60'}`}>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 absolute top-3 left-3 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800 z-10 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isDecodingImage ? 'bg-amber-500 animate-ping' : scanSuccessOverlay ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`}></span>
                        {isDecodingImage ? 'Analyzing Image...' : scanSuccessOverlay ? 'Successfully Decoded!' : 'Uploaded Photo Preview'}
                      </span>
                      <button
                        type="button"
                        disabled={isDecodingImage || scanSuccessOverlay}
                        onClick={() => {
                          setUploadedImageSrc('');
                          setUploadedFile(null);
                        }}
                        className="absolute top-3 right-3 p-1 bg-slate-900/90 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-800 hover:border-rose-900/40 rounded-lg transition-colors cursor-pointer z-10 text-[10px] font-black uppercase px-2 flex items-center gap-1 active:scale-95 duration-100 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear
                      </button>

                      {/* Interactive Alignment Sandbox Stage */}
                      <div className="w-full h-56 rounded-lg overflow-hidden border border-slate-850 flex items-center justify-center bg-black/60 mt-6 relative">
                        <img 
                          src={uploadedImageSrc} 
                          alt="Uploaded snapshot QR" 
                          style={{
                            transform: `translate(${imagePanX}px, ${imagePanY}px) rotate(${imageRotation}deg) scale(${imageScale})`,
                            transformOrigin: 'center center',
                          }}
                          className={`max-h-full max-w-full object-contain transition-all duration-200 ${isDecodingImage ? 'brightness-50 blur-[1px]' : ''} ${scanSuccessOverlay ? 'brightness-40' : ''}`}
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* High-Tech Scan Reticle / Guide Area Overlay */}
                        <div className="absolute inset-4 border border-dashed border-indigo-500/40 rounded-lg pointer-events-none flex items-center justify-center">
                          <div className="w-3/5 h-3/5 border border-indigo-400/20 rounded flex items-center justify-center relative">
                            {/* Center reticle */}
                            <div className="absolute w-3 h-0.5 bg-indigo-400/50"></div>
                            <div className="absolute h-3 w-0.5 bg-indigo-400/50"></div>
                            {/* Corner brackets */}
                            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-indigo-500"></div>
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-indigo-500"></div>
                            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-indigo-500"></div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-500"></div>
                          </div>
                        </div>

                        {isDecodingImage && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/40 animate-in fade-in z-20">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="text-[10px] font-mono font-black text-indigo-300 tracking-wide uppercase">Running Multi-Pass Decoders</span>
                          </div>
                        )}
                        
                        {scanSuccessOverlay && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-950/45 animate-in fade-in duration-200 z-20">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in-75 ring-4 ring-emerald-400/20">
                              <Check className="w-6 h-6 stroke-[3]" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-slate-950/95 px-2.5 py-1 rounded border border-emerald-500/30 shadow">Success!</span>
                          </div>
                        )}
                      </div>

                      {/* Display Status */}
                      <div className="w-full mt-2.5 mb-1">
                        {isDecodingImage ? (
                          <p className="text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1.5 bg-amber-950/20 py-1.5 rounded-lg border border-amber-900/30 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Applying High-Contrast Filter Matrix...
                          </p>
                        ) : scanSuccessOverlay ? (
                          <p className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-950/30 py-1.5 rounded-lg border border-emerald-500/40">
                            <Check className="w-3.5 h-3.5" />
                            Success: Decoded Successfully!
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold text-indigo-400 flex items-center justify-center gap-1.5 bg-indigo-950/20 py-1.5 rounded-lg border border-indigo-900/30">
                            <Sliders className="w-3.5 h-3.5" />
                            Adjust alignment of code inside target frame
                          </p>
                        )}
                      </div>

                      {/* Alignment Control Panel */}
                      <div className="w-full bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-3 text-left mt-2 z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-black text-indigo-400 tracking-wider flex items-center gap-1.5">
                            <Sliders className="w-3 h-3" />
                            Alignment Precision Dashboard
                          </span>
                          <button
                            type="button"
                            disabled={isDecodingImage || scanSuccessOverlay}
                            onClick={() => {
                              setImageRotation(0);
                              setImageScale(1.0);
                              setImagePanX(0);
                              setImagePanY(0);
                            }}
                            className="text-[8px] uppercase font-bold text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 transition-colors disabled:opacity-40"
                          >
                            Reset
                          </button>
                        </div>

                        {/* Rotate control */}
                        <div className="space-y-1">
                          <label className="text-[8.5px] uppercase font-black text-slate-400 flex justify-between">
                            <span>Rotation Angle</span>
                            <span className="font-mono text-indigo-400">{imageRotation}°</span>
                          </label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={isDecodingImage || scanSuccessOverlay}
                              onClick={() => setImageRotation(prev => (prev - 90 + 360) % 360)}
                              className="flex-1 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-[9px] uppercase tracking-wider rounded-md border border-slate-800 flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
                              Left 90°
                            </button>
                            <button
                              type="button"
                              disabled={isDecodingImage || scanSuccessOverlay}
                              onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                              className="flex-1 py-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-[9px] uppercase tracking-wider rounded-md border border-slate-800 flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <RotateCw className="w-2.5 h-2.5 text-slate-400" />
                              Right 90°
                            </button>
                          </div>
                        </div>

                        {/* Zoom slider */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[8.5px] uppercase font-black text-slate-400">
                            <span>Target Zoom / Scale</span>
                            <span className="font-mono text-indigo-400">{imageScale.toFixed(2)}x</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Minimize2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <input
                              type="range"
                              min="1.0"
                              max="3.0"
                              step="0.05"
                              disabled={isDecodingImage || scanSuccessOverlay}
                              value={imageScale}
                              onChange={(e) => setImageScale(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-850 rounded appearance-none cursor-pointer accent-indigo-500"
                            />
                            <Maximize2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          </div>
                        </div>

                        {/* Horizontal Pan */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[8.5px] uppercase font-black text-slate-400">
                            <span>Horizontal Shift</span>
                            <span className="font-mono text-indigo-400">{imagePanX > 0 ? `+${imagePanX}` : imagePanX}px</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-mono text-slate-500">L</span>
                            <input
                              type="range"
                              min="-150"
                              max="150"
                              step="1"
                              disabled={isDecodingImage || scanSuccessOverlay}
                              value={imagePanX}
                              onChange={(e) => setImagePanX(parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-850 rounded appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-[8px] font-mono text-slate-500">R</span>
                          </div>
                        </div>

                        {/* Vertical Pan */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[8.5px] uppercase font-black text-slate-400">
                            <span>Vertical Shift</span>
                            <span className="font-mono text-indigo-400">{imagePanY > 0 ? `+${imagePanY}` : imagePanY}px</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-mono text-slate-500">T</span>
                            <input
                              type="range"
                              min="-150"
                              max="150"
                              step="1"
                              disabled={isDecodingImage || scanSuccessOverlay}
                              value={imagePanY}
                              onChange={(e) => setImagePanY(parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-850 rounded appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-[8px] font-mono text-slate-500">B</span>
                          </div>
                        </div>

                        {/* Re-decode Button */}
                        <button
                          type="button"
                          disabled={isDecodingImage || scanSuccessOverlay || !uploadedFile}
                          onClick={() => {
                            if (uploadedFile) {
                              processImageFile(uploadedFile, imageRotation, imageScale, imagePanX, imagePanY);
                            }
                          }}
                          className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 duration-100 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isDecodingImage ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Running Decoders...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Analyze Aligned Viewport
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 py-6 text-center transition-all flex flex-col justify-center items-center ${
                      dragActive 
                        ? 'border-indigo-500 bg-indigo-950/20' 
                        : 'border-slate-800 hover:border-slate-750 bg-slate-950/40'
                    } ${uploadedImageSrc ? 'h-full min-h-[11rem]' : ''}`}
                  >
                    <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-300">Drag &amp; drop tag photo here</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[240px] mx-auto">Accepts high-res snapshot files of barcode labels</p>
                    
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
                        handleScanSuccess(preset.value, true);
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

        {/* Verification Alert Overlay before adding any entry */}
        {pendingScanResult !== null && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
              
              {/* Alert Header */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/15 rounded-xl border border-emerald-500/30 text-emerald-400">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-100">Verify Decoded Entry</h4>
                  <p className="text-[10px] text-slate-400">Review scanned details before adding/saving entry</p>
                </div>
              </div>

              <div className="h-px bg-slate-800"></div>

              {/* Alert Content */}
              <div className="space-y-4">
                <p className="text-[11px] text-slate-300 leading-relaxed text-left">
                  The scanner has captured a valid code. Would you like to proceed and import/apply this decoded entry to the laboratory registry?
                </p>

                {renderDecodedDataAlert(pendingScanResult)}
              </div>

              <div className="h-px bg-slate-800"></div>

              {/* Alert Footer Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelScan}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700/60 flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-100 cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  Cancel &amp; Rescan
                </button>
                <button
                  type="button"
                  onClick={handleConfirmScan}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-100 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Confirm &amp; Apply
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
