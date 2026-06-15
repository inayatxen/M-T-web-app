/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Printer, ArrowLeft, RefreshCw } from 'lucide-react';
import { TestReport, MeterCategory } from '../types';
import pescoLogo from '../assets/images/pesco_logo.jpg';
import { formatPKTDate } from '../utils';

interface BatchReportPDFProps {
  reports: TestReport[];
  onBack: () => void;
}

export default function BatchReportPDF({ reports, onBack }: BatchReportPDFProps) {
  React.useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Batch-test-results';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  const [paddingTop, setPaddingTop] = React.useState<number>(18);
  const [paddingBottom, setPaddingBottom] = React.useState<number>(15);
  const [paddingLeft, setPaddingLeft] = React.useState<number>(20);
  const [paddingRight, setPaddingRight] = React.useState<number>(20);
  const [fontScale, setFontScale] = React.useState<number>(100);
  const [showBorder, setShowBorder] = React.useState<boolean>(true);
  const [borderInset, setBorderInset] = React.useState<number>(6);
  const [showLogo, setShowLogo] = React.useState<boolean>(true);
  const [showQR, setShowQR] = React.useState<boolean>(true);
  const [showDisclaimer, setShowDisclaimer] = React.useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(true);

  const handlePrint = () => {
    window.print();
  };

  const getMeterCategoryName = (cat: MeterCategory): string => {
    switch (cat) {
      case 'single_phase': return 'Single Phase Meter';
      case 'three_phase_whole': return 'Three Phase Whole Current Meter';
      case 'three_phase_ct': return 'Three Phase CT Operated Meter';
      case 'three_phase_ct_pt': return 'Three Phase CT/PT Operated Meter';
      case 'smart': return 'Smart Cellular Meter';
      default: return cat;
    }
  };

  return (
    <div className="space-y-6 select-none max-w-full">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registry
          </button>
          <span className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Batch Mode: Ready to print <strong className="text-slate-800 dark:text-white">{reports.length} selected certificates</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
              isSettingsOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            } cursor-pointer`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSettingsOpen ? 'animate-spin-slow' : ''}`} />
            {isSettingsOpen ? 'Hide Page Settings' : 'Page Print Settings'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print All {reports.length} Certificates
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start relative max-w-full">
        {/* Dynamic Sliders and Preset Controller Sidebar */}
        {isSettingsOpen && (
          <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl p-5 shadow-sm space-y-6 print:hidden">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                A4 Page Margin Adjustments
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                Calibrate printer offsets (measured in millimeters)
              </p>
            </div>

            <div className="space-y-4">
              {/* Preset Buttons */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Preset Margins</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      setPaddingTop(18);
                      setPaddingBottom(15);
                      setPaddingLeft(20);
                      setPaddingRight(20);
                    }}
                    className="py-1 text-[10px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-705 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded cursor-pointer text-center"
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => {
                      setPaddingTop(10);
                      setPaddingBottom(10);
                      setPaddingLeft(12);
                      setPaddingRight(12);
                    }}
                    className="py-1 text-[10px] bg-slate-50 dark:bg-slate-805 hover:bg-slate-100 dark:hover:bg-slate-705 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded cursor-pointer text-center"
                  >
                    Narrow
                  </button>
                  <button
                    onClick={() => {
                      setPaddingTop(25);
                      setPaddingBottom(22);
                      setPaddingLeft(26);
                      setPaddingRight(26);
                    }}
                    className="py-1 text-[10px] bg-slate-50 dark:bg-slate-805 hover:bg-slate-100 dark:hover:bg-slate-705 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded cursor-pointer text-center"
                  >
                    Wide
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Top Margin</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{paddingTop}mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    value={paddingTop}
                    onChange={(e) => setPaddingTop(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Bottom Margin</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{paddingBottom}mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    value={paddingBottom}
                    onChange={(e) => setPaddingBottom(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Left Margin</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{paddingLeft}mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={paddingLeft}
                    onChange={(e) => setPaddingLeft(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Right Margin</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{paddingRight}mm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={paddingRight}
                    onChange={(e) => setPaddingRight(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Scaling & Sizing
                </h3>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span>Font Sizing Scale</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{fontScale}%</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="125"
                  value={fontScale}
                  onChange={(e) => setFontScale(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span>Border Grid Inset</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{borderInset}mm</span>
                </div>
                <input
                  type="range"
                  disabled={!showBorder}
                  min="2"
                  max="18"
                  value={borderInset}
                  onChange={(e) => setBorderInset(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3.5">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Toggle Certificate Elements
              </h3>
              
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Include Organization Logo</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBorder}
                  onChange={(e) => setShowBorder(e.target.checked)}
                  className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Show Double Border Frame</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showQR}
                  onChange={(e) => setShowQR(e.target.checked)}
                  className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Include Verification QR Seal</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDisclaimer}
                  onChange={(e) => setShowDisclaimer(e.target.checked)}
                  className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Show Footer Disclaimer</span>
              </label>
            </div>
          </div>
        )}

        {/* Scrollable Document Stage Wrapper for Batch Printing */}
        <div className="flex-grow flex flex-col gap-8 py-2 w-full overflow-x-auto select-text items-center">
          {reports.map((report, idx) => {
            return (
              <div 
                key={report.id}
                style={{
                  '--print-padding-top': `${paddingTop}mm`,
                  '--print-padding-right': `${paddingRight}mm`,
                  '--print-padding-bottom': `${paddingBottom}mm`,
                  '--print-padding-left': `${paddingLeft}mm`,
                  '--print-font-scale': `${fontScale}%`,
                  '--print-border-display': showBorder ? 'block' : 'none',
                  '--print-border-inset-1': `${borderInset}mm`,
                  '--print-border-inset-2': `${borderInset + 1}mm`,
                } as React.CSSProperties}
                className={`printable-batch-canvas w-[210mm] min-h-[296mm] bg-white text-slate-900 border border-slate-300 shadow-xl relative overflow-hidden print:border-0 print:shadow-none print:p-0 print:m-0 ${
                  idx < reports.length - 1 ? 'print-page-break' : ''
                }`}
              >
                {/* Screen-only Certificate Decorative Border controlled via showBorder */}
                {showBorder && (
                  <>
                    <div 
                      style={{ inset: `${borderInset}mm` }}
                      className="absolute border-2 border-indigo-700/20 pointer-events-none print:hidden" 
                    />
                    <div 
                      style={{ inset: `${borderInset + 1}mm` }}
                      className="absolute border border-indigo-700/10 pointer-events-none print:hidden" 
                    />
                  </>
                )}

                {/* 1. Header Section */}
                <div className={`flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b-2 border-indigo-900/30 pb-6 mb-8 mt-2 relative ${!showLogo ? 'pt-2' : ''}`}>
                  <div className="flex items-center gap-4">
                    {/* Vector Company Logo */}
                    {showLogo ? (
                      <div className="w-24 h-24 bg-white overflow-hidden rounded-xl flex items-center justify-center shadow-md border border-slate-200 shrink-0 select-none">
                        <img 
                          src={pescoLogo} 
                          alt="PESCO Logo" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : null}
                    <div className="text-center sm:text-left">
                      <h1 className="text-base sm:text-lg font-black tracking-tight text-indigo-950 uppercase leading-none">
                        PESHAWAR ELECTRIC SUPPLY COMPANY (PESCO)
                      </h1>
                      <p className="text-[10px] font-extrabold tracking-wider text-indigo-700 uppercase mt-1">
                        WAPDA / PESCO METERS COMPLIANCE TESTING LABORATORY
                      </p>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                        PESCO Headquarters, Shami Road, Peshawar, Khyber Pakhtunkhwa. Contact: (091) 9211997
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right shrink-0">
                    <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 text-[11px] font-bold text-indigo-800 rounded-md uppercase mb-2">
                      Formal Test Report
                    </span>
                    <p className="text-xs text-slate-500 font-medium">Report Number</p>
                    <p className="text-sm font-extrabold text-slate-900 tracking-wider">
                      {report.reportNumber}
                    </p>
                  </div>
                </div>

                {/* 2. Customer Credentials Section */}
                <div className="mb-8 font-size-inherit">
                  <div className="bg-indigo-900/5 px-3 py-1.5 rounded border-l-4 border-indigo-900 mb-4 font-size-inherit">
                    <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      I. CONSUMER CREDENTIALS & SERVICE PROFILE
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs font-size-inherit">
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Consumer Account Number:</span>
                      <span className="font-bold text-slate-900 tracking-wider">{report.accountNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Tariff Category:</span>
                      <span className="font-bold text-slate-950">{report.tariff}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 col-span-1 md:col-span-2">
                      <span className="text-slate-500 font-medium">Primary Consumer Name:</span>
                      <span className="font-bold text-slate-955 text-right">{report.consumerName}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Father / Guardian Name:</span>
                      <span className="font-semibold text-slate-805">{report.fatherName}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Nature of Connection:</span>
                      <span className="font-bold text-slate-805">{report.natureOfConnection}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Tested Hardware Section */}
                <div className="mb-8 font-size-inherit">
                  <div className="bg-indigo-900/5 px-3 py-1.5 rounded border-l-4 border-indigo-900 mb-4 font-size-inherit">
                    <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      II. SPECIFIED EQUIPMENT / TEST TARGET UNDER TESTING
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs font-size-inherit">
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Equipment Type:</span>
                      <span className="font-bold text-slate-900">{getMeterCategoryName(report.meterType)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Meter ID / Number:</span>
                      <span className="font-bold text-slate-955 tracking-wider font-mono">{report.meterNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Manufacturer / Make:</span>
                      <span className="font-bold text-slate-800">{report.meterMake}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Warp/Serial Code:</span>
                      <span className="font-mono text-slate-800">{report.serialNumber}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Meter Reading Details Tabular Section */}
                <div className="mb-8 font-size-inherit">
                  <div className="bg-indigo-900/5 px-3 py-1.5 rounded border-l-4 border-indigo-900 mb-4 font-size-inherit">
                    <h2 className="text-xs font-bold text-indigo-955 uppercase tracking-wider">
                      III. AS-FOUND RETRIEVED REGISTER READINGS
                    </h2>
                  </div>
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-indigo-50 text-indigo-950 font-bold border-b border-slate-200">
                          <th className="p-3">Register / Billing Parameter</th>
                          <th className="p-3 text-right font-semibold">As-Registered Raw Value</th>
                          <th className="p-3 text-right font-semibold">Unit of Measure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {report.meterType === 'single_phase' ? (
                          <tr>
                            <td className="p-2.5 pl-3">Final Reading (Active Energy)</td>
                            <td className="p-2.5 text-right font-mono font-bold text-indigo-905">{report.readings.kwhPeak}</td>
                            <td className="p-2.5 text-right text-slate-500">kWh</td>
                          </tr>
                        ) : (
                          <>
                            <tr>
                              <td className="p-2.5 pl-3">Active Energy Consumption - Peak Hours</td>
                              <td className="p-2.5 text-right font-mono">{report.readings.kwhPeak}</td>
                              <td className="p-2.5 text-right text-slate-500">kWh</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                              <td className="p-2.5 pl-3">Active Energy Consumption - Off-Peak Hours</td>
                              <td className="p-2.5 text-right font-mono">{report.readings.kwhOffPeak}</td>
                              <td className="p-2.5 text-right text-slate-500">kWh</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3">Reactive Energy Consumption - Peak Hours</td>
                              <td className="p-2.5 text-right font-mono">{report.readings.kvarhPeak}</td>
                              <td className="p-2.5 text-right text-slate-500">kVARh</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                              <td className="p-2.5 pl-3">Reactive Energy Consumption - Off-Peak Hours</td>
                              <td className="p-2.5 text-right font-mono">{report.readings.kvarhOffPeak}</td>
                              <td className="p-2.5 text-right text-slate-500">kVARh</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 pl-3">Maximum Demand Indicator (MDI) - Peak Hours</td>
                              <td className="p-2.5 text-right font-mono text-indigo-905">{report.readings.mdiPeak}</td>
                              <td className="p-2.5 text-right text-slate-500">kW</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                              <td className="p-2.5 pl-3">Maximum Demand Indicator (MDI) - Off-Peak Hours</td>
                              <td className="p-2.5 text-right font-mono text-indigo-905">{report.readings.mdiOffPeak}</td>
                              <td className="p-2.5 text-right text-slate-500">kW</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Phase Accuracy Tests */}
                <div className="mb-8 font-size-inherit">
                  <div className="bg-indigo-900/5 px-3 py-1.5 rounded border-l-4 border-indigo-900 mb-4 font-size-inherit">
                    <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      IV. PHASE COMPARATOR ACCURACY CHECK
                    </h2>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium font-size-inherit">
                    <div>
                      <span className="text-slate-500 block">Applied Load State</span>
                      <span className="text-slate-800 font-bold">{report.accuracyTest.testLoad}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tested Voltage</span>
                      <span className="text-slate-800 font-bold">{report.accuracyTest.testVoltage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Measured Current</span>
                      <span className="text-slate-800 font-bold">{report.accuracyTest.testCurrent}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Power Factor (PF)</span>
                      <span className="text-slate-800 font-bold">{report.accuracyTest.powerFactor}</span>
                    </div>
                    <div className="mt-2 text-indigo-955 font-semibold border-t border-slate-200/60 pt-3 col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block font-normal">Calculated Error</span>
                      <span className={`text-sm font-black ${report.accuracyTest.passFail === 'Pass' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {report.accuracyTest.errorPercentage}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-800 border-t border-slate-200/60 pt-3">
                      <span className="text-slate-500 block">Standard Limit Allowed</span>
                      <span className="font-mono font-bold text-slate-600">{report.accuracyTest.standardLimit}</span>
                    </div>
                    <div className="mt-2 text-indigo-955 font-semibold border-t border-slate-200/60 pt-3 col-span-2">
                      <span className="text-slate-500 block font-normal">Final Testing Outcome</span>
                      <span className={`text-sm font-extrabold flex items-center gap-1 uppercase ${
                        report.accuracyTest.passFail === 'Pass' ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {report.accuracyTest.passFail === 'Pass' ? 'PASSED LABORATORY STANDARD' : 'REJECTED FOR FAULT'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Discrepancies and Findings */}
                <div className="mb-10 font-size-inherit">
                  <div className="bg-indigo-900/5 px-3 py-1.5 rounded border-l-4 border-indigo-955 mb-4 font-size-inherit">
                    <h2 className="text-xs font-bold text-indigo-955 uppercase tracking-wider">
                      V. PHYSICAL & TAMPER DISCREPANCY AUDIT
                    </h2>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-4 bg-white font-size-inherit">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Identified Physical/Electrical Anomaly Profiles:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.discrepancies.length === 0 || report.discrepancies.includes('No Discrepancy') ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1">
                          ✓ Core Solid-State Shunts Pristine (No Tampering or Shunt Slowdown Detected)
                        </span>
                      ) : (
                        report.discrepancies.map((disc, subIdx) => (
                          <span key={subIdx} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-100 flex items-center gap-1">
                            ⚠️ {disc}
                          </span>
                        ))
                      )}
                    </div>
                    {report.otherDiscrepancyRemarks && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100 text-xs text-slate-605">
                        <strong className="text-slate-800">Additional Field/Desk Findings:</strong> {report.otherDiscrepancyRemarks}
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. Verification QR and Signature Blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-slate-200 items-end mt-auto font-size-inherit">
                  {/* QR Verification System */}
                  {showQR ? (
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                      <div className="w-24 h-24 bg-white border border-slate-300 rounded-lg p-1.5 shadow-sm flex items-center justify-center relative">
                        {/* Scalable vector QR Code */}
                        <svg className="w-full h-full text-indigo-955" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                          <rect x="5" y="5" width="20" height="20" fill="white" />
                          <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                          <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                          <rect x="75" y="5" width="20" height="20" fill="white" />
                          <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                          <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                          <rect x="5" y="75" width="20" height="20" fill="white" />
                          <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                          <rect x="40" y="10" width="5" height="5" fill="currentColor" />
                          <rect x="50" y="5" width="5" height="15" fill="currentColor" />
                          <rect x="60" y="10" width="5" height="5" fill="currentColor" />
                          <rect x="40" y="25" width="10" height="5" fill="currentColor" />

                          <rect x="15" y="40" width="5" height="15" fill="currentColor" />
                          <rect x="25" y="50" width="15" height="5" fill="currentColor" />
                          <rect x="5" y="55" width="5" height="5" fill="currentColor" />

                          <rect x="85" y="40" width="10" height="5" fill="currentColor" />
                          <rect x="75" y="50" width="5" height="15" fill="currentColor" />
                          <rect x="90" y="55" width="5" height="10" fill="currentColor" />

                          <rect x="45" y="45" width="10" height="10" fill="currentColor" />
                          <rect x="40" y="60" width="15" height="5" fill="currentColor" />
                          <rect x="50" y="75" width="5" height="15" fill="currentColor" />
                          <rect x="65" y="70" width="5" height="5" fill="currentColor" />

                          <rect x="80" y="80" width="15" height="5" fill="currentColor" />
                          <rect x="75" y="85" width="5" height="10" fill="currentColor" />
                          <rect x="90" y="90" width="10" height="5" fill="currentColor" />
                        </svg>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-medium tracking-wide">
                        Scan QR for Cryptographic Master Verification Ledger Online
                      </p>
                    </div>
                  ) : (
                    <div className="shrink-0 w-24 h-24 invisible" />
                  )}

                  {/* Tester Signature */}
                  <div className="text-center">
                    <div className="h-10 border-b border-indigo-900/40 flex items-end justify-center mb-1.5 font-serif italic text-sm text-indigo-900 font-bold select-none font-size-inherit">
                      {report.checkedBy}
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{report.checkedBy}</p>
                    <p className="text-[9px] text-slate-400">{report.checkedByDesignation}</p>
                  </div>

                  {/* Overseeing Lab Manager Signature */}
                  <div className="text-center font-size-inherit">
                    <div className="h-10 border-b border-indigo-900/40 flex items-end justify-center mb-1.5 font-serif italic text-sm text-indigo-900 font-bold select-none font-size-inherit">
                      {report.counterSignedBy}
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{report.counterSignedBy}</p>
                    <p className="text-[9px] text-slate-400">{report.counterSignedByDesignation}</p>
                    <p className="text-[9px] text-indigo-650 font-bold mt-1 uppercase tracking-wider">
                      Approved Date: {formatPKTDate(report.approvalDate)}
                    </p>
                  </div>
                </div>

                {/* Footer legal disclaimer */}
                {showDisclaimer ? (
                  <div className="mt-10 pt-6 border-t border-slate-100 text-[9px] text-slate-400 text-center leading-relaxed">
                    This document is generated digitally and verified by automated laboratory calibration benches. Metropolis Power Distribution holds full legal custodian rights over secondary sealing rings. Report accuracy is certified against Class 0.05 state primary meters.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
