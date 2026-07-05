/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, ArrowLeft, Truck, FileText, Calendar, Hash, User, MapPin, Layers, AlertCircle } from 'lucide-react';
import { OutwardRecord } from '../types';
import pescoLogo from '../assets/images/pesco_logo.jpg';
import { formatPKTDate } from '../utils';

interface OutwardReportPDFProps {
  record?: OutwardRecord; // For single record Dispatch Slip
  records?: OutwardRecord[]; // For full ledger summary
  onBack: () => void;
  title?: string;
}

export default function OutwardReportPDF({ record, records, onBack, title }: OutwardReportPDFProps) {
  React.useEffect(() => {
    const originalTitle = document.title;
    if (record) {
      document.title = `Challan-${record.outwardNumber}`;
    } else {
      document.title = 'Outward-Register-Report';
    }
    return () => {
      document.title = originalTitle;
    };
  }, [record]);

  const handlePrint = () => {
    window.print();
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'single_phase': return 'Single Phase Meter';
      case 'three_phase_whole': return 'Three Phase Whole Current Meter';
      case 'three_phase_ct': return 'Three Phase CT Operated Meter';
      case 'three_phase_ct_pt': return 'Three Phase CT/PT Operated Meter';
      case 'bi_directional_three_phase_whole': return 'Bi-Directional Three Phase Whole Current Meter';
      case 'bi_directional_ct_pt': return 'Bi-Directional CT/PT Operated Meter';
      case 'net_metering': return 'Net Metering';
      case 'ct': return 'Current Transformer (CT)';
      case 'pt': return 'Potential Transformer (PT)';
      default: return category || 'Meter';
    }
  };

  // RENDER 1: Single Record Dispatch Slip & Gate Pass
  if (record) {
    const totalItems = record.items?.length || 1;
    const itemsList = record.items && record.items.length > 0 
      ? record.items 
      : [{ id: record.id, number: record.meterNumber, serialNumber: record.serialNumber, make: record.make }];

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Register
            </button>
            <span className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-xs text-slate-500">
              Previewing Dispatch Challan: <strong className="text-slate-800 dark:text-slate-200 font-mono">{record.outwardNumber}</strong>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-rose-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-rose-700 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Gate Pass / Save as PDF
          </button>
        </div>

        {/* Interactive Print Instructions Card */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3.5 rounded-lg text-xs text-indigo-900 print:hidden shadow-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-indigo-950 uppercase tracking-wide">Print &amp; PDF Formatting Instructions (Dispatch Challan)</p>
            <ul className="list-disc pl-4 space-y-1 text-indigo-800 font-medium">
              <li>For 1:1 physical printing, click the <strong className="text-indigo-950">"Open in New Tab"</strong> button in the top-right of your workspace.</li>
              <li>In the print settings dialog, enable <strong className="text-indigo-950">"Background graphics"</strong> to display PESCO watermarks and borders.</li>
              <li>Set margins to <strong className="text-indigo-950">"None"</strong> or <strong className="text-indigo-950">"Minimum"</strong> to achieve perfect professional alignments.</li>
            </ul>
          </div>
        </div>

        {/* Printable Canvas */}
        <div 
          id="printable-challan-canvas" 
          className="mx-auto max-w-[800px] bg-white text-slate-900 border border-slate-300 shadow-xl p-8 sm:p-12 md:p-16 rounded-xl relative overflow-hidden print:border-0 print:shadow-none print:p-0 print:m-0"
        >
          {/* Centered Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none z-0">
            <img 
              src={pescoLogo} 
              alt="Watermark Logo" 
              className="w-110 h-110 object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Certificate Decorative Border */}
          <div className="absolute inset-4 border-2 border-rose-700/10 pointer-events-none print:hidden" />
          <div className="absolute inset-5 border border-rose-700/5 pointer-events-none print:hidden" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b-2 border-rose-900/30 pb-6 mb-8 mt-2 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white overflow-hidden rounded-xl flex items-center justify-center shadow-md border border-slate-200 shrink-0 select-none">
                <img 
                  src={pescoLogo} 
                  alt="PESCO Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-none">
                  PESHAWAR ELECTRIC SUPPLY COMPANY (PESCO)
                </h1>
                <p className="text-[10px] font-extrabold tracking-wider text-rose-700 uppercase mt-1">
                  OFFICE OF THE EXECUTIVE ENGINEER (M&T) DIVISION PESCO MARDAN
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                  M&T Compliance Testing Laboratory & Central Equipment Inventory
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-800 rounded uppercase mb-2">
                Outward Dispatch Challan
              </span>
              <p className="text-[10px] text-slate-500 font-medium">Gate Pass No</p>
              <p className="text-xs font-black text-slate-900 tracking-wider font-mono">
                {record.outwardNumber}
              </p>
            </div>
          </div>

          {/* Meta & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
            <div>
              <div className="bg-rose-900/5 px-2.5 py-1 rounded border-l-3 border-rose-800 mb-3">
                <h2 className="text-[11px] font-bold text-rose-950 uppercase tracking-wider">
                  I. RECEIVER'S DETAILS & DESTINATION OFFICE
                </h2>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Issued To (Officer):</td>
                    <td className="py-2 text-right font-bold text-slate-950">{record.issuedTo}</td>
                  </tr>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Designation:</td>
                    <td className="py-2 text-right font-semibold text-slate-800">{record.designation}</td>
                  </tr>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Subdivision Office:</td>
                    <td className="py-2 text-right font-bold text-slate-950">{record.subdivision}</td>
                  </tr>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Division Office:</td>
                    <td className="py-2 text-right font-semibold text-slate-800">{record.division}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="bg-rose-900/5 px-2.5 py-1 rounded border-l-3 border-rose-800 mb-3">
                <h2 className="text-[11px] font-bold text-rose-950 uppercase tracking-wider">
                  II. TRANSACTION METADATA
                </h2>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Date of Issue:</td>
                    <td className="py-2 text-right font-bold text-slate-950">{formatPKTDate(record.dateIssued)}</td>
                  </tr>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Equipment Type:</td>
                    <td className="py-2 text-right font-bold text-rose-800">{getCategoryLabel(record.equipmentType)}</td>
                  </tr>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Purpose of Outward:</td>
                    <td className="py-2 text-right font-semibold text-slate-800">{record.purpose}</td>
                  </tr>
                  <tr className="border-b border-dashed border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Issued Authority:</td>
                    <td className="py-2 text-right font-mono font-medium text-slate-600">{record.issuedBy}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* List of Dispatched Equipment */}
          <div className="mb-8 relative z-10">
            <div className="bg-rose-900/5 px-2.5 py-1 rounded border-l-3 border-rose-800 mb-3">
              <h2 className="text-[11px] font-bold text-rose-950 uppercase tracking-wider">
                III. MANIFEST / LIST OF EQUIPMENT DISPATCHED ({totalItems} {totalItems === 1 ? 'Item' : 'Items'})
              </h2>
            </div>
            
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-12 text-center">S.No</th>
                    <th className="p-3">Equipment / Asset ID</th>
                    <th className="p-3">Manufacturer / Make</th>
                    <th className="p-3">Serial / Batch Number</th>
                    <th className="p-3 text-right">Status / Results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {itemsList.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center text-slate-400 font-bold">{index + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900 font-mono tracking-wider">{item.number}</td>
                      <td className="p-2.5 text-slate-700">{item.make}</td>
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">{item.serialNumber}</td>
                      <td className="p-2.5 text-right font-extrabold text-emerald-800 uppercase text-[10px]">
                        PASSED / APPROVED
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {record.remarks && (
            <div className="mb-10 p-3 bg-slate-50 rounded border border-slate-200 text-xs relative z-10">
              <p className="font-bold text-slate-700 uppercase text-[9px] mb-1">Remarks / Special Notes:</p>
              <p className="text-slate-600 italic leading-relaxed">"{record.remarks}"</p>
            </div>
          )}

          {/* Gate Pass Terms */}
          <div className="mb-14 text-[9px] text-slate-400 leading-relaxed border-t border-slate-200 pt-4 relative z-10">
            <p className="font-bold uppercase tracking-wider mb-0.5 text-slate-500">Legal Declaration & Authority:</p>
            <p>
              The above mentioned metrological and electrical equipment has been thoroughly certified, tested, calibrated, and officially packed at the M&T Division compliance testing facility. By signing below, the recipient acknowledges physical receipt of these assets in fully sealed, intact, and tested condition, and accepts responsibility for safe transport and field installation according to PESCO standard operating procedures.
            </p>
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-4 gap-4 text-center text-[10px] relative z-10">
            <div className="flex flex-col justify-end h-20">
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800 uppercase tracking-tight">
                Prepared By
              </div>
              <div className="text-[9px] text-slate-500 font-medium mt-0.5">Lab Assistant / Rep</div>
            </div>
            <div className="flex flex-col justify-end h-20">
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800 uppercase tracking-tight">
                Verified By
              </div>
              <div className="text-[9px] text-slate-500 font-medium mt-0.5">Lab Superintendent</div>
            </div>
            <div className="flex flex-col justify-end h-20">
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800 uppercase tracking-tight">
                Approved By (I/C)
              </div>
              <div className="text-[9px] text-slate-500 font-medium mt-0.5">Executive Engineer (M&T)</div>
            </div>
            <div className="flex flex-col justify-end h-20">
              <div className="border-t border-slate-400 pt-2 font-black text-rose-800 uppercase tracking-tight">
                Recipient Signature
              </div>
              <div className="text-[9px] text-slate-500 font-semibold mt-0.5">With Designation & Date</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER 2: Full Outward Ledger Summary Report
  const outwardList = records || [];
  const totalDispatchedCount = outwardList.reduce((acc, curr) => {
    return acc + (curr.items?.length || 1);
  }, 0);

  // Group by equipment type
  const typeCounts: Record<string, number> = {};
  outwardList.forEach(r => {
    const type = r.equipmentType || 'single_phase';
    const itemsCount = r.items?.length || 1;
    typeCounts[type] = (typeCounts[type] || 0) + itemsCount;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Register
          </button>
          <span className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="text-xs text-slate-500">
            Outward Ledger Summary Report: <strong className="text-slate-800 dark:text-slate-200 font-mono">{outwardList.length} Dispatch Logs</strong>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-rose-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-rose-700 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Ledger Report / Save as PDF
        </button>
      </div>

      {/* Interactive Print Instructions Card */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3.5 rounded-lg text-xs text-indigo-900 print:hidden shadow-sm flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-indigo-950 uppercase tracking-wide">Print &amp; PDF Formatting Instructions (Ledger Report)</p>
          <ul className="list-disc pl-4 space-y-1 text-indigo-800 font-medium">
            <li>For 1:1 physical printing, click the <strong className="text-indigo-950">"Open in New Tab"</strong> button in the top-right of your workspace.</li>
            <li>In the print settings dialog, enable <strong className="text-indigo-950">"Background graphics"</strong> to display PESCO watermarks and borders.</li>
            <li>Set margins to <strong className="text-indigo-950">"None"</strong> or <strong className="text-indigo-950">"Minimum"</strong> to achieve perfect professional alignments.</li>
          </ul>
        </div>
      </div>

      {/* Printable Ledger Canvas */}
      <div 
        id="printable-ledger-canvas" 
        className="mx-auto bg-white text-slate-900 border border-slate-300 shadow-xl p-8 sm:p-10 rounded-xl relative overflow-hidden print:border-0 print:shadow-none print:p-0 print:m-0"
      >
        {/* Centered Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
          <img 
            src={pescoLogo} 
            alt="Watermark Logo" 
            className="w-130 h-130 object-contain" 
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b-2 border-rose-900/30 pb-6 mb-6 mt-2 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white overflow-hidden rounded-xl flex items-center justify-center shadow-md border border-slate-200 shrink-0 select-none">
              <img 
                src={pescoLogo} 
                alt="PESCO Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-950 uppercase leading-none">
                PESHAWAR ELECTRIC SUPPLY COMPANY (PESCO)
              </h1>
              <p className="text-[10px] font-black tracking-wider text-rose-700 uppercase mt-1">
                OFFICE OF THE EXECUTIVE ENGINEER (M&T) DIVISION PESCO MARDAN
              </p>
              <p className="text-[9px] text-slate-500 font-bold mt-0.5 leading-tight uppercase">
                Meter Outward Register & Dispatch Ledger
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 bg-rose-50 border border-rose-100 text-[10px] font-extrabold text-rose-800 rounded uppercase mb-1">
              Ledger Summary Report
            </span>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Generated On</p>
            <p className="text-xs font-bold text-slate-900 tracking-wider font-mono">
              {formatPKTDate(new Date().toISOString().split('T')[0])}
            </p>
          </div>
        </div>

        {/* Report Summary Bento Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 relative z-10">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Dispatches</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{outwardList.length}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Items Dispatched</p>
            <p className="text-xl font-extrabold text-rose-700 mt-1 font-mono">{totalDispatchedCount}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Single Phase Meters</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1 font-mono">{typeCounts['single_phase'] || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Three Phase Meters</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1 font-mono">
              {((typeCounts['three_phase_whole'] || 0) + (typeCounts['three_phase_ct'] || 0) + (typeCounts['three_phase_ct_pt'] || 0) + (typeCounts['bi_directional_three_phase_whole'] || 0) + (typeCounts['bi_directional_ct_pt'] || 0))}
            </p>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="mb-10 relative z-10 overflow-hidden border border-slate-300 rounded-lg">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase tracking-wider text-[9px]">
                <th className="p-3 w-16">Ref No</th>
                <th className="p-3 w-20">Date</th>
                <th className="p-3">Dispatched Equipment</th>
                <th className="p-3">Recipient / Destination</th>
                <th className="p-3">Equipment Category</th>
                <th className="p-3 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {outwardList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No outward dispatch records exist.
                  </td>
                </tr>
              ) : (
                outwardList.map((row, idx) => {
                  const qty = row.items?.length || 1;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-rose-800 font-mono">{row.outwardNumber}</td>
                      <td className="p-3 text-slate-500">{formatPKTDate(row.dateIssued)}</td>
                      <td className="p-3">
                        {row.items && row.items.length > 0 ? (
                          <div className="max-w-[280px]">
                            <p className="font-bold text-slate-900 text-[10.5px]">
                              {row.items.map(i => i.number).join(', ')}
                            </p>
                            <p className="text-[9.5px] text-slate-400 mt-0.5 truncate font-mono">
                              {row.items.map(i => `S/N: ${i.serialNumber}`).join(' | ')}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-slate-900 text-[10.5px]">{row.meterNumber}</p>
                            <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">S/N: {row.serialNumber}</p>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{row.issuedTo} <span className="text-[9px] bg-slate-100 px-1 rounded uppercase font-normal text-slate-600">{row.designation}</span></p>
                        <p className="text-[9.5px] text-slate-500 mt-0.5">{row.subdivision}, {row.division}</p>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-1.5 py-0.5 bg-rose-50 text-rose-800 text-[9px] font-extrabold uppercase rounded">
                          {getCategoryLabel(row.equipmentType)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">{qty}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Closing Certification Signature Section */}
        <div className="grid grid-cols-3 gap-6 text-center text-[10px] relative z-10 pt-10 border-t border-slate-200">
          <div className="flex flex-col justify-end h-16">
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800 uppercase">
              Lab Superintendent
            </div>
            <div className="text-[9px] text-slate-400">PESCO M&T Division</div>
          </div>
          <div className="flex flex-col justify-end h-16">
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800 uppercase">
              EXECUTIVE ENGINEER (M&T)
            </div>
            <div className="text-[9px] text-slate-400">PESCO Mardan Circle</div>
          </div>
          <div className="flex flex-col justify-end h-16">
            <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800 uppercase">
              Official Seal / Stamp
            </div>
            <div className="text-[9px] text-slate-400">Compliance & Dispatch Certification</div>
          </div>
        </div>
      </div>
    </div>
  );
}
