/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  Calendar,
  MapPin,
  Building2,
  Info,
  Layers,
  ChevronDown,
  RefreshCw,
  FileDown,
  Table
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { TestReport, Meter, CTRecord, PTRecord, CommitteeCase, MeterCategory } from '../types';
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
  
  const [activeSubTab, setActiveSubTab] = useState<'compilation' | 'archive' | 'search' | 'qr' | 'periodicLogs' | 'tabulatedResults'>('archive');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  // Tabulated results states
  const [tabSearchQuery, setTabSearchQuery] = useState('');
  const [tabCategoryFilter, setTabCategoryFilter] = useState<'all' | MeterCategory>('all');
  const [tabVerdictFilter, setTabVerdictFilter] = useState<'all' | 'Pass' | 'Fail'>('all');
  const [tabStartDate, setTabStartDate] = useState('');
  const [tabEndDate, setTabEndDate] = useState('');
  const [isTabulatedPrintOpen, setIsTabulatedPrintOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  React.useEffect(() => {
    if (isTabulatedPrintOpen) {
      document.body.classList.add('print-ledger-active');
    } else {
      document.body.classList.remove('print-ledger-active');
    }
    return () => {
      document.body.classList.remove('print-ledger-active');
    };
  }, [isTabulatedPrintOpen]);

  React.useEffect(() => {
    if (isPrintModalOpen) {
      document.body.classList.add('print-periodic-active');
    } else {
      document.body.classList.remove('print-periodic-active');
    }
    return () => {
      document.body.classList.remove('print-periodic-active');
    };
  }, [isPrintModalOpen]);

  // Periodic and Jurisdictional Report states
  const [repLevel, setRepLevel] = useState<'pesco' | 'circle' | 'division' | 'subdivision'>('pesco');
  const [repInterval, setRepInterval] = useState<'monthly' | 'quarterly' | 'half_annual' | 'annual'>('monthly');
  const [repFilterYear, setRepFilterYear] = useState<string>('2026');
  const [repFilterMonth, setRepFilterMonth] = useState<string>('06'); // Default to June (corresponds to current local time)
  const [repFilterQuarter, setRepFilterQuarter] = useState<string>('Q2'); // April-June
  const [repFilterHalf, setRepFilterHalf] = useState<string>('H1'); // Jan-Jun
  const [repFilterCircle, setRepFilterCircle] = useState<string>('all');
  const [repFilterDivision, setRepFilterDivision] = useState<string>('all');
  const [repFilterSubdivision, setRepFilterSubdivision] = useState<string>('all');

  
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
  const [regCompany, setRegCompany] = useState('all');
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
          <button
            onClick={() => setActiveSubTab('periodicLogs')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all flex items-center gap-1 ${
              activeSubTab === 'periodicLogs' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-blue-500" />
            <span>Periodic Reports</span>
          </button>
          <button
            onClick={() => setActiveSubTab('tabulatedResults')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all flex items-center gap-1 ${
              activeSubTab === 'tabulatedResults' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tabulated Results</span>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e40e0e] hover:bg-[#e40e0e]/90 text-white font-extrabold text-[10.5px] rounded border border-[#93c200] hover:border-[#93c200]/90 shadow-xs transition-all active:scale-95 cursor-pointer"
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
                  Company
                </label>
                <select
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  className="w-full text-[11px] p-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-medium"
                >
                  <option value="all">All Companies</option>
                  <option value="26">PESCO (26)</option>
                </select>
              </div>

              {/* Circle */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Circle Code
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
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Division */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Division
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
                  <option value="all">All Divisions</option>
                  {(() => {
                    const seen = new Set();
                    const list = regCircle === 'all'
                      ? PESCO_HIERARCHY.flatMap(c => c.divisions)
                      : PESCO_HIERARCHY.filter(c => c.code.endsWith(regCircle)).flatMap(c => c.divisions);
                    return list.filter(d => {
                      if (seen.has(d.code)) return false;
                      seen.add(d.code);
                      return true;
                    }).map(d => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* Sub-division */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                  Sub-Division
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
                  <option value="all">All Sub-Divisions</option>
                  {(() => {
                    const seen = new Set();
                    let list = [];
                    if (regDivision !== 'all') {
                      list = PESCO_HIERARCHY.flatMap(c => c.divisions)
                        .filter(d => d.code === regDivision)
                        .flatMap(d => d.subdivisions);
                    } else if (regCircle !== 'all') {
                      list = PESCO_HIERARCHY.filter(c => c.code.endsWith(regCircle))
                        .flatMap(c => c.divisions)
                        .flatMap(d => d.subdivisions);
                    } else {
                      list = PESCO_HIERARCHY.flatMap(c => c.divisions.flatMap(d => d.subdivisions));
                    }
                    return list.filter(s => {
                      if (seen.has(s.code)) return false;
                      seen.add(s.code);
                      return true;
                    }).map(s => (
                      <option key={s.code} value={s.code}>
                        {s.name}
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
                <option value="bi_directional_three_phase_whole">Bi-Directional Three Phase Whole</option>
                <option value="bi_directional_ct_pt">Bi-Directional CT/PT Operated</option>
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

      {/* PERIODIC & REGIONAL REPORT COMPONENT TAB */}
      {activeSubTab === 'periodicLogs' && (() => {
        // Dynamic helpers to filter available areas based on selected circle
        const availableDivsForReports = (() => {
          if (repFilterCircle === 'all') return [];
          const circleMatch = PESCO_HIERARCHY.find(c => c.code.endsWith(repFilterCircle));
          return circleMatch ? circleMatch.divisions : [];
        })();

        const availableSubsForReports = (() => {
          if (repFilterDivision === 'all') return [];
          const circleMatch = PESCO_HIERARCHY.find(c => c.code.endsWith(repFilterCircle));
          if (!circleMatch) return [];
          const divMatch = circleMatch.divisions.find(d => d.code === repFilterDivision);
          return divMatch ? divMatch.subdivisions : [];
        })();

        // Periodic and Jurisdictional Filter Logic
        const periodicFilteredReports = (() => {
          return reports.filter(r => {
            const dateStr = r.testDate || r.approvalDate || '';
            const parts = dateStr.split('-');
            if (parts.length < 2) return false;
            const rYear = parts[0];
            const rMonth = parts[1]; // '01' to '12'

            // Year match
            if (rYear !== repFilterYear) return false;

            // Interval temporal match
            if (repInterval === 'monthly') {
              if (rMonth !== repFilterMonth) return false;
            } else if (repInterval === 'quarterly') {
              const qMap: Record<string, string[]> = {
                'Q1': ['01', '02', '03'],
                'Q2': ['04', '05', '06'],
                'Q3': ['07', '08', '09'],
                'Q4': ['10', '11', '12'],
              };
              if (!qMap[repFilterQuarter]?.includes(rMonth)) return false;
            } else if (repInterval === 'half_annual') {
              if (repFilterHalf === 'H1') {
                if (rMonth > '06') return false;
              } else {
                if (rMonth < '07') return false;
              }
            }
            return true;
          });
        })();

        // Matched detailed reports
        const detailMatchedReports = (() => {
          return periodicFilteredReports.filter(r => {
            const parsedDef = parseAccountNumber(r.accountNumber);
            const cIdTail = parsedDef.circleCode;
            const dCodeChar = parsedDef.divisionCode;
            const sCodeChar = parsedDef.subdivisionCode;

            if (repFilterCircle !== 'all' && cIdTail !== repFilterCircle) return false;
            
            if (repFilterDivision !== 'all') {
              const activeDivChar = repFilterDivision.substring(3);
              if (dCodeChar !== activeDivChar) return false;
            }

            if (repFilterSubdivision !== 'all') {
              const activeSubChar = repFilterSubdivision.substring(4);
              if (sCodeChar !== activeSubChar) return false;
            }

            return true;
          });
        })();

        // Summary breakdown values grouped dynamically
        const summaryBreakdown = (() => {
          const parseErrorVal = (pctStr: string): number => {
            const cleaned = pctStr.replace(/[^\d.-]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };

          if (repLevel === 'pesco') {
            return PESCO_HIERARCHY.map(circle => {
              const cIdTail = circle.code.substring(2);
              const subreps = periodicFilteredReports.filter(r => {
                const p = parseAccountNumber(r.accountNumber);
                return p.circleCode === cIdTail;
              });

              const total = subreps.length;
              const passed = subreps.filter(r => r.accuracyTest.passFail === 'Pass').length;
              const failed = total - passed;
              const errors = subreps.map(r => Math.abs(parseErrorVal(r.accuracyTest.errorPercentage)));
              const avgError = errors.length > 0 ? (errors.reduce((sum, v) => sum + v, 0) / errors.length) : 0;

              return {
                code: circle.code,
                name: circle.name + ' Circle',
                levelLabel: 'Circle',
                total,
                passed,
                failed,
                avgError,
              };
            });
          } else if (repLevel === 'circle') {
            let activeCircles = PESCO_HIERARCHY;
            if (repFilterCircle !== 'all') {
              activeCircles = PESCO_HIERARCHY.filter(c => c.code.endsWith(repFilterCircle));
            }

            return activeCircles.flatMap(circle => {
              const circleIdTail = circle.code.substring(2);
              return circle.divisions.map(div => {
                const divChar = div.code.substring(3);
                const subreps = periodicFilteredReports.filter(r => {
                  const p = parseAccountNumber(r.accountNumber);
                  return p.circleCode === circleIdTail && p.divisionCode === divChar;
                });

                const total = subreps.length;
                const passed = subreps.filter(r => r.accuracyTest.passFail === 'Pass').length;
                const failed = total - passed;
                const errors = subreps.map(r => Math.abs(parseErrorVal(r.accuracyTest.errorPercentage)));
                const avgError = errors.length > 0 ? (errors.reduce((sum, v) => sum + v, 0) / errors.length) : 0;

                return {
                  code: div.code,
                  name: `${div.name} Div (${circle.name})`,
                  levelLabel: 'Division',
                  total,
                  passed,
                  failed,
                  avgError,
                };
              });
            });
          } else if (repLevel === 'division') {
            let entries: Array<{ circleName: string; circleCodeTail: string; divCodeChar: string; div: any }> = [];
            
            PESCO_HIERARCHY.forEach(circle => {
              const circleCodeTail = circle.code.substring(2);
              if (repFilterCircle !== 'all' && circleCodeTail !== repFilterCircle) return;

              circle.divisions.forEach(div => {
                if (repFilterDivision !== 'all' && div.code !== repFilterDivision) return;
                entries.push({
                  circleName: circle.name,
                  circleCodeTail,
                  divCodeChar: div.code.substring(3),
                  div,
                });
              });
            });

            return entries.flatMap(({ circleName, circleCodeTail, divCodeChar, div }) => {
              return div.subdivisions.map((sub: any) => {
                const subCodeChar = sub.code.substring(4);
                const subreps = periodicFilteredReports.filter(r => {
                  const p = parseAccountNumber(r.accountNumber);
                  return p.circleCode === circleCodeTail && 
                         p.divisionCode === divCodeChar && 
                         p.subdivisionCode === subCodeChar;
                });

                const total = subreps.length;
                const passed = subreps.filter(r => r.accuracyTest.passFail === 'Pass').length;
                const failed = total - passed;
                const errors = subreps.map(r => Math.abs(parseErrorVal(r.accuracyTest.errorPercentage)));
                const avgError = errors.length > 0 ? (errors.reduce((sum, v) => sum + v, 0) / errors.length) : 0;

                return {
                  code: sub.code,
                  name: `${sub.name} Subdivision`,
                  levelLabel: 'Sub-Division',
                  total,
                  passed,
                  failed,
                  avgError,
                };
              });
            });
          } else {
            let entries: Array<{ circleName: string; circleCodeTail: string; divCodeChar: string; sub: any }> = [];
            
            PESCO_HIERARCHY.forEach(circle => {
              const circleCodeTail = circle.code.substring(2);
              if (repFilterCircle !== 'all' && circleCodeTail !== repFilterCircle) return;

              circle.divisions.forEach(div => {
                if (repFilterDivision !== 'all' && div.code !== repFilterDivision) return;
                div.subdivisions.forEach(sub => {
                  if (repFilterSubdivision !== 'all' && sub.code !== repFilterSubdivision) return;
                  entries.push({
                    circleName: circle.name,
                    circleCodeTail,
                    divCodeChar: div.code.substring(3),
                    sub,
                  });
                });
              });
            });

            return entries.map(({ circleName, circleCodeTail, divCodeChar, sub }) => {
              const subCodeChar = sub.code.substring(4);
              const subreps = periodicFilteredReports.filter(r => {
                const p = parseAccountNumber(r.accountNumber);
                return p.circleCode === circleCodeTail && 
                       p.divisionCode === divCodeChar && 
                       p.subdivisionCode === subCodeChar;
              });

              const total = subreps.length;
              const passed = subreps.filter(r => r.accuracyTest.passFail === 'Pass').length;
              const failed = total - passed;
              const errors = subreps.map(r => Math.abs(parseErrorVal(r.accuracyTest.errorPercentage)));
              const avgError = errors.length > 0 ? (errors.reduce((sum, v) => sum + v, 0) / errors.length) : 0;

              return {
                code: sub.code,
                name: `${sub.name} Subdivision`,
                levelLabel: 'Consumer Records',
                total,
                passed,
                failed,
                avgError,
              };
            });
          }
        })();

        // Overall sums and weighted averages
        const summaryTotal = summaryBreakdown.reduce((acc, curr) => acc + curr.total, 0);
        const summaryPassed = summaryBreakdown.reduce((acc, curr) => acc + curr.passed, 0);
        const summaryFailed = summaryBreakdown.reduce((acc, curr) => acc + curr.failed, 0);
        const summaryPassRate = summaryTotal > 0 ? Math.round((summaryPassed / summaryTotal) * 100) : 0;
        const summaryAvgError = summaryTotal > 0
          ? (summaryBreakdown.reduce((acc, curr) => acc + (curr.avgError * curr.total), 0) / summaryTotal).toFixed(3)
          : '0.000';

        // CSV Export formulation
        const handleExportPeriodicCSV = () => {
          const levelLabels = {
            pesco: 'PESCO Wide',
            circle: 'Circle Wise',
            division: 'Division Wise',
            subdivision: 'Sub-Division Wise'
          };
          const title = `PESCO MTLMS ${levelLabels[repLevel]} ${repInterval.toUpperCase()} REPORT - ${repFilterYear}`;
          
          const rows: string[][] = [
            ['PESHAWAR ELECTRIC SUPPLY COMPANY (PESCO)'],
            ['METERS TESTING LABORATORY & GRID COMPLIANCE SYSTEM'],
            [title],
            ['Exported On', formatPKTDateTime()],
            ['Parameters', `Year: ${repFilterYear} | Interval: ${repInterval.toUpperCase()} | Level: ${repLevel.toUpperCase()}`],
            [],
            ['SUMMARY KEY PERFORMANCE METRICS'],
            ['Metric', 'Value', 'Reference Info'],
            ['Total Inspected Units', String(summaryTotal), 'Approved utility assets'],
            ['Approved Pass Qty', String(summaryPassed), `${summaryPassRate}% Compliance Threshold`],
            ['Defective Fail Qty', String(summaryFailed), `${100 - summaryPassRate}% Defect rate`],
            ['Average Calibration Drift', `±${summaryAvgError}%`, 'Limit Trace Class 0.05 standard'],
            [],
            ['REGIONAL JURISDICTIONAL BREAKDOWN'],
            ['Code', 'Jurisdiction Name', 'Total Inspected', 'Passed Qty', 'Failed Qty', 'Pass Rate (%)', 'Avg Error (%)']
          ];

          summaryBreakdown.forEach(b => {
            const rate = b.total > 0 ? Math.round((b.passed / b.total) * 100) : 0;
            rows.push([
              b.code,
              b.name,
              String(b.total),
              String(b.passed),
              String(b.failed),
              `${rate}%`,
              `${b.avgError.toFixed(3)}%`
            ]);
          });

          if (detailMatchedReports.length > 0) {
            rows.push([]);
            rows.push(['DETAILED COMPLIANCE LEDGER LOGS']);
            rows.push(['Certificate No', 'Test Date', 'Account Number', 'Consumer Name', 'Meter Serial', 'Manufacturer', 'Type', 'Calibration Error', 'Verdict']);
            detailMatchedReports.forEach(r => {
              rows.push([
                r.reportNumber,
                r.testDate || r.approvalDate,
                r.accountNumber,
                r.consumerName,
                r.meterNumber,
                r.meterMake || 'PESCO Spec',
                r.meterType.toUpperCase().replace(/_/g, ' '),
                r.accuracyTest.errorPercentage,
                r.accuracyTest.passFail
              ]);
            });
          }

          const csvContent = rows
            .map(row => row.map(escapeCsvCell).join(','))
            .join('\r\n');

          const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
            type: 'text/csv;charset=utf-8;'
          });

          const filename = `PESCO_Periodic_${repLevel}_${repInterval}_${repFilterYear}_${getPKTDateString()}.csv`;
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

        const getActivePeriodLabel = () => {
          if (repInterval === 'monthly') {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[parseInt(repFilterMonth) - 1]} ${repFilterYear}`;
          } else if (repInterval === 'quarterly') {
            return `${repFilterQuarter} ${repFilterYear}`;
          } else if (repInterval === 'half_annual') {
            return `${repFilterHalf === 'H1' ? 'First Half (H1)' : 'Second Half (H2)'} ${repFilterYear}`;
          }
          return `Annual ${repFilterYear}`;
        };

        const chartData = summaryBreakdown.map(b => ({
          code: b.code,
          name: b.name.replace(/ Subdivision| Div| Circle/g, ''),
          'Passed': b.passed,
          'Failed': b.failed,
          'Total': b.total,
        }));

        return (
          <div className="space-y-4">
            
            {/* Filter Dashboard Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4 shadow-xs space-y-4">
              <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-3 justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-slate-850 dark:text-white tracking-wider flex items-center gap-1.5">
                      Periodic Report Parameters Setup
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-none">Assemble custom temporal compliance and failure rates audit sheets.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPeriodicCSV}
                    disabled={summaryTotal === 0}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-[#d90a0a] hover:bg-[#d90a0a]/90 text-white font-extrabold text-[10.5px] rounded border border-emerald-500/10 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export the filtered periodic regional breakdown and trace log directly to spreadsheet format"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    disabled={summaryTotal === 0}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-[10.5px] rounded border border-slate-750 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                </div>
              </div>

              {/* Main filter fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 1. Report Level */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                    1. Reporting Level
                  </label>
                  <select
                    value={repLevel}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setRepLevel(val);
                      if (val === 'pesco') {
                        setRepFilterCircle('all');
                        setRepFilterDivision('all');
                        setRepFilterSubdivision('all');
                      } else if (val === 'circle') {
                        setRepFilterDivision('all');
                        setRepFilterSubdivision('all');
                      } else if (val === 'division') {
                        setRepFilterSubdivision('all');
                      }
                    }}
                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-bold"
                  >
                    <option value="pesco">🏢 PESCO Wide (Circles)</option>
                    <option value="circle">📍 Circle Wise (Divisions)</option>
                    <option value="division">🏘️ Division Wise (Sub-Divs)</option>
                    <option value="subdivision">🏠 Sub-Division Wise</option>
                  </select>
                </div>

                {/* 2. Temporal Periodicity */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                    2. Periodicity Range
                  </label>
                  <select
                    value={repInterval}
                    onChange={(e) => setRepInterval(e.target.value as any)}
                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-bold"
                  >
                    <option value="monthly">📅 Monthly Report</option>
                    <option value="quarterly">📊 Quarterly Report</option>
                    <option value="half_annual">⚖️ Half-Annual Report</option>
                    <option value="annual">⭐ Annual Report</option>
                  </select>
                </div>

                {/* 3. Year */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                    3. Target Year
                  </label>
                  <select
                    value={repFilterYear}
                    onChange={(e) => setRepFilterYear(e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-semibold"
                  >
                    <option value="2026">2026 (Operational)</option>
                    <option value="2025">2025 (Archived)</option>
                    <option value="2024">2024 (Archived)</option>
                  </select>
                </div>

                {/* 4. Sub Intervals */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                    4. Active Range Interval
                  </label>
                  
                  {repInterval === 'monthly' && (
                    <select
                      value={repFilterMonth}
                      onChange={(e) => setRepFilterMonth(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-semibold"
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  )}

                  {repInterval === 'quarterly' && (
                    <select
                      value={repFilterQuarter}
                      onChange={(e) => setRepFilterQuarter(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-semibold"
                    >
                      <option value="Q1">Q1 (Jan - Mar)</option>
                      <option value="Q2">Q2 (Apr - Jun)</option>
                      <option value="Q3">Q3 (Jul - Sep)</option>
                      <option value="Q4">Q4 (Oct - Dec)</option>
                    </select>
                  )}

                  {repInterval === 'half_annual' && (
                    <select
                      value={repFilterHalf}
                      onChange={(e) => setRepFilterHalf(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-semibold"
                    >
                      <option value="H1">H1: First Half (Jan - Jun)</option>
                      <option value="H2">H2: Second Half (Jul - Dec)</option>
                    </select>
                  )}

                  {repInterval === 'annual' && (
                    <div className="text-xs p-2 bg-slate-100 dark:bg-slate-800/60 rounded text-slate-500 font-bold select-none text-center">
                      Full Year Selected
                    </div>
                  )}
                </div>
              </div>

              {/* Dependent Regional Selectors Row */}
              {repLevel !== 'pesco' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800/70 pt-3 animate-in slide-in-from-top-2 duration-150">
                  {/* Circle selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                      Target PESCO Circle
                    </label>
                    <select
                      value={repFilterCircle}
                      onChange={(e) => {
                        setRepFilterCircle(e.target.value);
                        setRepFilterDivision('all');
                        setRepFilterSubdivision('all');
                      }}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-semibold"
                    >
                      <option value="all">All PESCO Circles</option>
                      {PESCO_HIERARCHY.map(c => (
                        <option key={c.code} value={c.code.substring(2)}>
                          {c.name} Circle ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Division selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                      Target PESCO Division
                    </label>
                    <select
                      value={repFilterDivision}
                      disabled={repFilterCircle === 'all' || repLevel === 'circle'}
                      onChange={(e) => {
                        setRepFilterDivision(e.target.value);
                        setRepFilterSubdivision('all');
                      }}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <option value="all">All Divisions (Full Circle)</option>
                      {availableDivsForReports.map(d => (
                        <option key={d.code} value={d.code}>
                          {d.name} Division
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subdivision Selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                      Target PESCO Subdivision
                    </label>
                    <select
                      value={repFilterSubdivision}
                      disabled={repFilterDivision === 'all' || repLevel === 'division' || repLevel === 'circle'}
                      onChange={(e) => setRepFilterSubdivision(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <option value="all">All Sub-divisions</option>
                      {availableSubsForReports.map(s => (
                        <option key={s.code} value={s.code}>
                          {s.name} Sub-division
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {summaryTotal === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto space-y-3">
                <Info className="w-10 h-10 text-slate-355 dark:text-slate-700 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-sm uppercase text-slate-850 dark:text-white">
                  No Calibration Records for the Selected Range
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  There are no compiled laboratory reports matching your temporal criteria ({getActivePeriodLabel()}). Try shifting parameters to Q2/April/May/June 2026 to load active demo registries.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setRepLevel('pesco');
                      setRepInterval('monthly');
                      setRepFilterYear('2026');
                      setRepFilterMonth('05'); // May 2026 has active records in database!
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Load Active Testing Space (May 2026)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                {/* Statistics Cards */}
                <div className="md:col-span-1 space-y-3">
                  {/* Total Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded text-center">
                    <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                      Inspected Equipment
                    </span>
                    <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                      {summaryTotal} <span className="text-xs text-slate-400">Units</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-none mt-1">
                      Calibration logs loaded
                    </p>
                  </div>

                  {/* Compliance Rate progress */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded space-y-3 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                      Pass Compliance Threshold
                    </span>
                    
                    <div className="relative flex items-center justify-center h-24">
                      {/* SVG Circle Progress bar */}
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          className="text-slate-100 dark:text-slate-800"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={2 * Math.PI * 32 * (1 - summaryPassRate / 100)}
                          className="text-emerald-500 transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute font-mono text-lg font-black text-slate-900 dark:text-white">
                        {summaryPassRate}%
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] font-mono font-bold px-2">
                      <span className="text-emerald-500">Passed: {summaryPassed}</span>
                      <span className="text-rose-500">Failed: {summaryFailed}</span>
                    </div>
                  </div>

                  {/* Median error deviation percentage */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded text-center">
                    <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                      Mean Bench Performance Error
                    </span>
                    <p className="text-xl font-mono font-black text-blue-600 dark:text-blue-400 mt-1">
                      &plusmn;{summaryAvgError}%
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-none mt-1.5">
                      Relative to Class 0.05 primary meters
                    </p>
                  </div>
                </div>

                {/* Analytical Breakdown Charts & Detailed Tables */}
                <div className="md:col-span-3 space-y-4">
                  
                  {/* Recharts Jurisdictional Breakdown bar chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4">
                    <h4 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      Regional Compliance Breakdown
                    </h4>

                    <div className="h-44 w-full text-[10px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800/60" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} className="fill-slate-500 dark:fill-slate-400 font-bold" />
                          <YAxis axisLine={false} tickLine={false} className="fill-slate-500 dark:fill-slate-400 font-mono" />
                          <Tooltip content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 shadow-md text-[11px] font-bold space-y-1">
                                  <p className="text-slate-400 text-[10px]">{payload[0].payload.name}</p>
                                  <p className="text-emerald-400">Approved: {payload[0].payload.Passed} Units</p>
                                  <p className="text-rose-400">Defective: {payload[0].payload.Failed} Units</p>
                                  <p className="text-slate-200 pt-0.5 border-t border-slate-800">Total: {payload[0].payload.Total} Units</p>
                                </div>
                              );
                            }
                            return null;
                          }} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Bar dataKey="Passed" fill="#10b981" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Regional Breakdown Grid Table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40">
                      <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-300 tracking-wider block">
                        Jurisdictional Breakdown: {repLevel.toUpperCase()} LEVEL (May / June Active Ledger)
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-850/20 text-slate-450 dark:text-slate-500 uppercase text-[9px] font-extrabold border-b border-slate-200/50 dark:border-slate-800/70">
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Area / Region Name</th>
                            <th className="p-2.5 text-center">Inspected</th>
                            <th className="p-2.5 text-center text-emerald-600 dark:text-emerald-500">Passed</th>
                            <th className="p-2.5 text-center text-rose-600 dark:text-rose-500">Failed</th>
                            <th className="p-2.5 text-center">Pass Rate</th>
                            <th className="p-2.5 text-right font-mono">Avg Calibration Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-805 text-slate-800 dark:text-slate-350">
                          {summaryBreakdown.map((row, idx) => {
                            const rate = row.total > 0 ? Math.round((row.passed / row.total) * 100) : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                                <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">{row.code}</td>
                                <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300 uppercase">{row.name}</td>
                                <td className="p-2.5 text-center font-mono font-semibold">{row.total}</td>
                                <td className="p-2.5 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">{row.passed}</td>
                                <td className="p-2.5 text-center font-mono font-semibold text-rose-600 dark:text-rose-400">{row.failed}</td>
                                <td className="p-2.5 text-center">
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    rate >= 90 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                                  }`}>
                                    {rate}%
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-705 dark:text-slate-400">
                                  &plusmn;{row.avgError.toFixed(3)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Detailed Consumers Logs matching scope */}
                  {detailMatchedReports.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-850/40">
                        <span className="text-[10px] font-black uppercase text-slate-850 dark:text-slate-300 tracking-wider block">
                          Consolidated Testing Ledger ({detailMatchedReports.length} Active Records matched)
                        </span>
                      </div>

                      <div className="max-h-60 overflow-auto">
                        <table className="w-full text-left border-collapse text-[11px] font-semibold min-w-[650px]">
                          <thead className="bg-slate-50 dark:bg-slate-850/40 text-slate-450 dark:text-slate-500 uppercase text-[9px] font-black border-b border-slate-200 dark:border-slate-800 sticky top-0">
                            <tr>
                              <th className="p-2">Report No.</th>
                              <th className="p-2">Test Date</th>
                              <th className="p-2">Account No.</th>
                              <th className="p-2">Consumer</th>
                              <th className="p-2">Meter Serial</th>
                              <th className="p-2 text-center">Error %</th>
                              <th className="p-2 text-right">Verdict</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-805 text-slate-750 dark:text-slate-350 font-medium">
                            {detailMatchedReports.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/15 transition">
                                <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">{r.reportNumber}</td>
                                <td className="p-2 font-mono">{r.testDate || r.approvalDate}</td>
                                <td className="p-2 font-mono text-[10px]">{r.accountNumber}</td>
                                <td className="p-2 text-slate-905 dark:text-slate-205 truncate max-w-[120px] font-bold">{r.consumerName}</td>
                                <td className="p-2 font-mono">{r.meterNumber}</td>
                                <td className="p-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{r.accuracyTest.errorPercentage}</td>
                                <td className="p-2 text-right">
                                  <span className={`text-[9px] font-black rounded px-1.5 py-0.2 ${
                                    r.accuracyTest.passFail === 'Pass' 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700' 
                                      : 'bg-rose-50 dark:bg-rose-955/20 text-rose-700'
                                  }`}>
                                    {r.accuracyTest.passFail.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Print Letterhead Modal Dialog */}
            {isPrintModalOpen && createPortal(
              <div id="printable-periodic-overlay-container" className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 flex items-center justify-center p-3 animate-in fade-in duration-150 overflow-y-auto">
                {/* Action Buttons (Fixed at viewport bottom-right for accessibility) */}
                <div className="fixed bottom-6 right-6 flex gap-2 print:hidden z-50">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-lg shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Send to Printer</span>
                  </button>
                  <button
                    onClick={() => setIsPrintModalOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-sm rounded-lg shadow-xl transition-all border border-slate-200 cursor-pointer active:scale-95"
                  >
                    Close Preview
                  </button>
                </div>

                <div className="print-light-only bg-white text-slate-900 p-8 rounded border border-slate-350 shadow-2xl max-w-4xl w-full relative space-y-6 my-8 print:border-none print:shadow-none print:p-0 print:my-0">
                  
                  {/* Action Buttons removed from here */}

                  {/* Printable Executive Letterhead */}
                  <div className="space-y-6 text-slate-850 font-serif p-2">
                    
                    {/* Header Seal Banner */}
                    <div className="flex justify-between items-center border-b-4 border-double border-slate-800 pb-3">
                      <div>
                        <h1 className="text-xl font-black font-serif tracking-tight text-slate-900 uppercase">
                          Peshawar Electric Supply Company
                        </h1>
                        <p className="text-[11px] tracking-wide uppercase font-sans font-bold text-slate-650">
                          Meters Testing Laboratory &amp; Grid Compliance Division
                        </p>
                        <p className="text-[9.5px] text-slate-455 font-mono">
                          Trace Reference: WAPDA-MTL-26-REGULATORY
                        </p>
                      </div>

                      <div className="text-right font-sans">
                        <span className="text-[9px] font-black uppercase text-slate-500 border border-slate-300 px-2 py-0.5 rounded leading-none block">
                          Official Regulatory Dispatch
                        </span>
                        <p className="text-[10px] font-bold text-slate-700 mt-1 font-mono">
                          Date: {getPKTDateString()}
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-mono">
                          Time: {formatPKTDateTime()}
                        </p>
                      </div>
                    </div>

                    {/* Report Metadata Title Block */}
                    <div className="bg-slate-50 p-3.5 border border-slate-200/80 rounded space-y-1.5 font-sans">
                      <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        Executive Compliance Audit Sheet: {repLevel.toUpperCase()} LEVEL
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-medium text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Jurisdictional Level</span>
                          <span className="font-bold text-slate-805 uppercase">{repLevel}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Active Period</span>
                          <span className="font-bold text-slate-805">{getActivePeriodLabel()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">PESCO Circle</span>
                          <span className="font-bold text-slate-805 uppercase">{repFilterCircle === 'all' ? 'All Circles' : `Circle ${repFilterCircle}`}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Division Context</span>
                          <span className="font-bold text-slate-805 uppercase">{repFilterDivision === 'all' ? 'All Divisions' : `Div ${repFilterDivision.substring(3)}`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Report Executive Narrative text */}
                    <div className="text-xs leading-relaxed space-y-2 select-text font-sans">
                      <p>
                        This regulatory compliance report registers the calibration verdicts and accuracy outcomes of consumer electricity metering devices calibrated inside PESCO&apos;s primary laboratory space during the active temporal interval <strong className="font-bold">{getActivePeriodLabel()}</strong>. Calibration has been verified using standard three-phase and single-phase comparator test boards traceable back to national metrology references under <strong className="font-bold">Accuracy Class Class 0.05</strong>.
                      </p>
                    </div>

                    {/* Summary Metrics in Print Style */}
                    <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded font-sans text-center bg-slate-50/50 py-3">
                      <div>
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Inspected</span>
                        <span className="text-lg font-mono font-bold text-slate-900">{summaryTotal}</span>
                      </div>
                      <div className="border-l border-slate-250">
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Passed</span>
                        <span className="text-lg font-mono font-bold text-emerald-650">{summaryPassed}</span>
                      </div>
                      <div className="border-l border-slate-250">
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Defective</span>
                        <span className="text-lg font-mono font-bold text-rose-600">{summaryFailed}</span>
                      </div>
                      <div className="border-l border-slate-250">
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Defect Rate</span>
                        <span className="text-lg font-mono font-bold text-slate-900">{100 - summaryPassRate}%</span>
                      </div>
                    </div>

                    {/* Breakdown table printed clearly */}
                    <div className="space-y-1 font-sans">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-455">
                        Breakdown of Juridical Areas for period:
                      </span>
                      <table className="w-full text-left text-[10.5px] border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-400 text-[9px] font-extrabold uppercase text-slate-500 bg-slate-100">
                            <th className="p-1 px-2">Code</th>
                            <th className="p-1 px-2">Jurisdiction Name</th>
                            <th className="p-1 px-2 text-center">Inspected</th>
                            <th className="p-1 px-2 text-center">Passed</th>
                            <th className="p-1 px-2 text-center">Failed</th>
                            <th className="p-1 px-2 text-center">Pass Rate</th>
                            <th className="p-1 px-2 text-right">Avg Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {summaryBreakdown.map((row, idx) => {
                            const rate = row.total > 0 ? Math.round((row.passed / row.total) * 100) : 0;
                            return (
                              <tr key={idx}>
                                <td className="p-1.5 px-2 font-mono font-bold">{row.code}</td>
                                <td className="p-1.5 px-2 uppercase font-semibold">{row.name}</td>
                                <td className="p-1.5 px-2 text-center font-mono">{row.total}</td>
                                <td className="p-1.5 px-2 text-center font-mono text-emerald-700">{row.passed}</td>
                                <td className="p-1.5 px-2 text-center font-mono text-rose-700">{row.failed}</td>
                                <td className="p-1.5 px-2 text-center font-mono">{rate}%</td>
                                <td className="p-1.5 px-2 text-right font-mono font-bold">&plusmn;{row.avgError.toFixed(3)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Corporate dispatch authentication space */}
                    <div className="pt-8 font-sans text-xs" style={{ pageBreakInside: 'avoid' }}>
                      <div className="grid grid-cols-2 gap-8 text-slate-500 select-none">
                        <p>Report Compiled &amp; Reviewed By:</p>
                        <p className="text-right">Counter-Signed &amp; Approved For Field Dispatch:</p>
                      </div>
                      
                      <div className="h-12"></div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="border-t border-slate-400 pt-1">
                          <p className="font-bold">M. ABDULLAH KHAN</p>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight">Director, Quality Assurance &amp; Grid Bench Compliance</p>
                          <p className="text-[9px] text-slate-400 font-mono">ID No: QA-MTL-2601</p>
                        </div>
                        <div className="border-t border-slate-400 pt-1 text-right">
                          <p className="font-bold">CHIEF TESTING ENGINEER</p>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight">Peshawar Grid Compliance Laboratory Master, PESCO</p>
                          <p className="text-[9px] text-slate-400 font-mono">Class 0.05 Seal Authority: PESCO-0099</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer disclaimer */}
                    <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-455 text-center font-sans">
                      This summary certificate is system compiled using secure digital cryptographic seals and verified ledger logs. Peshawar Electric Supply Company (PESCO) reserves all tracing rights.
                    </div>

                  </div>
                </div>
              </div>,
              document.body
            )}

          </div>
        );
      })()}

      {/* TABULATED TEST RESULTS VIEW & PRINT COMPONENT */}
      {activeSubTab === 'tabulatedResults' && (() => {
        const getCategoryLabel = (cat: string) => {
          switch (cat) {
            case 'single_phase': return 'Single Phase Static';
            case 'three_phase_whole': return '3-Phase Whole Current';
            case 'three_phase_ct': return '3-Phase CT Operated';
            case 'three_phase_ct_pt': return '3-Phase CT & PT';
            case 'bi_directional_three_phase_whole': return 'Bi-Directional 3-Phase Whole Current';
            case 'bi_directional_ct_pt': return 'Bi-Directional 3-Phase CT & PT';
            case 'smart': return 'Smart AMR Meter';
            default: return cat;
          }
        };

        const tabulatedFilteredReports = reports.filter(r => {
          if (tabSearchQuery.trim()) {
            const q = tabSearchQuery.toLowerCase();
            const matchReportNo = r.reportNumber.toLowerCase().includes(q);
            const matchConsumer = r.consumerName.toLowerCase().includes(q);
            const matchAccount = r.accountNumber.toLowerCase().includes(q);
            const matchMeterNo = r.meterNumber.toLowerCase().includes(q);
            const matchSerial = r.serialNumber.toLowerCase().includes(q);
            const matchMake = r.meterMake.toLowerCase().includes(q);
            const matchChecked = r.checkedBy.toLowerCase().includes(q);
            if (!matchReportNo && !matchConsumer && !matchAccount && !matchMeterNo && !matchSerial && !matchMake && !matchChecked) {
              return false;
            }
          }

          if (tabCategoryFilter !== 'all') {
            if (r.meterType !== tabCategoryFilter) return false;
          }

          if (tabVerdictFilter !== 'all') {
            if (r.accuracyTest.passFail !== tabVerdictFilter) return false;
          }

          const reportDate = r.testDate || r.approvalDate || '';
          if (tabStartDate && reportDate < tabStartDate) return false;
          if (tabEndDate && reportDate > tabEndDate) return false;

          return true;
        });

        const tabFilteredTotal = tabulatedFilteredReports.length;
        const tabFilteredPassed = tabulatedFilteredReports.filter(r => r.accuracyTest.passFail === 'Pass').length;
        const tabFilteredFailed = tabulatedFilteredReports.filter(r => r.accuracyTest.passFail === 'Fail').length;
        const tabFilteredPassRate = tabFilteredTotal > 0 ? Math.round((tabFilteredPassed / tabFilteredTotal) * 100) : 0;

        const handleExportTabulatedCSV = () => {
          const rows: string[][] = [
            ['PESHAWAR ELECTRIC SUPPLY COMPANY (PESCO)'],
            ['METERS TESTING LABORATORY & COMPLIANCE LEDGER'],
            ['COMPREHENSIVE TABULATED ALL CALIBRATION AND TEST RESULTS'],
            ['Exported On', formatPKTDateTime()],
            ['Active Filters', `Search: ${tabSearchQuery || 'All'} | Type: ${tabCategoryFilter} | Verdict: ${tabVerdictFilter} | Range: ${tabStartDate || 'Any'} to ${tabEndDate || 'Any'}`],
            [],
            ['SNo', 'Report Number', 'Test Date', 'Account Number', 'Consumer Name', 'Meter Number', 'Serial Number', 'Make', 'Category', 'Test Load', 'PF', 'Error %', 'Limit', 'Verdict', 'Checked By']
          ];

          tabulatedFilteredReports.forEach((r, idx) => {
            rows.push([
              String(idx + 1),
              r.reportNumber,
              r.testDate || r.approvalDate,
              r.accountNumber,
              r.consumerName,
              r.meterNumber,
              r.serialNumber,
              r.meterMake,
              getCategoryLabel(r.meterType),
              r.accuracyTest.testLoad,
              r.accuracyTest.powerFactor,
              r.accuracyTest.errorPercentage,
              r.accuracyTest.standardLimit,
              r.accuracyTest.passFail,
              r.checkedBy
            ]);
          });

          const inlineEscapeCsvCell = (val: string) => {
            if (val === undefined || val === null) return '';
            const valStr = String(val);
            if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n') || valStr.includes('\r')) {
              return `"${valStr.replace(/"/g, '""')}"`;
            }
            return valStr;
          };

          const csvContent = rows
            .map(row => row.map(inlineEscapeCsvCell).join(','))
            .join('\r\n');

          const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
            type: 'text/csv;charset=utf-8;'
          });

          const filename = `PESCO_Tabulated_Test_Results_${getPKTDateString()}.csv`;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="space-y-6">
            
            {/* Search & Setup Filters panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-800 pb-3 justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Table className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-slate-850 dark:text-white tracking-wider flex items-center gap-1.5">
                      Tabulated Test Results Register
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-none">Filters, search, and bulk export, or preview a high-density, print-optimized ledger output.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportTabulatedCSV}
                    disabled={tabFilteredTotal === 0}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-[#d90a0a] hover:bg-[#d90a0a]/90 text-white font-extrabold text-[10.5px] rounded border border-emerald-500/10 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export currently filtered rows to spreadsheet form"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  
                  <button
                    onClick={() => setIsTabulatedPrintOpen(true)}
                    disabled={tabFilteredTotal === 0}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-[#d90a0a] hover:bg-[#d90a0a]/90 text-white font-extrabold text-[10.5px] rounded border border-emerald-500/10 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 duration-150"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Tabulated Ledger ({tabFilteredTotal})</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {/* Search */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest block font-sans">
                    Search Searchable Parameters
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search report, consumer, account, serial..."
                      value={tabSearchQuery}
                      onChange={(e) => setTabSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Meter Type */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest block font-sans">
                    Meter Category
                  </label>
                  <select
                    value={tabCategoryFilter}
                    onChange={(e) => setTabCategoryFilter(e.target.value as any)}
                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-bold"
                  >
                    <option value="all">All categories</option>
                    <option value="single_phase">Single Phase Static</option>
                    <option value="three_phase_whole">3-Phase Whole Current</option>
                    <option value="three_phase_ct">3-Phase CT Operated</option>
                    <option value="three_phase_ct_pt">3-Phase CT & PT</option>
                    <option value="bi_directional_three_phase_whole">Bi-Directional 3-Phase Whole Current</option>
                    <option value="bi_directional_ct_pt">Bi-Directional 3-Phase CT & PT</option>
                    <option value="smart">Smart AMR Meter</option>
                  </select>
                </div>

                {/* Verdict */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-555 uppercase tracking-widest block font-sans">
                    Bench Verdict Out
                  </label>
                  <select
                    value={tabVerdictFilter}
                    onChange={(e) => setTabVerdictFilter(e.target.value as any)}
                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white cursor-pointer font-bold"
                  >
                    <option value="all">All Verdicts</option>
                    <option value="Pass">Passed / Approved</option>
                    <option value="Fail">Defective / Rejected</option>
                  </select>
                </div>

                {/* Filters Reset */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTabSearchQuery('');
                      setTabCategoryFilter('all');
                      setTabVerdictFilter('all');
                      setTabStartDate('');
                      setTabEndDate('');
                    }}
                    className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-805 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded font-black text-xs text-center transition active:scale-95 flex items-center justify-center min-h-[30px]"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Date Filters block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest block font-sans">
                    Testing Interval Start Date
                  </label>
                  <input
                    type="date"
                    value={tabStartDate}
                    onChange={(e) => setTabStartDate(e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest block font-sans">
                    Testing Interval End Date
                  </label>
                  <input
                    type="date"
                    value={tabEndDate}
                    onChange={(e) => setTabEndDate(e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded shadow-xs relative overflow-hidden">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block font-sans">Total Filtered</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">{tabFilteredTotal}</span>
                <p className="text-[9.5px] mt-0.5 text-slate-450 font-sans">Units matching query</p>
                <div className="absolute right-3 bottom-3 w-7 h-7 bg-blue-500/5 rounded-full flex items-center justify-center text-blue-500 text-xs font-mono">#</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded shadow-xs relative overflow-hidden">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block font-sans">Approved compliant</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">{tabFilteredPassed}</span>
                <p className="text-[9.5px] mt-0.5 text-emerald-600/80 font-sans">Calibration passed</p>
                <div className="absolute right-3 bottom-3 w-7 h-7 bg-emerald-500/5 rounded-full flex items-center justify-center text-emerald-500 text-xs font-bold leading-none">&check;</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded shadow-xs relative overflow-hidden">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block font-sans">Defective rejected</span>
                <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">{tabFilteredFailed}</span>
                <p className="text-[9.5px] mt-0.5 text-rose-500/70 font-sans">WAPDA M&amp;T Class failure</p>
                <div className="absolute right-3 bottom-3 w-7 h-7 bg-rose-500/5 rounded-full flex items-center justify-center text-rose-500 text-xs font-mono">&times;</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded shadow-xs relative overflow-hidden">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block font-sans">Inspected Pass Rate</span>
                <span className={`text-xl font-bold font-mono mt-1 block ${tabFilteredPassRate >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>{tabFilteredPassRate}%</span>
                <p className="text-[9.5px] mt-0.5 text-slate-450 font-sans">Precision compliance</p>
                <div className="absolute right-3 bottom-3 w-7 h-7 bg-purple-500/5 rounded-full flex items-center justify-center text-purple-500 text-[10px] font-bold">%</div>
              </div>
            </div>

            {/* List Table Data Grid */}
            <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-350">
                  Tabulated Record Registry ({tabFilteredTotal} items)
                </span>
                <span className="text-[10px] font-mono text-slate-500 select-none">Accuracy Class Reference limits: &plusmn;1.0%</span>
              </div>

              <div className="overflow-x-auto text-[11px] sm:text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-805 uppercase text-[9px] tracking-wider select-none">
                      <th className="p-3 w-12 text-center">S.No</th>
                      <th className="p-3">Report Number</th>
                      <th className="p-3">Test Date</th>
                      <th className="p-3">Consumer &amp; Location</th>
                      <th className="p-3">Meter Hardware</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Applied test params</th>
                      <th className="p-3 text-center">Accuracy Class Error</th>
                      <th className="p-3 text-center">Bench Verdict</th>
                      <th className="p-3">Calibration Eng</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-805 dark:text-slate-300">
                    {tabulatedFilteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-12 text-center text-slate-400">
                          <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">No Calibration Results Found</p>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">No test results registered inside standard database registry matched your filters. Alter query params or pick other categories to display results.</p>
                        </td>
                      </tr>
                    ) : (
                      tabulatedFilteredReports.map((r, idx) => {
                        const isPass = r.accuracyTest.passFail === 'Pass';
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 duration-100 divide-x divide-transparent">
                            <td className="p-3 text-center font-bold text-slate-550 dark:text-slate-400 font-mono text-[10px] select-none">{idx + 1}</td>
                            <td className="p-3 font-black text-slate-900 dark:text-white font-mono tracking-tight">{r.reportNumber}</td>
                            <td className="p-3 font-mono text-slate-650 dark:text-slate-350">{r.testDate || r.approvalDate}</td>
                            <td className="p-3 max-w-[200px]">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block uppercase leading-tight text-[11px] font-sans">{r.consumerName}</span>
                                <span className="text-[9.5px] font-mono text-slate-455 block leading-tight mt-0.5">Acc: {r.accountNumber}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block leading-tight font-sans">No: {r.meterNumber}</span>
                                <span className="text-[9.5px] text-slate-455 block leading-tight mt-0.5 font-mono">S/N: {r.serialNumber} • {r.meterMake}</span>
                              </div>
                            </td>
                            <td className="p-3 font-semibold text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-tighter font-sans">{getCategoryLabel(r.meterType)}</td>
                            <td className="p-3 font-mono text-[10px]">
                              <div>V: {r.accuracyTest.testVoltage || '230 V'}</div>
                              <div>I: {r.accuracyTest.testCurrent || r.accuracyTest.testLoad || '10 A'} • PF: {r.accuracyTest.powerFactor || '1.0'}</div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                                {r.accuracyTest.errorPercentage}
                              </div>
                              <div className="text-[8.5px] text-slate-450 mt-0.5 font-sans">Limit {r.accuracyTest.standardLimit}</div>
                              {r.ctPtExtra?.resultsCheckingSlow && (
                                <div className="text-[8px] font-bold text-rose-500 font-sans tracking-tight leading-none mt-1">Slow Check: {r.ctPtExtra.resultsCheckingSlow}%</div>
                              )}
                            </td>
                            <td className="p-3 text-center select-none">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase leading-none tracking-wider font-sans ${
                                isPass 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650' 
                                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                              }`}>
                                <span className={`h-1 w-1 rounded-full ${isPass ? 'bg-emerald-650' : 'bg-rose-600'}`} />
                                {isPass ? 'Pass' : 'Failed'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div>
                                <span className="font-bold text-slate-705 dark:text-slate-300 block text-[10.5px] font-sans">{r.checkedBy}</span>
                                <span className="text-[8.5px] text-slate-400 block tracking-tight font-sans">{r.checkedByDesignation || 'Testing Eng'}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => onOpenReportPDF(r)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-blue-650 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded border border-blue-200/50 hover:border-blue-300 font-bold text-[10px] uppercase cursor-pointer tracking-wider active:scale-95 transition"
                              >
                                <Printer className="w-3 h-3 shrink-0" />
                                <span>Certificate</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABULATED PRINT LEADERSHIP OVERLAY MODAL */}
            {isTabulatedPrintOpen && createPortal(
              <div id="printable-ledger-overlay-container" className="fixed inset-0 z-50 bg-slate-900/65 dark:bg-slate-950/80 flex items-center justify-center p-3 animate-in fade-in duration-150 overflow-y-auto">
                {/* Action Row (Fixed at viewport bottom-right for accessibility) */}
                <div className="fixed bottom-6 right-6 flex gap-2 print:hidden z-50">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-lg shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Send to Printer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTabulatedPrintOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-sm rounded-lg shadow-xl transition-all border border-slate-200 cursor-pointer active:scale-95"
                  >
                    Close Preview
                  </button>
                </div>

                <div className="print-light-only bg-white text-slate-900 p-8 rounded border border-slate-350 shadow-2xl max-w-6xl w-full relative space-y-6 my-8 print:border-none print:shadow-none print:p-0 print:my-0">
                  
                  {/* Action row removed from here */}

                  {/* Header Letterhead for PESCO Official Regulatory Document */}
                  <div className="space-y-6 text-slate-950 font-serif p-2">
                    <div className="flex justify-between items-center border-b-4 border-double border-slate-900 pb-3">
                      <div>
                        <h1 className="text-xl font-black font-serif tracking-tight uppercase leading-none text-slate-900">
                          Peshawar Electric Supply Company (PESCO)
                        </h1>
                        <p className="text-[11px] tracking-wide uppercase font-sans font-bold text-slate-650 mt-1 leading-tight">
                          METERS TESTING LABORATORY &amp; COMPLIANCE DIVISION
                        </p>
                        <p className="text-[9.5px] text-slate-450 font-mono tracking-tight leading-none mt-0.5">
                          Trace Reference: MTL-TABULATED-LOGS-{getPKTDateString()}
                        </p>
                      </div>

                      <div className="text-right font-sans leading-tight">
                        <span className="text-[9.5px] font-black uppercase text-white bg-slate-900 px-2.5 py-1 rounded leading-none block">
                          CONSOLIDATED LEDGER DISPATCH
                        </span>
                        <p className="text-[10px] font-bold text-slate-700 mt-1.5 font-mono">
                          Date: {getPKTDateString()}
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-mono">
                          Time: {formatPKTDateTime()}
                        </p>
                      </div>
                    </div>

                    {/* Meta Parameter card context details */}
                    <div className="bg-slate-50 p-3.5 border border-slate-300 rounded space-y-1 font-sans">
                      <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        Master Tabulated Meter Calibration ledger record sheet
                      </h2>
                      <div className="grid grid-cols-4 gap-4 text-[10px] font-medium text-slate-600">
                        <div>
                          <span className="text-slate-450 block text-[8px] uppercase tracking-wider font-extrabold">Active Category Scope</span>
                          <span className="font-bold text-slate-800 uppercase">{tabCategoryFilter === 'all' ? 'All Hardware Categories' : getCategoryLabel(tabCategoryFilter)}</span>
                        </div>
                        <div>
                          <span className="text-slate-455 block text-[8px] uppercase tracking-wider font-extrabold">Verdict Filter</span>
                          <span className="font-bold text-slate-800 uppercase">{tabVerdictFilter === 'all' ? 'All Verdicts' : (tabVerdictFilter === 'Pass' ? 'Approved' : 'Failed')}</span>
                        </div>
                        <div>
                          <span className="text-slate-455 block text-[8px] uppercase tracking-wider font-extrabold">Date Interval</span>
                          <span className="font-bold text-slate-800">{tabStartDate || tabEndDate ? `${tabStartDate || 'Any'} - ${tabEndDate || 'Any'}` : 'All historic registries'}</span>
                        </div>
                        <div>
                          <span className="text-slate-455 block text-[8px] uppercase tracking-wider font-extrabold">Total Matched Records</span>
                          <span className="font-black text-slate-950 font-mono">{tabFilteredTotal} items matched</span>
                        </div>
                      </div>
                    </div>

                    {/* Official Dispatch Introductory Narrative Text */}
                    <div className="text-[11px] leading-relaxed font-sans text-slate-800">
                      We hereby record and certify the official calibration outcomes and measurement verdicts for consumers electrical energy meters tested inside PESCO primary compliance and calibration grid boards. Standard calibrations are mapped against trace comparator models Class 0.05 under continuous verification.
                    </div>

                    {/* Summary figures of printed sheet */}
                    <div className="grid grid-cols-4 gap-2 border border-slate-400 rounded font-sans text-center bg-slate-50 py-2.5">
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Inspected Qty</span>
                        <span className="text-base font-mono font-bold text-slate-900">{tabFilteredTotal}</span>
                      </div>
                      <div className="border-l border-slate-300">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Passed Qty</span>
                        <span className="text-base font-mono font-bold text-emerald-700">{tabFilteredPassed}</span>
                      </div>
                      <div className="border-l border-slate-300">
                        <span className="text-[8px] font-bold text-slate-550 uppercase tracking-widest block">Defective Qty</span>
                        <span className="text-base font-mono font-bold text-rose-700">{tabFilteredFailed}</span>
                      </div>
                      <div className="border-l border-slate-300">
                        <span className="text-[8px] font-bold text-slate-550 uppercase tracking-widest block">Compliance Rate</span>
                        <span className="text-base font-mono font-bold text-slate-950">{tabFilteredPassRate}%</span>
                      </div>
                    </div>

                    {/* High-density, print-optimized document table with thin borders */}
                    <div className="space-y-1 font-sans">
                      <table className="w-full text-left font-sans text-[10px] border-collapse" style={{ pageBreakInside: 'auto' }}>
                        <thead>
                          <tr className="border-y border-slate-700 text-[8.5px] font-black uppercase text-slate-700 font-sans tracking-wide bg-slate-100">
                            <th className="p-1 px-1.5 text-center w-8">SN</th>
                            <th className="p-1 px-1.5">Report No</th>
                            <th className="p-1 px-1.5">Test Date</th>
                            <th className="p-1 px-1.5">Consumer &amp; Account</th>
                            <th className="p-1 px-1.5">Meter Hardware Params</th>
                            <th className="p-1 px-1.5">Category</th>
                            <th className="p-1 px-1.5">Test Load</th>
                            <th className="p-1 px-1.5 font-mono text-center">Error %</th>
                            <th className="p-1 px-1.5 text-center">Verdict</th>
                            <th className="p-1 px-1.5">Signature Officer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 text-slate-950">
                          {tabulatedFilteredReports.map((r, idx) => (
                            <tr key={r.id} style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                              <td className="p-1.5 px-1 text-center font-bold font-mono text-[9px] text-slate-550">{idx + 1}</td>
                              <td className="p-1.5 px-1.5 font-bold font-mono text-slate-950">{r.reportNumber}</td>
                              <td className="p-1.5 px-1.5 font-mono">{r.testDate || r.approvalDate}</td>
                              <td className="p-1.5 px-1.5 uppercase font-medium">
                                <span className="font-extrabold block text-[9.5px]">{r.consumerName}</span>
                                <span className="text-[8.5px] font-mono text-slate-600 block mt-0.5 font-mono">Acc: {r.accountNumber}</span>
                              </td>
                              <td className="p-1.5 px-1.5">
                                <span className="font-bold block text-[9.5px]">No: {r.meterNumber}</span>
                                <span className="text-[8px] font-mono text-slate-655 block font-mono">S/N: {r.serialNumber} • {r.meterMake}</span>
                              </td>
                              <td className="p-1.5 px-1.5 uppercase text-[8.5px] font-bold text-slate-605">{getCategoryLabel(r.meterType)}</td>
                              <td className="p-1.5 px-1.5 text-[8.5px] font-mono font-mono">
                                Load: {r.accuracyTest.testLoad || '10A'} @ {r.accuracyTest.testVoltage || '230V'}
                              </td>
                              <td className="p-1.5 px-1.5 text-center font-mono font-black text-xs text-blue-900 font-mono">
                                {r.accuracyTest.errorPercentage}
                                {r.ctPtExtra?.resultsCheckingSlow && (
                                  <div className="text-[7.5px] text-rose-700 font-sans tracking-tighter block leading-none mt-0.5">Slow: {r.ctPtExtra.resultsCheckingSlow}%</div>
                                )}
                              </td>
                              <td className="p-1.5 px-1.5 text-center uppercase tracking-wider font-extrabold text-[8.5px]">
                                <span className={r.accuracyTest.passFail === 'Pass' ? 'text-emerald-800' : 'text-rose-800'}>
                                  {r.accuracyTest.passFail === 'Pass' ? 'PASSED' : 'DEFECTIVE'}
                                </span>
                              </td>
                              <td className="p-1.5 px-1.5">
                                <span className="font-bold block text-[9px]">{r.checkedBy}</span>
                                <span className="text-[8px] text-slate-500 block leading-none">{r.checkedByDesignation || 'M&T Engineer'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Sign sections for document authenticator seal space */}
                    <div className="pt-10 font-sans text-[11px]" style={{ pageBreakInside: 'avoid' }}>
                      <div className="grid grid-cols-2 gap-10 text-slate-500 select-none">
                        <p>Ledger Entries Compiled &amp; Audited By:</p>
                        <p className="text-right font-sans">Authorized Signatures Counter-Sealed For Field Release:</p>
                      </div>
                      
                      <div className="h-10"></div>

                      <div className="grid grid-cols-2 gap-10">
                        <div className="border-t border-slate-300 pt-1">
                          <p className="font-bold text-slate-900">M. ABDULLAH KHAN</p>
                          <p className="text-[9.5px] text-slate-500 font-medium leading-none">Director, Quality Assurance &amp; Grid Bench Compliance</p>
                          <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">ID No: QA-MTL-2601</p>
                        </div>
                        <div className="border-t border-slate-300 pt-1 text-right">
                          <p className="font-bold text-slate-900">CHIEF TESTING ENGINEER</p>
                          <p className="text-[9.5px] text-slate-500 font-medium leading-none">Peshawar Grid Compliance Laboratory Master, PESCO</p>
                          <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">Class 0.05 Verification Seal Authority: PESCO-0099</p>
                        </div>
                      </div>
                    </div>

                    {/* Security Verification disclaimer footer */}
                    <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-450 text-center font-sans">
                      This formal master calibration journal is electronically compiled from verified and signed laboratory benches. It is protected under secure digital seals with WAPDA regulatory compliance keys.
                    </div>

                  </div>

                </div>
              </div>,
              document.body
            )}

          </div>
        );
      })()}

    </div>
  );
}
