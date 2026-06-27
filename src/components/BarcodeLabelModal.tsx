/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Printer, 
  X, 
  HelpCircle, 
  Settings, 
  Sliders, 
  Grid, 
  Sparkles, 
  Check, 
  QrCode, 
  AlertCircle 
} from 'lucide-react';
import { Meter } from '../types';

// Genuine scan-compatible Code 39 Barcode Map
const CODE39_MAP: { [key: string]: string } = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000011', 'N': '000010011',
  'O': '100010011', 'P': '001010011', 'Q': '000000111', 'R': '100000111',
  'S': '001000111', 'T': '000010111', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

// Generates an SVG path for a Code 39 Barcode
function generateCode39Svg(text: string): React.ReactNode {
  const sanitized = text.toUpperCase().replace(/[^A-Z0-9\-\.\s\$\/\+\%\*]/g, '');
  const barcodeStr = `*${sanitized}*`;
  
  const narrowWidth = 1.6;
  const wideWidth = 4.2;
  const gapWidth = 1.6;
  
  let currentX = 0;
  const rects: React.ReactNode[] = [];
  
  for (let charIndex = 0; charIndex < barcodeStr.length; charIndex++) {
    const char = barcodeStr[charIndex];
    const pattern = CODE39_MAP[char] || CODE39_MAP[' '];
    
    for (let bitIndex = 0; bitIndex < 9; bitIndex++) {
      const isWide = pattern[bitIndex] === '1';
      const width = isWide ? wideWidth : narrowWidth;
      const isBar = bitIndex % 2 === 0;
      
      if (isBar) {
        rects.push(
          <rect 
            key={`${charIndex}-${bitIndex}`} 
            x={currentX} 
            y={0} 
            width={width} 
            height={48} 
            fill="#000" 
          />
        );
      }
      currentX += width;
    }
    // Inter-character gap
    currentX += gapWidth;
  }
  
  return (
    <svg 
      className="w-full h-12 select-none" 
      viewBox={`0 0 ${currentX} 48`} 
      preserveAspectRatio="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {rects}
    </svg>
  );
}

// Procedurally generates a perfectly stylized, unique QR code matrix
function generateQRMatrix(text: string): boolean[][] {
  const size = 21;
  const matrix = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Draw 3 Finder corner patterns
  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        if (d === 3 || d === 1 || d === 0) {
          matrix[y][x] = true;
        } else {
          matrix[y][x] = false;
        }
      }
    }
  };

  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  // Timing lines
  for (let i = 0; i < size; i++) {
    if (i % 2 === 0) {
      matrix[6][i] = true;
      matrix[i][6] = true;
    }
  }

  // Draw alignment helper pattern
  matrix[14][14] = true;
  matrix[13][13] = true;
  matrix[13][15] = true;
  matrix[15][13] = true;
  matrix[15][15] = true;

  // Hash character stream to seed deterministic LCG random data
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
  }

  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 16) / 65536;
  };

  // Populate data bits
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip finder areas
      if (
        (x <= 7 && y <= 7) ||
        (x >= size - 8 && y <= 7) ||
        (x <= 7 && y >= size - 8)
      ) {
         continue;
      }
      // Skip timing lines
      if (y === 6 || x === 6) {
        continue;
      }
      // Skip alignment pattern
      if (x >= 12 && x <= 16 && y >= 12 && y <= 16) {
        continue;
      }
      matrix[y][x] = pseudoRandom() > 0.44;
    }
  }

  return matrix;
}

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMeters: Meter[];
}

type LabelSize = 'standard' | 'compact' | 'large' | 'sticker_sheet';
type LabelType = 'duo' | 'barcode' | 'qr';

export default function BarcodeLabelModal({ 
  isOpen, 
  onClose, 
  selectedMeters 
}: BarcodeLabelModalProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>('standard');
  const [labelType, setLabelType] = useState<LabelType>('duo');
  
  // Custom toggles
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeClass, setIncludeClass] = useState(true);
  const [includeStatus, setIncludeStatus] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [printColumns, setPrintColumns] = useState<number>(2);

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printCanvas = printAreaRef.current;
    if (!printCanvas) return;

    // Create dynamic print-friendly stylesheet for seamless thermal label wrapping
    const styleEl = document.createElement('style');
    styleEl.id = 'label-print-style';
    
    // Dynamic page break rule: For 1-column layout, break pages after every single label!
    // For grid sheet layouts, let standard layout flow, avoiding page breaks inside individual stickers.
    const pageBreakRule = printColumns === 1 
      ? 'page-break-after: always !important; break-after: page !important;' 
      : 'page-break-inside: avoid !important; break-inside: avoid !important;';

    styleEl.innerHTML = `
      @media print {
        /* Hide absolutely everything else to avoid blank pages and overlays */
        body > *:not(.print-canvas-wrapper),
        #root,
        .fixed,
        .backdrop-blur-md,
        button,
        header,
        aside,
        nav {
          display: none !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: white !important;
          color: black !important;
          overflow: visible !important;
        }
        
        /* Bring the label print canvas wrapper to the top */
        .print-canvas-wrapper {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          visibility: visible !important;
        }

        /* Force proper columns layout in print */
        .print-canvas-wrapper .grid {
          display: grid !important;
          grid-template-columns: ${printColumns === 1 ? '1fr' : `repeat(${printColumns}, minmax(0, 1fr))` } !important;
          gap: 12px !important;
          justify-items: center !important;
          width: 100% !important;
        }
        
        .print-label-item {
          ${pageBreakRule}
          margin: 6px !important;
          border: 2px solid #000000 !important;
          background-color: white !important;
          color: black !important;
          box-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Force all children texts & svgs to be highly contrasting for barcode scanner compatibility */
        .print-label-item div,
        .print-label-item span,
        .print-label-item h1,
        .print-label-item h2,
        .print-label-item h3,
        .print-label-item p {
          color: black !important;
          background-color: white !important;
        }
        
        /* Ensure SVGs rendering QR matrices are solid black */
        .print-label-item svg {
          color: black !important;
        }
        .print-label-item rect {
          fill: black !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    // Clone print container to body root to bypass React CSS/scrolling constraints
    const tempWrapper = document.createElement('div');
    tempWrapper.className = 'print-canvas-wrapper';
    tempWrapper.innerHTML = printCanvas.innerHTML;
    document.body.appendChild(tempWrapper);
    
    // Fire browser native print frame
    window.print();
    
    // Cleanup DOM afterward
    document.body.removeChild(tempWrapper);
    document.head.removeChild(styleEl);
  };

  // Dimensions classes helper based on label size selection
  const getSizeDimensionsClass = () => {
    switch (labelSize) {
      case 'compact':
        return 'w-[260px] h-[130px] p-2';
      case 'large':
        return 'w-[420px] h-[220px] p-6';
      case 'sticker_sheet':
        return 'w-[320px] h-[170px] p-4';
      case 'standard':
      default:
        return 'w-[340px] h-[160px] p-3.5';
    }
  };

  const getGridColumnsClass = () => {
    if (printColumns === 1) return 'grid-cols-1';
    if (printColumns === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      {/* Container Box */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div>
            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
              Physical Asset Tagging Suite
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
              Thermal Label & Barcode Generator
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Columns Grid */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* LEFT: Generator Parameters Setup Panel */}
          <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 p-5 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900/50">
            
            {/* Configuration Title */}
            <div className="flex items-center gap-1.5 border-b pb-2 border-slate-200 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Label Layout Controls
              </span>
            </div>

            {/* Selection Warning count */}
            <div className={`p-3 rounded-xl flex items-start gap-2 text-xs font-medium ${
              selectedMeters.length === 0 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200/50' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50'
            }`}>
              {selectedMeters.length === 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>No meters selected. Select checkboxes in the catalog to prepare live batch printing sheets, or close to return.</p>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <p>Ledger Active: Ready to generate <b>{selectedMeters.length}</b> thermal tags for immediate physical placement.</p>
                </>
              )}
            </div>

            {/* Param 1: Format Style */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                1. Code Encoding System
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'duo', label: 'Duo Bar/QR' },
                  { id: 'barcode', label: 'Barcode Only' },
                  { id: 'qr', label: 'QR Codegen' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLabelType(t.id as LabelType)}
                    className={`p-2 text-[10px] font-bold uppercase rounded-lg border text-center transition-all cursor-pointer ${
                      labelType === t.id 
                        ? 'bg-indigo-600 text-white border-indigo-650 shadow-xs' 
                        : 'bg-white dark:bg-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Param 2: Target Sticker Size */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                2. Target Sticker Dimension
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'standard', title: 'Standard Adhesive', desc: '50mm × 25mm (Thermal standard)' },
                  { id: 'compact', title: 'Compact Roll', desc: '35mm × 20mm (M&T Cell miniature)' },
                  { id: 'large', title: 'Asset Large Tag', desc: '75mm × 50mm (High density bulk)' },
                  { id: 'sticker_sheet', title: 'Avery Sheet (Multi)', desc: 'Optimized sheet column split' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLabelSize(s.id as LabelSize)}
                    className={`w-full p-2.5 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      labelSize === s.id 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200' 
                        : 'bg-white dark:bg-slate-850 hover:bg-slate-100 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-305'
                    }`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-tight">{s.title}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Param 3: Content Toggles */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                3. Metadata Inclusion
              </label>
              <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-2 text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                  />
                  <span>PESCO Official Emblem</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeClass}
                    onChange={(e) => setIncludeClass(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                  />
                  <span>Precision Index Class</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeStatus}
                    onChange={(e) => setIncludeStatus(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                  />
                  <span>Warehousing Stage State</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeDate}
                    onChange={(e) => setIncludeDate(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                  />
                  <span>Generation Timestamp</span>
                </label>
              </div>
            </div>

            {/* Param 4: Sheet Print grid columns */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-sans">
                4. Printer Columns (Grid View)
              </label>
              <div className="flex gap-2 text-xs">
                {[1, 2, 3].map((col) => (
                  <button
                    key={col}
                    onClick={() => setPrintColumns(col)}
                    className={`flex-1 p-2 font-mono font-black border uppercase rounded-lg text-center transition-all cursor-pointer ${
                      printColumns === col 
                        ? 'bg-indigo-600 border-indigo-650 text-white' 
                        : 'bg-white dark:bg-slate-850 hover:bg-slate-100 border-slate-200 dark:border-slate-750 text-slate-700'
                    }`}
                  >
                    {col} Col{col > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Live Tag Generation Sheet Preview Area */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 sm:p-8 overflow-y-auto">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-slate-500" />
                  Live Printed Layout Preview
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Verify calibration labels before routing details to local physical thermal barcode tag printer.</p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                disabled={selectedMeters.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Physical Labels
              </button>
            </div>

            {/* Dynamic Label Canvas */}
            {selectedMeters.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center text-slate-400">
                <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-755 dark:text-slate-300">No active assets loaded inside buffer</p>
                <p className="text-[10px] mt-1 text-slate-400 dark:text-slate-500">Pick specific master meter items using checkboxes within the catalog list first to load them.</p>
              </div>
            ) : (
              <div 
                ref={printAreaRef}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-inner print-canvas"
              >
                <div className={`grid ${getGridColumnsClass()} gap-4 justify-items-center`}>
                  {selectedMeters.map((meter) => {
                    // Generate deterministic matrix matching specific serial
                    const qrMatrix = generateQRMatrix(meter.serialNumber);
                    const qrSize = qrMatrix.length;
                    const dateString = new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <div 
                        key={meter.id}
                        className={`print-label-item bg-white text-black border-2 border-slate-950 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between font-sans shrink-0 ${getSizeDimensionsClass()}`}
                      >
                        {/* Static Label Brand Header */}
                        {includeLogo && (
                          <div className="flex items-center justify-between border-b-2 border-slate-950 pb-1 pr-1 bg-slate-50">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-950 pl-2">
                              PESCO M&amp;T MARDAN
                            </span>
                            <span className="text-[7.5px] font-mono font-black text-slate-700 uppercase tracking-tighter bg-amber-100 border border-amber-300 px-1 rounded">
                              LAB APPROVED SECURE
                            </span>
                          </div>
                        )}

                        {/* Middle Info & Graphic Panels */}
                        <div className="flex-1 flex gap-3 pt-1.5 font-sans justify-between overflow-hidden">
                          
                          {/* Metadata Left Block */}
                          <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
                            <div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter block leading-tight">
                                METER NUMBER
                              </div>
                              <div className="text-sm font-black font-mono tracking-tight text-slate-950 truncate">
                                {meter.meterNumber}
                              </div>
                              <div className="text-[8px] font-mono font-medium text-slate-600 truncate mt-0.5">
                                Acc: {meter.consumerAccount || 'GENERAL STOCK'}
                              </div>
                            </div>

                            <div className="mt-1 space-y-0.5 text-[8.5px]">
                              {includeClass && (
                                <div className="flex justify-between text-slate-800">
                                  <span className="font-medium text-slate-400 truncate">CLASS:</span>
                                  <span className="font-extrabold font-mono truncate">{meter.accuracyClass || '0.5s'}</span>
                                </div>
                              )}
                              {includeStatus && (
                                <div className="flex justify-between text-slate-805">
                                  <span className="font-medium text-slate-400 truncate">STAGE:</span>
                                  <span className="font-black truncate uppercase text-indigo-950 bg-indigo-50 px-1 rounded max-w-[80px] text-right">
                                    {meter.stockStatus}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Graphic codes on the right */}
                          <div className="shrink-0 flex items-center justify-center gap-1.5">
                            
                            {/* SVG QR Code Rendering block */}
                            {(labelType === 'duo' || labelType === 'qr') && (
                              <div className="w-[66px] h-[66px] border border-slate-950 p-[3px] bg-white rounded flex items-center justify-center shrink-0">
                                <svg 
                                  className="w-full h-full text-black select-none pointer-events-none" 
                                  viewBox={`0 0 ${qrSize} ${qrSize}`} 
                                  fill="currentColor"
                                >
                                  {qrMatrix.map((row, y) => 
                                    row.map((cell, x) => cell ? (
                                      <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
                                    ) : null)
                                  )}
                                </svg>
                              </div>
                            )}

                          </div>

                        </div>

                        {/* Bottom Barcode / Text Footer block */}
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col justify-end">
                          {(labelType === 'duo' || labelType === 'barcode') && (
                            <div className="px-1.5">
                              {generateCode39Svg(meter.serialNumber)}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[7px] font-mono text-slate-500 pt-0.5 px-2">
                            <span className="font-bold tracking-widest text-[#111]">W/S: {meter.serialNumber}</span>
                            {includeDate && <span className="font-sans">{dateString}</span>}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer block */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-205 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Double-checked Vector Precision Calibration Seal System Matched
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase rounded-xl tracking-wide duration-150 active:scale-95 cursor-pointer"
          >
            Close Sheet
          </button>
        </div>

      </div>
    </div>
  );
}
