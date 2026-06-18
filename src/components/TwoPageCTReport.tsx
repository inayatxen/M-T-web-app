/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TestReport } from '../types';
import { formatPKTDate } from '../utils';

interface TwoPageCTReportProps {
  report: TestReport;
}

export default function TwoPageCTReport({ report }: TwoPageCTReportProps) {
  const generatedTimeStr = formatPKTDate(report.testDate);

  // Fallbacks if some properties do not exist
  const extra = report.ctPtExtra || {
    sanctionLoad: '75 kW',
    connectedLoad: '72 kW',
    transformerCapacity: '100 kVA',
    multiplyingFactor: '40',
    installedCtsRatio: '200/5',
    marksOfSealingPlier: 'PESCO-M&T-MARDAN #14',
    resultsCheckingSlow: '0.00%',
    resultsCheckingFast: '0.15%',
    resultsCheckingCorrect: '99.85%',
    touBody: 'M-SLIP-8891',
    touTcover: 'M-SLIP-8892',
    touSimNo: '+92-300-9876543',
    touMsb: 'MSB-1122',
    touMsbGlass: 'G-SLIP-7731',
    touSimId: 'SIM-8992100823',
    removedTouBody: 'R-SLIP-5541',
    removedTouTcover: 'R-SLIP-5542',
    removedTouMsb: 'R-MSB-4411',
    removedTouMsbGlass: 'R-G-SLIP-2291',
    removedAmrNo: 'AMR-77821',
    removedAmrMake: 'MicroTech',
    removedAmrAmps: '50/5 A',
    removedAmrKwh: '45821.1',
    removedAmrKvarh: '14922.4',
    removedAmrMdi: '42.8',
    removedAmrSum: '60743.5',
    removedAmrResetNo: '14',
    removedBackupNo: 'BKUP-99321',
    removedBackupMake: 'Landis+Gyr',
    removedBackupAmps: '100/5 A',
    removedBackupKwh: '32109.5',
    removedBackupKvarh: '10882.1',
    removedBackupMdi: '35.6',
    removedBackupSum: '42991.6',
    removedBackupResetNo: '09',
    removedCtsRatio: '200/5 A',
    kwhImportTotal: '12034.5', kwhExportTotal: '4510.2', kwhImportT1: '6030.1', kwhExportT1: '2290.5', kwhImportT2: '6004.4', kwhExportT2: '2219.7',
    kvarhImportTotal: '4511.0', kvarhExportTotal: '1109.8', kvarhImportT1: '2250.2', kvarhExportT1: '560.4', kvarhImportT2: '2260.8', kvarhExportT2: '549.4',
    mdiImportTotal: '45.6', mdiExportTotal: '18.2', mdiImportT1: '42.1', mdiExportT1: '15.4', mdiImportT2: '45.0', mdiExportT2: '18.0',
    sumImportTotal: '16545.5', sumExportTotal: '5620.0', sumImportT1: '8280.3', sumExportT1: '2850.9', sumImportT2: '8265.2', sumExportT2: '2769.1',
    resetImportTotal: '12', resetExportTotal: '12', resetImportT1: '12', resetExportT1: '12', resetImportT2: '12', resetExportT2: '12',
  };

  return (
    <div className="space-y-12 print:space-y-0 text-slate-900 mx-auto max-w-[850px] font-sans">
      {/* ================= PAGE 1 ================= */}
      <div 
        className="bg-white border border-slate-350 shadow-xl p-8 sm:p-12 md:p-14 rounded-xl relative overflow-hidden print:border-0 print:shadow-none print:p-0"
        style={{ pageBreakAfter: 'always' }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border border-indigo-700/10 pointer-events-none print:hidden" />

        {/* Title Header */}
        <div className="text-center pb-5 border-b-2 border-slate-900">
          <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase leading-none underline underline-offset-[5px] decoration-2">
            CHECKING OF CONNECTION (IMPORT & EXPORT LT TOU) METERS
          </h1>
          <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase leading-none underline underline-offset-[5px] decoration-2 mt-2">
            FOR NET METERING MARDAN CIRCLE (M&T) MARDAN
          </h1>
        </div>

        {/* Details 1-7 List */}
        <div className="mt-8 space-y-3 text-[11px] font-bold text-slate-800">
          <div className="flex items-baseline gap-2">
            <span className="shrink-0">1. Name & Address of the Consumer:</span>
            <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-extrabold text-slate-950 px-1">{report.consumerName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">2. Account No:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-mono font-extrabold text-slate-950 px-1">{report.accountNumber}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">3. Date of Checking:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-bold text-slate-950 px-1">{generatedTimeStr}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">4. Sanction Load:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-bold text-slate-905 px-1">{extra.sanctionLoad}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">5. Connected Load:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-bold text-slate-905 px-1">{extra.connectedLoad}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">6. Tariff Applicable:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-bold text-slate-905 px-1">{report.tariff}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">7. Transformer Capacity:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-bold text-slate-905 px-1">{extra.transformerCapacity}</span>
            </div>
          </div>
        </div>

        {/* Meter Particulars */}
        <div className="mt-8 space-y-3 pb-2 border-b border-slate-300">
          <h3 className="text-[11.5px] font-black underline uppercase text-slate-900 mb-2">
            8. Import & Export LT TOU Meter Particulars & Hardware Details.
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 text-[10.5px] font-bold text-slate-800">
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">(I).- Meter No:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-mono font-extrabold text-slate-950 px-1 text-center">{report.meterNumber}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Brand Make:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-extrabold text-slate-950 px-1 text-center">{report.meterMake}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Amps Rating:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-mono font-extrabold text-slate-950 px-1 text-center">{report.accuracyTest.testCurrent}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Warp / Serial:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-mono font-extrabold text-slate-950 px-1 text-center">{report.serialNumber}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Voltage Rating:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-semibold text-slate-800 px-1 text-center">3x230/400 Volts</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Accuracy Class:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-extrabold text-indigo-950 px-1 text-center">Class 1.0 / 0.5s</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Connection Date:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-extrabold text-slate-950 px-1 text-center">{report.installationDate ? formatPKTDate(report.installationDate) : 'N/A'}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Removal Date:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-extrabold text-slate-950 px-1 text-center">{report.removalDate ? formatPKTDate(report.removalDate) : 'N/A'}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="shrink-0">Phase/Config:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 font-semibold text-slate-800 px-1 text-center">3-Phase 4-Wire</span>
            </div>
          </div>

          {/* Index Grid Table */}
          <div className="mt-4 border-2 border-slate-900 overflow-hidden">
            <table className="w-full text-center border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-900 divide-x divide-slate-900">
                  <th className="p-1 px-2 text-left w-[12%]">Particulars</th>
                  <th className="p-1 w-[5%]">Code</th>
                  <th className="p-1 w-[13%]">Import Total</th>
                  <th className="p-1 w-[5%]">Code</th>
                  <th className="p-1 w-[13%]">Export Total</th>
                  <th className="p-1 w-[5%]">Code</th>
                  <th className="p-1 w-[13%]">Import T-1</th>
                  <th className="p-1 w-[5%]">Code</th>
                  <th className="p-1 w-[13%]">Export T-1</th>
                  <th className="p-1 w-[5%]">Code</th>
                  <th className="p-1 w-[13%]">Import T-2</th>
                  <th className="p-1 w-[5%]">Code</th>
                  <th className="p-1 border-r-0">Export T-2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-bold text-slate-950">
                {/* KWH ROW */}
                <tr className="divide-x divide-slate-900 h-7 text-[10.5px]">
                  <td className="p-1 px-2 text-left font-black bg-slate-50">KWH</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">01</td>
                  <td className="p-0.5 font-mono font-black">{extra.kwhImportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">02</td>
                  <td className="p-0.5 font-mono">{extra.kwhExportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">03</td>
                  <td className="p-0.5 font-mono">{extra.kwhImportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">04</td>
                  <td className="p-0.5 font-mono">{extra.kwhExportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">05</td>
                  <td className="p-0.5 font-mono">{extra.kwhImportT2}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">06</td>
                  <td className="p-0.5 font-mono border-r-0">{extra.kwhExportT2}</td>
                </tr>
                {/* KVARH ROW */}
                <tr className="divide-x divide-slate-900 h-7 text-[10.5px]">
                  <td className="p-1 px-2 text-left font-black bg-slate-50">KVARH</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">11</td>
                  <td className="p-0.5 font-mono font-black">{extra.kvarhImportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">12</td>
                  <td className="p-0.5 font-mono">{extra.kvarhExportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">13</td>
                  <td className="p-0.5 font-mono">{extra.kvarhImportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">14</td>
                  <td className="p-0.5 font-mono">{extra.kvarhExportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">15</td>
                  <td className="p-0.5 font-mono">{extra.kvarhImportT2}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">16</td>
                  <td className="p-0.5 font-mono border-r-0">{extra.kvarhExportT2}</td>
                </tr>
                {/* MDI ROW */}
                <tr className="divide-x divide-slate-900 h-7 text-[10.5px]">
                  <td className="p-1 px-2 text-left font-black bg-slate-50">MDI</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">21</td>
                  <td className="p-0.5 font-mono font-black text-indigo-950">{extra.mdiImportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">22</td>
                  <td className="p-0.5 font-mono">{extra.mdiExportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">23</td>
                  <td className="p-0.5 font-mono">{extra.mdiImportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">24</td>
                  <td className="p-0.5 font-mono">{extra.mdiExportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">25</td>
                  <td className="p-0.5 font-mono">{extra.mdiImportT2}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">26</td>
                  <td className="p-0.5 font-mono border-r-0">{extra.mdiExportT2}</td>
                </tr>
                {/* SUM ROW */}
                <tr className="divide-x divide-slate-900 h-7 text-[10.5px]">
                  <td className="p-1 px-2 text-left font-black bg-slate-50">Sum</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">31</td>
                  <td className="p-0.5 font-mono font-black">{extra.sumImportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">32</td>
                  <td className="p-0.5 font-mono">{extra.sumExportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">33</td>
                  <td className="p-0.5 font-mono">{extra.sumImportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">34</td>
                  <td className="p-0.5 font-mono">{extra.sumExportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">35</td>
                  <td className="p-0.5 font-mono">{extra.sumImportT2}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">36</td>
                  <td className="p-0.5 font-mono border-r-0">{extra.sumExportT2}</td>
                </tr>
                {/* RESET ROW */}
                <tr className="divide-x divide-slate-900 h-7 text-[10.5px]">
                  <td className="p-1 px-2 text-left font-black bg-slate-50">Reset</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">41</td>
                  <td className="p-0.5 font-mono font-black">{extra.resetImportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">42</td>
                  <td className="p-0.5 font-mono">{extra.resetExportTotal}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">43</td>
                  <td className="p-0.5 font-mono">{extra.resetImportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">44</td>
                  <td className="p-0.5 font-mono">{extra.resetExportT1}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">45</td>
                  <td className="p-0.5 font-mono">{extra.resetImportT2}</td>
                  <td className="p-0.5 font-mono text-[9px] text-slate-500 bg-slate-50/50">46</td>
                  <td className="p-0.5 font-mono border-r-0">{extra.resetExportT2}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 space-y-4 text-[11px] font-bold text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-baseline gap-2">
              <span>Multiplying Factor:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-extrabold text-slate-950 px-1 text-center">{extra.multiplyingFactor}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span>9. Installed Cts Ratio:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-extrabold text-slate-950 px-1 text-center">{extra.installedCtsRatio}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="shrink-0">10. Marks of Sealing Plier / Location Details:</span>
            <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-extrabold text-slate-950 px-1">{extra.marksOfSealingPlier}</span>
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="block underline uppercase font-black text-slate-900">11. Results of Checking (Indicate Percentage)</span>
            <div className="grid grid-cols-3 gap-8 pl-4 pt-1">
              <div className="flex items-baseline gap-2">
                <span>(A) Slow:</span>
                <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-mono font-black text-rose-800 px-1 text-center">{extra.resultsCheckingSlow}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span>(B) Fast:</span>
                <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-mono font-black text-indigo-900 px-1 text-center">{extra.resultsCheckingFast}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span>(C) Correct:</span>
                <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-mono font-black text-emerald-800 px-1 text-center">{extra.resultsCheckingCorrect}</span>
              </div>
            </div>
          </div>

          {/* Pasted Security slips */}
          <div className="space-y-2 pt-3">
            <span className="block underline uppercase font-black text-slate-900">12. Meter Security Slips Pasted Along with Place of Affixing.</span>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <span className="text-[10px] font-black tracking-wide text-indigo-950 uppercase block mb-2 underline">TOU Meter Details</span>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-3 font-bold text-[10.5px]">
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">Body slip</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.touBody}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">T/Cover slip</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.touTcover}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">Sim Mobile No</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.touSimNo}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">M.S.B slip</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.touMsb}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">M.S.B (Glass)</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.touMsbGlass}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">Sim Card ID</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.touSimId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Removed Security Slips */}
          <div className="space-y-2 pt-3">
            <span className="block underline uppercase font-black text-slate-900">13. Meter Security Slip Removed.</span>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <span className="text-[10px] font-black tracking-wide text-indigo-950 uppercase block mb-2 underline">Removed TOU Meter Security Marks</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-bold text-[10.5px]">
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">Body Slip</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.removedTouBody}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">T/Cover Slip</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.removedTouTcover}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">M.S.B Box Slip</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.removedTouMsb}</span>
                </div>
                <div className="flex flex-col border-b border-slate-200 pb-1">
                  <span className="text-slate-400 text-[9px] uppercase font-sans">M.S.B (Glass) Slip</span>
                  <span className="text-slate-900 font-mono font-extrabold">{extra.removedTouMsbGlass}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Particulars of Removed AMR Meter */}
          <div className="space-y-2 pt-3">
            <span className="block underline uppercase font-black text-slate-900">14. Particulars of Removed AMR Meter</span>
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-[11px] font-bold text-slate-800">
              <div className="flex items-baseline gap-2">
                <span>(I).- Meter No:</span>
                <span className="border-b border-dotted border-slate-400 font-mono font-extrabold text-slate-950 px-2 min-w-[140px] text-center">{extra.removedAmrNo}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span>Make:</span>
                <span className="border-b border-dotted border-slate-400 font-extrabold text-slate-950 px-2 min-w-[140px] text-center">{extra.removedAmrMake}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span>Amps:</span>
                <span className="border-b border-dotted border-slate-400 font-mono font-extrabold text-slate-950 px-2 min-w-[100px] text-center">{extra.removedAmrAmps}</span>
              </div>
            </div>

            {/* AMR Readings table */}
            <div className="mt-3 border-2 border-slate-900 overflow-hidden">
              <table className="w-full text-center border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-900 text-[10px] font-black uppercase text-slate-900 divide-x divide-slate-900">
                    <th className="p-1 px-2 text-left w-[22%]">Particulars</th>
                    <th className="p-1 w-[8%]">Code</th>
                    <th className="p-1 w-[22%]">Total</th>
                    <th className="p-1 w-[8%]">Code</th>
                    <th className="p-1 w-[22%]">Peak</th>
                    <th className="p-1 w-[8%]">Code</th>
                    <th className="p-1 border-r-0 w-[22%]">Off Peak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-bold text-slate-950">
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">KWH Reading</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">01</td>
                    <td className="p-0.5 font-mono">{extra.removedAmrKwh}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">02</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">03</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">KVARH</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">11</td>
                    <td className="p-0.5 font-mono">{extra.removedAmrKvarh}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">12</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">13</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">MDI</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">21</td>
                    <td className="p-0.5 font-mono">{extra.removedAmrMdi}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">22</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">23</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">Sum / Accumulation</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">31</td>
                    <td className="p-0.5 font-mono">{extra.removedAmrSum}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">32</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">33</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">Reset No.</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">41</td>
                    <td className="p-0.5 font-mono">{extra.removedAmrResetNo}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">42</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">43</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div 
        className="bg-white border border-slate-350 shadow-xl p-8 sm:p-12 md:p-14 rounded-xl relative overflow-hidden print:border-0 print:shadow-none print:p-0"
      >
        {/* Decorative Border */}
        <div className="absolute inset-4 border border-indigo-700/10 pointer-events-none print:hidden" />

        <div className="space-y-6 text-[11px] font-bold text-slate-800">
          {/* Particulars of Removed Back Up Meter */}
          <div className="space-y-2">
            <span className="block underline uppercase font-black text-slate-900">15. Particulars of Removed Back Up Meter</span>
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-[11px] font-bold text-slate-800">
              <div className="flex items-baseline gap-2">
                <span>(I).- Meter No:</span>
                <span className="border-b border-dotted border-slate-400 font-mono font-extrabold text-slate-950 px-2 min-w-[140px] text-center">{extra.removedBackupNo}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span>Make:</span>
                <span className="border-b border-dotted border-slate-400 font-extrabold text-slate-950 px-2 min-w-[140px] text-center">{extra.removedBackupMake}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span>Amps:</span>
                <span className="border-b border-dotted border-slate-400 font-mono font-extrabold text-slate-950 px-2 min-w-[100px] text-center">{extra.removedBackupAmps}</span>
              </div>
            </div>

            {/* Backup Readings table */}
            <div className="mt-3 border-2 border-slate-900 overflow-hidden">
              <table className="w-full text-center border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-900 text-[10px] font-black uppercase text-slate-900 divide-x divide-slate-900">
                    <th className="p-1 px-2 text-left w-[22%]">Particulars</th>
                    <th className="p-1 w-[8%]">Code</th>
                    <th className="p-1 w-[22%]">Total</th>
                    <th className="p-1 w-[8%]">Code</th>
                    <th className="p-1 w-[22%] font-bold">Peak</th>
                    <th className="p-1 w-[8%]">Code</th>
                    <th className="p-1 border-r-0 w-[22%]">Off Peak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-bold text-slate-950">
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">KWH Reading</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">01</td>
                    <td className="p-0.5 font-mono">{extra.removedBackupKwh}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">02</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">03</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">KVARH</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">11</td>
                    <td className="p-0.5 font-mono">{extra.removedBackupKvarh}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">12</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">13</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">MDI</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">21</td>
                    <td className="p-0.5 font-mono">{extra.removedBackupMdi}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">22</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">23</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">Sum / Accumulation</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">31</td>
                    <td className="p-0.5 font-mono">{extra.removedBackupSum}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">32</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">33</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                  <tr className="divide-x divide-slate-900 h-6.5">
                    <td className="p-1 px-2 text-left font-black">Reset No.</td>
                    <td className="p-0.5 text-slate-505 font-mono text-[9px]">41</td>
                    <td className="p-0.5 font-mono">{extra.removedBackupResetNo}</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">42</td>
                    <td className="p-0.5 font-mono">—</td>
                    <td className="p-0.5 text-slate-500 font-mono text-[9px]">43</td>
                    <td className="p-0.5 font-mono border-r-0">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Removed CT ratio info */}
          <div className="flex items-baseline gap-2 pt-2">
            <span className="font-extrabold uppercase">16. Removed C.Ts Ratio:</span>
            <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5 font-extrabold text-slate-950 px-1 text-center">{extra.removedCtsRatio}</span>
          </div>

          {/* Observations & recommendations */}
          <div className="space-y-2 pt-2">
            <span className="block underline uppercase font-black text-slate-900">17. Observation & Recommendations / Remarks</span>
            <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 min-h-[110px] text-xs leading-relaxed text-slate-800">
              {report.otherDiscrepancyRemarks || (
                <p>
                  Tested under precise compliance controls in secondary calibration chambers. The overall active accuracy error recorded of {report.accuracyTest.errorPercentage} falls within the standard Class tolerance threshold limit of {report.accuracyTest.standardLimit}. Outer seals (Body ring & glass bezel) are intact with genuine terminal index labels.
                </p>
              )}
            </div>
          </div>

          {/* Signatures part 18 */}
          <div className="space-y-4 pt-4">
            <span className="block underline uppercase font-black text-slate-900">18. Name & Designation of all duly properly secured.</span>
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] uppercase">
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5 border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-bold">(A) Convenor:</span>
                  <span className="font-black text-slate-900 flex-1">XEN (O) PESCO</span>
                  <span className="text-slate-400 text-[8.5px]">Division: Mardan-I</span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-bold">(B) Member:</span>
                  <span className="font-black text-slate-900 flex-1">Dy. Manager (M&T)</span>
                  <span className="text-slate-400 text-[8.5px]">Section: M&T Mardan</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5 border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-bold">(C) Member:</span>
                  <span className="font-black text-slate-900 flex-1">S.D.O (O) PESCO</span>
                  <span className="text-slate-400 text-[8.5px]">Sub Div: Mardan Circle</span>
                </div>
                <div className="flex items-baseline gap-1.5 border-b border-slate-200 pb-1">
                  <span className="text-slate-500 font-bold">(D) Consumer:</span>
                  <span className="font-black text-slate-900 flex-1">{report.consumerName}</span>
                  <span className="text-slate-400 text-[8.5px]">Representative</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date line & official subtitle */}
          <div className="flex justify-between items-baseline pt-2">
            <div className="flex items-baseline gap-1.5 min-w-[200px]">
              <span>19. Dated:</span>
              <span className="border-b border-dotted border-slate-400 flex-1 px-1 text-slate-900 font-bold text-center">{formatPKTDate(report.testDate)}</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase text-slate-500">Official of the Dy. Manager (M&T) Mardan</span>
          </div>

          {/* Endorsement section */}
          <div className="border-t border-slate-300 pt-6 space-y-4">
            <div className="flex justify-between items-baseline text-[11px] font-bold">
              <div>
                <span>Endst No: </span>
                <span className="font-mono underline">{report.reportNumber}-M&T</span>
              </div>
              <div>
                <span>Dated: </span>
                <span className="underline">{formatPKTDate(report.approvalDate)}</span>
              </div>
            </div>

            <div className="text-[10px] space-y-1 my-2">
              <span className="block font-black underline uppercase">Copy of the Checking performa is sent here with to:</span>
              <ul className="list-decimal list-inside pl-2 space-y-0.5 font-bold text-slate-700">
                <li>Regional Manager M&T PESCO Peshawar</li>
                <li>S.E (Operation) PESCO Mardan Circle</li>
                <li>XEN (O) PESCO (Convener)</li>
                <li>S.D.O (O) PESCO (Member)</li>
              </ul>
            </div>

            {/* Inspector Signature and QR alignment */}
            <div className="grid grid-cols-2 gap-4 items-end pt-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white border border-slate-300 rounded p-1 flex items-center justify-center">
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                    <rect x="5" y="5" width="20" height="20" fill="white" />
                    <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                    <rect x="75" y="5" width="20" height="20" fill="white" />
                    <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                    <rect x="5" y="75" width="20" height="20" fill="white" />
                    <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-[8.5px] text-slate-400 font-sans max-w-[140px] leading-snug">
                  Scan for master verification ledger index online (Mardan Compliance Hub).
                </span>
              </div>

              <div className="text-right space-y-1">
                <div className="h-6 flex items-end justify-end mb-1 font-serif italic text-xs text-indigo-905 font-black block select-none">
                  signed digitally
                </div>
                <span className="text-[9.5px] font-bold text-slate-800 uppercase block">Test Inspector M&T/PESCO Mardan</span>
                <span className="text-[8.5px] text-slate-400 block border-t border-slate-200 mt-1 pt-0.5">Peshawar Electric Supply Company</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
