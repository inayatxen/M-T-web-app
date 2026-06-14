/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  HelpCircle, 
  Printer, 
  ShieldCheck, 
  Cpu, 
  Barcode, 
  FileCheck,
  Download,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { TestReport, Meter, CTRecord, PTRecord, CommitteeCase } from '../types';
import { parseRegionalAccountNumber, getCircleName, getDivisionName, getSubdivisionName, PESCO_HIERARCHY, formatPKTDateTime, getPKTDateString, parseAccountNumber } from '../utils';

interface ReportsArchiveViewProps {
  reports: TestReport[];
  meters: Meter[];
  cts: CTRecord[];
  pts: PTRecord[];
  cases: CommitteeCase[];
  onOpenReportPDF: (report: TestReport) => void;
  onCompileReportForMeter: (meter: Meter) => void; // redirect to corresponding testing page
  onOpenBatchReportPDF: (reports: TestReport[]) => void;
}

export default function ReportsArchiveView({ 
  reports, 
  meters, 
  cts, 
  pts, 
  cases,
  onOpenReportPDF,
  onCompileReportForMeter,
  onOpenBatchReportPDF
}: ReportsArchiveViewProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'compilation' | 'archive' | 'search' | 'qr'>('archive');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  
  // Advanced search parameters
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<'all' | 'account' | 'meter' | 'ct' | 'pt' | 'case' | 'report'>('all');

  // Scanning simulation params
  const [scanInputCode, setScanInputCode] = useState('');
  const [scanResultReport, setScanResultReport] = useState<TestReport | null>(null);
  const [scanError, setScanError] = useState('');

  // Multi-criteria report filter states
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearchQuery, setFilterSearchQuery] = useState('');

  // 14-digit Account Number Regional Analysis Filter states
  const [regBatch, setRegBatch] = useState('all');
  const [regCompany, setRegCompany] = useState('26');
  const [regCircle, setRegCircle] = useState('all');
  const [regDivision, setRegDivision] = useState('all');
  const [regSubdivision, setRegSubdivision] = useState('all');

  // Parse all reports for options and metrics calculation
  const reportsWithRegInfo = reports.map(r => {
    const parsed = parseAccountNumber(r.accountNumber);
    return {
      report: r,
      reg: {
        batch: parsed.batchNumber,
        company: parsed.companyCode,
        circle: parsed.circleCode,
        division: parsed.companyCode + parsed.circleCode + parsed.divisionCode,
        subdivision: parsed.companyCode + parsed.circleCode + parsed.divisionCode + parsed.subdivisionCode,
      }
    };
  });

  // Dynamic values based on scanned logs
  const dynamicBatches = Array.from(new Set(reportsWithRegInfo.map(ri => ri.reg.batch))).filter(Boolean).sort();
  const dynamicCompanies = Array.from(new Set(reportsWithRegInfo.map(ri => ri.reg.company))).filter(Boolean).sort();
  const dynamicCircles = Array.from(new Set(reportsWithRegInfo.map(ri => ri.reg.circle))).filter(Boolean).sort();
  const dynamicDivisions = Array.from(new Set(reportsWithRegInfo.map(ri => ri.reg.division))).filter(Boolean).sort();
  const dynamicSubdivisions = Array.from(new Set(reportsWithRegInfo.map(ri => ri.reg.subdivision))).filter(Boolean).sort();

  // Regional metrics for the active region selection
  const regionFilteredReports = reportsWithRegInfo.filter(ri => {
    if (regBatch !== 'all' && ri.reg.batch !== regBatch) return false;
    if (regCompany !== 'all' && ri.reg.company !== regCompany) return false;
    if (regCircle !== 'all' && ri.reg.circle !== regCircle) return false;
    if (regDivision !== 'all' && ri.reg.division !== regDivision) return false;
    if (regSubdivision !== 'all' && ri.reg.subdivision !== regSubdivision) return false;
    return true;
  });

  const regTotalCount = regionFilteredReports.length;
  const regPassedCount = regionFilteredReports.filter(ri => ri.report.accuracyTest.passFail === 'Pass').length;
  const regFailedCount = regTotalCount - regPassedCount;
  const regPassRate = regTotalCount > 0 ? Math.round((regPassedCount / regTotalCount) * 100) : 0;

  // Calculates absolute error/drift
  const parseErrorNum = (pctStr: string): number => {
    const cleaned = pctStr.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };
  
  const regErrors = regionFilteredReports.map(ri => Math.abs(parseErrorNum(ri.report.accuracyTest.errorPercentage)));
  const regAvgError = regErrors.length > 0 ? (regErrors.reduce((sum, val) => sum + val, 0) / regErrors.length).toFixed(3) : '0.000';

  // Common discrepancy hotspot finder
  const discrepanciesInRegion = regionFilteredReports.flatMap(ri => ri.report.discrepancies || []);
  const discrepancyFreqs = discrepanciesInRegion.reduce((acc: Record<string, number>, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});
  let hotspotText = 'None Found';
  let hotspotMaxCount = 0;
  Object.entries(discrepancyFreqs).forEach(([text, count]) => {
    if (count > hotspotMaxCount) {
      hotspotMaxCount = count;
      hotspotText = `${text} (${count})`;
    }
  });

  const getSelectedAreaLabel = () => {
    const parts = [];
    if (regBatch !== 'all') parts.push(`Batch ${regBatch}`);
    if (regCompany !== 'all') parts.push(`Co ${regCompany}`);
    if (regCircle !== 'all') parts.push(`Circle ${regCircle}`);
    if (regDivision !== 'all') parts.push(`Div ${regDivision}`);
    if (regSubdivision !== 'all') parts.push(`SubDiv ${regSubdivision}`);
    return parts.length > 0 ? parts.join(' - ') : 'All Regions';
  };

  const escapeCsvCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const handleExportAreaData = () => {
    const areaLabel = getSelectedAreaLabel();
    const rows: string[][] = [
      ['WAPDA / PESHAWAR ELECTRIC SUPPLY COMPANY (PESCO)'],
      ['METERS TESTING LABORATORY & GRID COMPLIANCE SYSTEM'],
      [`REGIONAL PERFORMANCE AUDIT REPORT - ${areaLabel.toUpperCase()}`],
      ['Exported On', formatPKTDateTime()],
      ['Circle Jurisdiction', regCircle !== 'all' ? `Circle ${regCircle}` : 'All Circles'],
      ['Division Code', regDivision !== 'all' ? `Division ${regDivision}` : 'All Divisions'],
      ['Batch Code', regBatch !== 'all' ? `Batch ${regBatch}` : 'All Batches'],
      [],
      ['SUMMARY PERFORMANCE STATISTICS'],
      ['Metric', 'Value', 'Status / Detail'],
      ['Total Sample Certificates', String(regTotalCount), 'Archived compliant units'],
      ['Compliance Pass Rate', `${regPassRate}%`, `${regPassedCount} Passed, ${regFailedCount} Failed`],
      ['Avg Calibration Error', `±${regAvgError}%`, 'Reference Limit Class 0.05 Bench'],
      ['Discrepancy Hotspot', hotspotText, 'Most frequently encountered failure'],
      [],
      ['DETAILED CALIBRATION CERTIFICATE REGISTRY'],
      [
        'Report Number',
        'Approved Date',
        'Account Number',
        'Consumer Name',
        'Category Code',
        'Meter Number',
        'Serial Number',
        'Manufacturer Make',
        'Accuracy Class',
        'Test Loaded Current',
        'Calibration Error (%)',
        'Standard Limit (%)',
        'Bench Verdict',
        'Cryptographic Digital Seal (SHA)',
        'Recorded Discrepancies',
        'Checked By (Operator)',
        'Counter-Signed By'
      ]
    ];

    regionFilteredReports.forEach(ri => {
      const r = ri.report;
      const cryptoSealHash = `SEC-${r.reportNumber}-${r.meterNumber.substring(0, 4)}`;
      const discrepanciesJoined = (r.discrepancies || []).join('; ') || 'None';

      rows.push([
        r.reportNumber,
        r.approvalDate || r.testDate,
        r.accountNumber,
        r.consumerName,
        r.meterType.toUpperCase().replace(/_/g, ' '),
        r.meterNumber,
        r.serialNumber,
        r.meterMake || 'PESCO Spec',
        r.accuracyTest.standardLimit,
        r.accuracyTest.testLoad || r.accuracyTest.testCurrent || '',
        r.accuracyTest.errorPercentage,
        r.accuracyTest.standardLimit,
        r.accuracyTest.passFail,
        cryptoSealHash,
        discrepanciesJoined,
        r.checkedBy || 'TESTING ENGINEER',
        r.counterSignedBy || 'LAB MANAGER'
      ]);
    });

    const csvContent = rows
      .map(row => row.map(escapeCsvCell).join(','))
      .join('\r\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const filename = `PESCO_MTLMS_Area_${areaLabel.replace(/[\s-:]+/g, '_')}_${getPKTDateString()}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic filter handler (incorporating regional account filters)
  const filteredReports = reports.filter(r => {
    // 1. Text Search Filter matching number, account, consumer name, manufacturer make, serial number
    if (filterSearchQuery.trim() !== '') {
      const q = filterSearchQuery.toLowerCase().trim();
      const matchesText = 
        r.reportNumber.toLowerCase().includes(q) ||
        r.meterNumber.toLowerCase().includes(q) ||
        r.consumerName.toLowerCase().includes(q) ||
        r.accountNumber.toLowerCase().includes(q) ||
        r.serialNumber.toLowerCase().includes(q) ||
        (r.meterMake && r.meterMake.toLowerCase().includes(q));
      if (!matchesText) return false;
    }

    // 2. Date Range Filter (looks up of testDate or approvalDate)
    const activeDate = r.approvalDate || r.testDate;
    if (filterStartDate) {
      if (activeDate < filterStartDate) return false;
    }
    if (filterEndDate) {
      if (activeDate > filterEndDate) return false;
    }

    // 3. Category Filter matching specific connection class
    if (filterCategory !== 'all') {
      if (r.meterType !== filterCategory) return false;
    }

    // 4. Bench Accuracy Status (Pass/Fail) Verdict
    if (filterStatus !== 'all') {
      const statusValue = r.accuracyTest.passFail; // 'Pass' | 'Fail'
      const matchesStatus = (filterStatus === 'pass' && statusValue === 'Pass') ||
                            (filterStatus === 'fail' && statusValue === 'Fail');
      if (!matchesStatus) return false;
    }

    // 5. Regional Filters
    const parsedReg = parseAccountNumber(r.accountNumber);
    const absCompany = parsedReg.companyCode;
    const absCircle = parsedReg.circleCode;
    const absDivision = parsedReg.companyCode + parsedReg.circleCode + parsedReg.divisionCode;
    const absSubdivision = parsedReg.companyCode + parsedReg.circleCode + parsedReg.divisionCode + parsedReg.subdivisionCode;

    if (regBatch !== 'all' && parsedReg.batchNumber !== regBatch) return false;
    if (regCompany !== 'all' && absCompany !== regCompany) return false;
    if (regCircle !== 'all' && absCircle !== regCircle) return false;
    if (regDivision !== 'all' && absDivision !== regDivision) return false;
    if (regSubdivision !== 'all' && absSubdivision !== regSubdivision) return false;

    return true;
  });

  // 1. Report compilation backlog (Meters which has status === 'passed' or 'failed' but no report compiled yet)
  const metersTestedPendingReport = meters.filter(
    m => (m.status === 'passed' || m.status === 'failed') && !reports.some(r => r.meterNumber === m.meterNumber)
  );

  // 2. Perform global cross-reference search across parameters (Account Number, Meter Number, Consumer Name, Report Number, CT Number, PT Number, Committee Case Number)
  const executeCrossSearch = () => {
    const q = globalQuery.toLowerCase().trim();
    if (!q) return [];

    let results: Array<{ type: string; title: string; subtitle: string; code: string; status: string; originalDoc: any }> = [];

    // Search Account/Consumer Name/Meter in Reports
    reports.forEach(r => {
      if (
        r.accountNumber.toLowerCase().includes(q) ||
        r.meterNumber.toLowerCase().includes(q) ||
        r.consumerName.toLowerCase().includes(q) ||
        r.reportNumber.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Meter Test Certificate',
          title: `Report: ${r.reportNumber} (Acc: ${r.accountNumber})`,
          subtitle: `Consumer: ${r.consumerName} • Meter: ${r.meterNumber}`,
          code: r.reportNumber,
          status: r.accuracyTest.passFail,
          originalDoc: { category: 'report', data: r }
        });
      }
    });

    // Search Meters (including backlog)
    meters.forEach(m => {
      if (
        m.meterNumber.toLowerCase().includes(q) ||
        m.serialNumber.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Meters Inventory Registry',
          title: `Meter: ${m.meterNumber} (${m.manufacturer})`,
          subtitle: `Serial: ${m.serialNumber} • Class: ${m.accuracyClass}`,
          code: m.meterNumber,
          status: m.stockStatus,
          originalDoc: { category: 'meter', data: m }
        });
      }
    });

    // Search CT records
    cts.forEach(c => {
      if (c.ctNumber.toLowerCase().includes(q) || c.ratio.toLowerCase().includes(q)) {
        results.push({
          type: 'Current Transformer Record (CT)',
          title: `CT Coil: ${c.ctNumber} (Ratio: ${c.ratio})`,
          subtitle: `Make: ${c.make} • Accuracy: ${c.accuracyClass}`,
          code: c.ctNumber,
          status: c.testResult.toUpperCase(),
          originalDoc: { category: 'ct', data: c }
        });
      }
    });

    // Search PT records
    pts.forEach(p => {
      if (p.ptNumber.toLowerCase().includes(q) || p.ratio.toLowerCase().includes(q)) {
        results.push({
          type: 'Potential Transformer Record (PT)',
          title: `PT Coil: ${p.ptNumber} (Ratio: ${p.ratio})`,
          subtitle: `Make: ${p.make} • Accuracy: ${p.accuracyClass}`,
          code: p.ptNumber,
          status: p.testResult.toUpperCase(),
          originalDoc: { category: 'pt', data: p }
        });
      }
    });

    // Search committee cases
    cases.forEach(c => {
      if (
        c.caseNumber.toLowerCase().includes(q) ||
        c.accountNumber.toLowerCase().includes(q) ||
        c.consumerName.toLowerCase().includes(q) ||
        c.meterNumber.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Test Check Dispute Committee Case',
          title: `Case: ${c.caseNumber} (Acc: ${c.accountNumber})`,
          subtitle: `Consumer: ${c.consumerName} • Target Meter: ${c.meterNumber}`,
          code: c.caseNumber,
          status: c.approvalStatus,
          originalDoc: { category: 'case', data: c }
        });
      }
    });

    return results;
  };

  const matchedSearchResults = executeCrossSearch();

  // QR Decoder Simulator
  const handleQRScanMock = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    setScanResultReport(null);

    const match = reports.find(
      r => r.reportNumber.toLowerCase() === scanInputCode.trim().toLowerCase() ||
           r.meterNumber.toLowerCase() === scanInputCode.trim().toLowerCase()
    );

    if (match) {
      setScanResultReport(match);
    } else {
      setScanError('Cryptological verification signature rejected or report hash mismatch. Please verify input characters are matching a signed report reference (try: REP-2026-0012).');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Tab controls with title bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            Compliance Records & Certificate Registry
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">View signed certificates, execute cross-reference audits, or verify digital cryptographic seal hashes.</p>
        </div>

        {/* Inner sub-navigation (4 States) */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded self-start">
          <button
            onClick={() => setActiveSubTab('archive')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              activeSubTab === 'archive' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Signed PDF Archive
          </button>
          <button
            onClick={() => setActiveSubTab('compilation')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all relative ${
              activeSubTab === 'compilation' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Awaiting Sign-off
            {metersTestedPendingReport.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white animate-pulse">
                {metersTestedPendingReport.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('search')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              activeSubTab === 'search' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Cross-Reference Finder
          </button>
          <button
            onClick={() => setActiveSubTab('qr')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              activeSubTab === 'qr' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            QR Verify
          </button>
        </div>
      </div>

      {activeSubTab === 'archive' && (
        /* PDF Signed Archive list (With PDF preview button) */
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden animate-in fade-in duration-150">
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Approved Calibration Certificates Archive ({filteredReports.length} of {reports.length})
            </span>
            <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 select-none">
              Locked under digital signatures with Class 0.05 primary meters
            </div>
          </div>

          {/* Regional Area Analysis Control & Performance Dashboard */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/25 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-850 dark:text-slate-300 tracking-wider">
                    Regional Area Analysis & Metrics
                  </h4>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-450 leading-none">
                    14-Digit Indexing Parser: Batch • Company • Circle • Division • Sub-Division
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAreaData}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-[10.5px] rounded border border-emerald-500/10 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Export styled Excel report containing filtered area metrics and certificate registry"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Filtered Area Data ({getSelectedAreaLabel()})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegBatch('all');
                    setRegCompany('all');
                    setRegCircle('all');
                    setRegDivision('all');
                    setRegSubdivision('all');
                  }}
                  className="px-2.5 py-1 text-[9.5px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-355 rounded border border-slate-200/50 dark:border-slate-700/60 transition cursor-pointer"
                >
                  Clear Region Filters
                </button>
              </div>
            </div>

            {/* Regional Dropdowns Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Batch */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Batch (1-2)
                </label>
                <select
                  value={regBatch}
                  onChange={(e) => setRegBatch(e.target.value)}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-medium"
                >
                  <option value="all">All Batches</option>
                  {['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','24','26','27','30','31','41','42','43'].map(b => (
                    <option key={b} value={b}>
                      Batch {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Company (3-7)
                </label>
                <select
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-medium"
                >
                  <option value="26">PESCO (26)</option>
                </select>
              </div>

              {/* Circle */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Circle Code (8)
                </label>
                <select
                  value={regCircle}
                  onChange={(e) => {
                    setRegCircle(e.target.value);
                    setRegDivision('all');
                    setRegSubdivision('all');
                  }}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-medium"
                >
                  <option value="all">All Circles</option>
                  {PESCO_HIERARCHY.map(c => (
                    <option key={c.code} value={c.code.substring(2)}>
                      {c.name} ({c.code.substring(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Division */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Division (9)
                </label>
                <select
                  value={regDivision}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegDivision(val);
                    if (val !== 'all') {
                      setRegCircle(val.substring(2, 3));
                    }
                    setRegSubdivision('all');
                  }}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-medium"
                >
                  <option value="all">All Divisions (33)</option>
                  {(() => {
                    const seen = new Set();
                    const list = PESCO_HIERARCHY.flatMap(c => c.divisions);
                    return list.filter(d => {
                      if (seen.has(d.code)) return false;
                      seen.add(d.code);
                      return true;
                    }).map(d => (
                      <option key={d.code} value={d.code}>
                        {d.name} ({d.code})
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* Sub-division */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Sub-Division (10)
                </label>
                <select
                  value={regSubdivision}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegSubdivision(val);
                    if (val !== 'all') {
                      setRegDivision(val.substring(0, 4));
                      setRegCircle(val.substring(2, 3));
                    }
                  }}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-medium"
                >
                  <option value="all">All Sub-Divisions (160)</option>
                  {(() => {
                    const seen = new Set();
                    const list = PESCO_HIERARCHY.flatMap(c => c.divisions.flatMap(d => d.subdivisions));
                    return list.filter(s => {
                      if (seen.has(s.code)) return false;
                      seen.add(s.code);
                      return true;
                    }).map(s => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* Performance Metrics inside the filter bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-805">
                <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase block font-bold leading-tight">Area Certificates</span>
                <span className="text-sm font-black text-slate-850 dark:text-white">{regTotalCount}</span>
                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 ml-1 font-medium">Issued</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-805">
                <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase block font-bold leading-tight">Compliance Rate</span>
                <span className={`text-sm font-black ${regPassRate >= 90 ? 'text-emerald-600' : regPassRate >= 70 ? 'text-blue-600' : 'text-rose-600'}`}>{regPassRate}%</span>
                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 ml-1 font-medium">Passed</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-805">
                <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase block font-bold leading-tight">Avg Calibration Drift</span>
                <span className="text-sm font-black text-blue-650 dark:text-blue-400">±{regAvgError}%</span>
                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 ml-1 font-medium">Error</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-805">
                <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase block font-bold leading-tight">Discrepancy Hotspot</span>
                <span className="text-xs font-black text-amber-600 truncate block mt-0.5" title={hotspotText}>
                  {hotspotText}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Multi-Criteria Dense Filter Bar */}
          <div className="p-3 bg-slate-50/50 dark:bg-slate-855/15 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            {/* Quick Search */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Quick Filter
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Report / Meter / Name / CC..."
                  value={filterSearchQuery}
                  onChange={(e) => setFilterSearchQuery(e.target.value)}
                  className="w-full text-xs pl-7.5 pr-2 py-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Meter Category */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Meter Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-xs p-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-semibold cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="single_phase">Single Phase</option>
                <option value="three_phase_whole">Three Phase Whole</option>
                <option value="three_phase_ct">Three Phase CT Op.</option>
                <option value="three_phase_ct_pt">Three Phase CT/PT Op.</option>
                <option value="smart">Smart Cellular</option>
              </select>
            </div>

            {/* Bench Verdict */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Bench Verdict
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-xs p-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-semibold cursor-pointer"
              >
                <option value="all">All Verdicts</option>
                <option value="pass">Passed ✓</option>
                <option value="fail">Failed ✗</option>
              </select>
            </div>

            {/* Date Range Fields */}
            <div className="md:col-span-3 grid grid-cols-2 gap-1.5">
              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Date From
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Date To
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Reset Controls */}
            <div className="md:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterCategory('all');
                  setFilterStatus('all');
                  setFilterSearchQuery('');
                }}
                className="w-full py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-805 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded font-black text-xs text-center transition active:scale-95 flex items-center justify-center min-h-[29px]"
                title="Reset Filters"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Batch Print Active Panel Bar */}
          {selectedReportIds.length > 0 && (
            <div className="mx-3 my-2 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-indigo-600 rounded-full animate-ping shrink-0" />
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  Batch Print Selected Mode Active: <strong className="font-extrabold">{selectedReportIds.length}</strong> certificates selected.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 select-none">
                <button
                  type="button"
                  onClick={() => {
                    const selectedReports = reports.filter(r => selectedReportIds.includes(r.id));
                    onOpenBatchReportPDF(selectedReports);
                  }}
                  className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print All Selected ({selectedReportIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReportIds([])}
                  className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto text-[11px] sm:text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-805 uppercase text-[9px] tracking-wider select-none">
                  <th className="p-3 w-10 text-center">
                    <input 
                      type="checkbox"
                      onChange={() => {
                        const allFilteredIds = filteredReports.map(r => r.id);
                        const allAreSelected = allFilteredIds.every(id => selectedReportIds.includes(id));
                        if (allAreSelected) {
                          setSelectedReportIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                        } else {
                          setSelectedReportIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                        }
                      }}
                      checked={filteredReports.length > 0 && filteredReports.map(r => r.id).every(id => selectedReportIds.includes(id))}
                      className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      title="Select / Deselect all filtered items"
                    />
                  </th>
                  <th className="p-3">Report Number</th>
                  <th className="p-3">Approved Date</th>
                  <th className="p-3">Consumer Details</th>
                  <th className="p-3">Tested Hardware</th>
                  <th className="p-3">Calibration Error</th>
                  <th className="p-3">Bench Verdict</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-300">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-450 dark:text-slate-500">
                      <HelpCircle className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">No Matching Archives Found</p>
                      <p className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-450">Try checking selection parameters or reset values to display all logs.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStartDate('');
                          setFilterEndDate('');
                          setFilterCategory('all');
                          setFilterStatus('all');
                          setFilterSearchQuery('');
                        }}
                        className="mt-3.5 inline-flex items-center gap-1 py-1 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[10px] rounded transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox"
                          onChange={() => {
                            setSelectedReportIds(prev => 
                              prev.includes(r.id) ? prev.filter(item => item !== r.id) : [...prev, r.id]
                            );
                          }}
                          checked={selectedReportIds.includes(r.id)}
                          className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {r.reportNumber}
                      </td>
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-450">{r.approvalDate}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{r.consumerName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-none">CC: {r.accountNumber}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-205">{r.meterNumber}</span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 block capitalize">
                          {r.meterType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-bold font-mono text-blue-600 dark:text-blue-400">{r.accuracyTest.errorPercentage}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.2 rounded text-[9px] font-bold ${
                          r.accuracyTest.passFail === 'Pass' 
                            ? 'bg-emerald-55 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30' 
                            : 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30'
                        }`}>
                          {r.accuracyTest.passFail === 'Pass' ? 'PASSED ✓' : 'FAILED ✗'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenReportPDF(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-[10px] rounded transition cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          View PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'compilation' && (
        /* Tested items backlog that needs formal reporting compile */
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden animate-in fade-in duration-150">
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
              Tested Backlog Awaiting Report Compilation ({metersTestedPendingReport.length})
            </span>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Calibration testing succeeded on these items, click compile to generate formal signature sheets.</p>
          </div>

          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metersTestedPendingReport.length === 0 ? (
              <div className="p-8 text-center text-slate-400 col-span-2 select-none">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-bold text-xs text-slate-700 dark:text-slate-300">Backlog Cleared!</p>
                <p className="text-[10px] mt-0.5 text-slate-450">All calibrated calibration tests have compiled signed certificates.</p>
              </div>
            ) : (
              metersTestedPendingReport.map(m => (
                <div key={m.id} className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/55 dark:bg-slate-850/20 flex justify-between items-center gap-3">
                  <div>
                    <span className="font-bold font-mono text-xs text-slate-900 dark:text-white">{m.meterNumber}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold capitalize">Type: {m.category.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">OEM: {m.manufacturer} • SN: {m.serialNumber}</p>
                  </div>

                  <button
                    onClick={() => onCompileReportForMeter(m)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded transition active:scale-95 shrink-0"
                  >
                    Compile Report
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'search' && (
        /* Advanced dynamic multi field cross reference engine */
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden animate-in fade-in duration-150 p-4 space-y-4">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white">
              Cross-Reference Finder & Record Search
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Query instantly across account index, meter tag, serial profiles, CTs, PTs, and Board Cases simultaneously.</p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type query to find cross-referenced details (e.g. Blue Ridge, 120938472, PT-2026)..."
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {globalQuery.trim() === '' ? (
            <div className="py-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Awaiting search keywords...</p>
              <p className="text-[10px] mt-0.5 select-none text-slate-455">Found indices are segmented by system origin automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[10.5px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                Segmented Results ({matchedSearchResults.length} Matched logs)
              </span>

              <div className="divide-y divide-slate-100 dark:divide-slate-805 border border-slate-200 dark:border-slate-800 rounded overflow-hidden bg-white dark:bg-slate-900">
                {matchedSearchResults.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-xs font-bold">No Records Found matching query.</p>
                  </div>
                ) : (
                  matchedSearchResults.map((res, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850/30 transition flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-black font-mono tracking-wider uppercase px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-900/30">
                          {res.type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 leading-tight">{res.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{res.subtitle}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 text-slate-505 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
                          {res.status}
                        </span>
                        
                        {/* Open Drawer */}
                        {res.originalDoc.category === 'report' ? (
                          <button
                            onClick={() => onOpenReportPDF(res.originalDoc.data)}
                            className="p-1 px-2.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded text-blue-800 dark:text-blue-300 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition"
                          >
                            Pull Certificate &rarr;
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 select-none">Active Entry</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'qr' && (
        /* Verification scan simulator */
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-xs p-5 max-w-2xl mx-auto space-y-4 animate-in fade-in duration-150 text-slate-850 dark:text-slate-300">
          <div className="text-center space-y-1 select-none">
            <Barcode className="w-10 h-10 text-slate-800 dark:text-slate-200 mx-auto animate-pulse" />
            <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white">
              Lab QR Verification Portal
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-450">Scan QR Code or Enter report serial hash to pull matching verification data directly from grid master key registry.</p>
          </div>

          <form onSubmit={handleQRScanMock} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Report Hash or No. (e.g. REP-2026-0012)"
              value={scanInputCode}
              onChange={(e) => setScanInputCode(e.target.value)}
              className="flex-grow text-xs font-mono p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white"
              required
            />
            <button
              type="submit"
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition active:scale-95"
            >
              Verify Certificate
            </button>
          </form>

          {scanError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-955/20 border-l-2 border-rose-500 text-rose-800 dark:text-rose-400 text-xs font-semibold rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {scanError}
            </div>
          )}

          {scanResultReport ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-black text-xs uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-450 animate-bounce" />
                Digital Cryptographic Signature Authenticated
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-450 block text-[10px]">Tested Meter Number</span>
                  <span className="font-bold text-slate-800 dark:text-white">{scanResultReport.meterNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-450 block text-[10px]">Tested Consumer Name</span>
                  <span className="font-bold text-slate-800 dark:text-white">{scanResultReport.consumerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-450 block text-[10px]">Calibration Error Limit</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{scanResultReport.accuracyTest.errorPercentage}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-450 block text-[10px]">Authority Signatures sealed</span>
                  <span className="font-bold text-slate-800 dark:text-white">Sealed by {scanResultReport.checkedBy}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenReportPDF(scanResultReport)}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition text-center block active:scale-95"
              >
                Pull Printable PDF Layout &rarr;
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-805 rounded text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed text-center">
              The verification portal matches dynamic ledger parameters against physical calibration parameters to certify field replacement meters.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
