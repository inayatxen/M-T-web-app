/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getPKTDateString } from '../utils';
import { 
  PlusCircle, 
  Search, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ClipboardList,
  User,
  Hash,
  Filter,
  MapPin,
  Building2,
  SlidersHorizontal,
  UploadCloud,
  Download,
  QrCode,
  Camera,
  Boxes,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import QRScannerModal from './QRScannerModal';
import { PhotoCapture } from './PhotoCapture';
import { read, utils, write } from 'xlsx';
import { EquipmentReceipt, MeterCategory, Meter } from '../types';
import { parseAccountNumber, getCircleName, getDivisionName, getSubdivisionName, PESCO_HIERARCHY } from '../utils';

const mapMeterCategory = (rawType: string): MeterCategory => {
  const norm = rawType.toLowerCase().trim();
  if (norm.includes('single') || norm.includes('1-phase') || norm.includes('1 phase') || norm === '1p') {
    return 'single_phase';
  }
  if (norm.includes('whole') || norm.includes('wc') || norm.includes('whole current')) {
    return 'three_phase_whole';
  }
  if (norm.includes('ct/pt') || norm.includes('ctpt') || norm.includes('ct-pt')) {
    return 'three_phase_ct_pt';
  }
  if (norm.includes('three phase ct') || norm.includes('three_phase_ct') || norm.includes('ct operated') || norm.includes('ct-operated')) {
    return 'three_phase_ct';
  }
  if (norm.includes('smart') || norm.includes('sim') || norm.includes('cellular')) {
    return 'smart';
  }
  if (norm.includes('three') || norm.includes('3-phase') || norm.includes('3 phase') || norm === '3p') {
    return 'three_phase_whole';
  }
  return 'single_phase';
};

interface ParsedBulkRow {
  index: number;
  rawText: string;
  consumerAccount: string;
  consumerName: string;
  fatherName: string;
  meterType: MeterCategory;
  meterNumber: string;
  readings: string;
  serialNumber: string;
  make: string;
  reasonForTesting: string;
  receivedFrom: string;
  isValid: boolean;
  errors: string[];
}

const parseBulkInput = (text: string): ParsedBulkRow[] => {
  if (!text.trim()) return [];
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const results: ParsedBulkRow[] = [];

  lines.forEach((line, idx) => {
    // Check if this is the header row
    const isHeader = line.toLowerCase().includes('consumer account') || 
                     line.toLowerCase().includes('consumer name') || 
                     line.toLowerCase().includes('primary name') ||
                     line.toLowerCase().includes('father') ||
                     line.toLowerCase().includes('guardian') ||
                     line.toLowerCase().includes('meter target type') ||
                     line.toLowerCase().includes('warp') ||
                     line.toLowerCase().includes('letter') ||
                     line.toLowerCase().includes('testing reason');
    if (isHeader && idx === 0) {
      return;
    }

    // Determine splitter (tab vs comma)
    const tabCount = (line.match(/\t/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;
    let parts: string[] = [];

    if (tabCount >= 4) {
      parts = line.split('\t');
    } else if (commaCount >= 4) {
      parts = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
    } else {
      parts = line.split(/[,\t]/).map(p => p.trim());
    }

    const errors: string[] = [];
    
    const consumerAccountRaw = (parts[0] || '').trim();
    const consumerName = (parts[1] || '').trim();
    const fatherName = (parts[2] || '').trim();
    const meterTypeRaw = (parts[3] || '').trim();
    const meterNumber = (parts[4] || '').trim();
    const readings = (parts[5] || '').trim();
    const serialNumber = (parts[6] || '').trim();
    const make = (parts[7] || '').trim();
    const reasonForTesting = (parts[8] || '').trim();
    const receivedFrom = (parts[9] || '').trim();

    const digitsOnlyObj = consumerAccountRaw.replace(/\D/g, '');
    if (!consumerAccountRaw) {
      errors.push('Account field missing');
    } else if (digitsOnlyObj.length < 10 || digitsOnlyObj.length > 15) {
      errors.push(`Account layout is invalid (needs 10-14 digits internally)`);
    }

    if (!consumerName) {
      errors.push('Name field missing');
    }

    if (!fatherName) {
      errors.push('Father/Guardian field missing');
    }
    
    if (!meterNumber) {
      errors.push('Meter Number missing');
    }

    if (!serialNumber) {
      errors.push('Serial Number missing');
    }

    if (!make) {
      errors.push('Make/Manufacturer missing');
    }

    if (!reasonForTesting) {
      errors.push('Testing Reason missing');
    }

    const meterType = mapMeterCategory(meterTypeRaw);

    results.push({
      index: idx + (isHeader ? 1 : 1),
      rawText: line,
      consumerAccount: consumerAccountRaw,
      consumerName,
      fatherName,
      meterType,
      meterNumber,
      readings,
      serialNumber,
      make,
      reasonForTesting,
      receivedFrom: receivedFrom || 'Unspecified Division',
      isValid: errors.length === 0,
      errors
    });
  });

  return results;
};

interface RegisterViewProps {
  receipts: EquipmentReceipt[];
  onAddReceipt: (newReceipt: EquipmentReceipt, associatedMeter: Meter) => void;
  onAddBulkReceipts?: (newReceipts: EquipmentReceipt[], associatedMeters: Meter[]) => void;
  currentUser: any;
  meters?: Meter[];
  onPushMeterToInventory?: (associatedMeter: Meter) => void;
  onPushBulkMetersToInventory?: (metersToPush: Meter[]) => void;
}

export default function RegisterView({ 
  receipts, 
  onAddReceipt, 
  onAddBulkReceipts, 
  currentUser,
  meters = [],
  onPushMeterToInventory,
  onPushBulkMetersToInventory
}: RegisterViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find receipts that are NOT in meters (Inventory Vault)
  const pendingPushReceipts = receipts.filter(r => 
    !meters.some(m => m.meterNumber === r.meterNumber || m.serialNumber === r.serialNumber)
  );

  const getMeterFromReceipt = (r: EquipmentReceipt): Meter => {
    return {
      id: `m-push-${r.id}-${Date.now()}`,
      meterNumber: r.meterNumber,
      serialNumber: r.serialNumber,
      manufacturer: r.make,
      accuracyClass: r.meterType === 'single_phase' ? 'Class 1.0' : 
                     r.meterType === 'three_phase_whole' ? 'Class 1.0' :
                     r.meterType === 'smart' ? 'Class 0.2S' : 'Class 0.5S',
      category: r.meterType,
      status: 'received',
      stockStatus: 'In Store',
      purchaseDate: r.dateReceived,
      remarks: `Manually pushed to inventory from register receipt ${r.receiptNumber}.`,
      consumerAccount: r.consumerAccount
    };
  };
  
  // Intake Form Mode configuration: Single record entry vs Bulk intake sheets import
  const [formMode, setFormMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');

  const downloadExcelTemplate = () => {
    try {
      const headers = [
        [
          'Consumer Account Number (14 Digits) *',
          'Consumer Primary Name *',
          'Father / Guardian Name *',
          'Meter Target Type (single_phase / three_phase_whole / three_phase_ct / smart) *',
          'Meter ID / Number *',
          'Readings',
          'Warp / Serial Code:',
          'Manufacturer Make *',
          'Testing Reason *',
          'Origin Division Received From'
        ]
      ];
      const sampleData = [
        ['01263110083301', 'Blue Ridge Textiles Ltd', 'Haji Waris Khan', 'single_phase', 'MTR-102941', '12845.2', 'SN-109281-B', 'Landis+Gyr', 'Billing Dispute', 'Mardan Division-II'],
        ['02334881099234', 'Farhan Brothers Rice Mill', 'Muhammad Farhan', 'three_phase_whole', 'MTR-503921', '45812.9', 'SN-998241-K', 'Secure Metering', 'Sudden Surcharge High Reading', 'Peshawar Cantt Division']
      ];
      
      const ws = utils.aoa_to_sheet([...headers, ...sampleData]);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Inward Intake Queue');
      
      const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Equipment_Intake_Bulk_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMsg('Excel template generated and downloaded!');
      setTimeout(() => setSuccessMsg(''), 3050);
    } catch (err: any) {
      setErrorMsg(`Failed to export template: ${err.message || err}`);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert rows to array of arrays, defval of empty string triggers complete cell alignment
        const rows = utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
        
        if (rows.length === 0) {
          setErrorMsg('The uploaded spreadsheet seems to be empty.');
          return;
        }

        const firstRowHeader = rows[0] || [];
        const isFirstRowHeader = firstRowHeader.some(cell => 
          typeof cell === 'string' && (
            cell.toLowerCase().includes('account') || 
            cell.toLowerCase().includes('name') ||
            cell.toLowerCase().includes('type') ||
            cell.toLowerCase().includes('meter') ||
            cell.toLowerCase().includes('serial')
          )
        );

        // Filter out empty rows of all cells
        const dataRows = isFirstRowHeader ? rows.slice(1) : rows;
        const populatedDataRows = dataRows.filter((r: any[]) => r.some(cell => String(cell).trim() !== ''));

        if (populatedDataRows.length === 0) {
          setErrorMsg('No valid data lines found in the uploaded file.');
          return;
        }

        const formattedLines = populatedDataRows.map((row: any[]) => {
          return row.map(cell => {
            const str = cell === null || cell === undefined ? '' : String(cell).trim();
            // Wrap in double quotes if it has tricky characters
            if (str.includes(',') || str.includes('\t') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }).join(',');
        });
        
        const parsedRows = parseBulkInput(formattedLines.join('\n'));
        const validRows = parsedRows.filter(r => r.isValid);
        
        if (validRows.length === 0) {
          setErrorMsg('No valid rows found to import. Verify your fields format.');
          return;
        }

        const newReceiptsList: EquipmentReceipt[] = [];
        const associatedMetersList: Meter[] = [];
        const today = getPKTDateString();

        validRows.forEach((row, i) => {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const generatedNum = `REC-2026-B${randomSuffix}-${i}`;

          const newReceipt: EquipmentReceipt = {
            id: `r-gen-bulk-${Date.now()}-${i}`,
            receiptNumber: generatedNum,
            dateReceived: today,
            consumerAccount: row.consumerAccount,
            consumerName: row.consumerName,
            fatherName: row.fatherName,
            meterType: row.meterType,
            meterNumber: row.meterNumber,
            serialNumber: row.serialNumber,
            make: row.make,
            receivedFrom: row.receivedFrom,
            reasonForTesting: row.reasonForTesting,
            newOrUsed: 'Used',
            receivedBy: currentUser.name,
            remarks: row.readings ? `Readings: ${row.readings}` : undefined
          };

          const associatedMeter: Meter = {
            id: `m-gen-bulk-${Date.now()}-${i}`,
            meterNumber: row.meterNumber,
            serialNumber: row.serialNumber,
            manufacturer: row.make,
            accuracyClass: row.meterType === 'single_phase' ? 'Class 1.0' : 
                           row.meterType === 'three_phase_whole' ? 'Class 1.0' :
                           row.meterType === 'smart' ? 'Class 0.2S' : 'Class 0.5S',
            category: row.meterType,
            status: 'received',
            stockStatus: 'In Store',
            purchaseDate: today,
            remarks: `Bulk intake registered via receipt ${generatedNum}.`,
            consumerAccount: row.consumerAccount
          };

          newReceiptsList.push(newReceipt);
          associatedMetersList.push(associatedMeter);
        });

        if (onAddBulkReceipts) {
          onAddBulkReceipts(newReceiptsList, associatedMetersList);
          setSuccessMsg(`Spreadsheet "${file.name}" uploaded. ${validRows.length} equipment entries mapped directly to schema!`);
          setTimeout(() => setSuccessMsg(''), 4050);
        } else {
          setErrorMsg('Bulk receipt processing is unavailable.');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(`Failed to parse spreadsheet file: ${err.message || err}`);
      }
    };
    
    reader.readAsArrayBuffer(file);
    // Reset file input element target value
    e.target.value = '';
  };
  
  // Custom Area Input Fields Configuration State
  const [inputMode, setInputMode] = useState<'single' | 'segmented'>('single');
  
  // Form State
  const [consumerAccount, setConsumerAccount] = useState('');
  const [consumerName, setConsumerName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [meterType, setMeterType] = useState<MeterCategory>('single_phase');
  const [meterNumber, setMeterNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [make, setMake] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [reasonForTesting, setReasonForTesting] = useState('');
  const [newOrUsed, setNewOrUsed] = useState<'New' | 'Used'>('Used');
  const [remarks, setRemarks] = useState('');
  const [nameplatePhotoUrl, setNameplatePhotoUrl] = useState<string | undefined>();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [inwardStep, setInwardStep] = useState(1);

  // QR Scanner States & Handlers
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrScanMode, setQRScanMode] = useState<'search' | 'intake' | 'meterNumber' | 'serialNumber'>('search');
  const [qrNotification, setQrNotification] = useState('');

  const handleQRScanResult = (decodedText: string) => {
    setIsQRScannerOpen(false);
    
    // Check if it's a JSON configuration object
    let isJson = false;
    let parsedData: any = null;
    try {
      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        parsedData = JSON.parse(decodedText);
        isJson = true;
      }
    } catch (e) {
      // not a json string
    }

    if (qrScanMode === 'meterNumber') {
      const trimmed = decodedText.trim().toUpperCase();
      setMeterNumber(trimmed);
      setSuccessMsg(`Meter Number scanned: "${trimmed}"`);
      setTimeout(() => setSuccessMsg(""), 4050);
    } else if (qrScanMode === 'serialNumber') {
      const trimmed = decodedText.trim().toUpperCase();
      setSerialNumber(trimmed);
      setSuccessMsg(`Serial Number scanned: "${trimmed}"`);
      setTimeout(() => setSuccessMsg(""), 4050);
    } else if (qrScanMode === 'intake') {
      if (isJson && parsedData) {
        // Autofill full intake form fields if json keys exist
        if (parsedData.consumerAccount) setConsumerAccount(parsedData.consumerAccount);
        if (parsedData.consumerName) setConsumerName(parsedData.consumerName);
        if (parsedData.fatherName) setFatherName(parsedData.fatherName);
        if (parsedData.meterType) setMeterType(mapMeterCategory(parsedData.meterType));
        if (parsedData.meterNumber) setMeterNumber(parsedData.meterNumber);
        if (parsedData.serialNumber) setSerialNumber(parsedData.serialNumber);
        if (parsedData.make) setMake(parsedData.make);
        if (parsedData.receivedFrom) setReceivedFrom(parsedData.receivedFrom);
        if (parsedData.reasonForTesting) setReasonForTesting(parsedData.reasonForTesting);
        if (parsedData.newOrUsed) setNewOrUsed(parsedData.newOrUsed === 'New' ? 'New' : 'Used');
        if (parsedData.remarks) setRemarks(parsedData.remarks);
        
        setSuccessMsg("Scanned and parsed Equipment Specification Card! Intake form populated.");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        // Raw text decoded. Smartly check what field to populate
        const trimmed = decodedText.trim();
        const digitsOnly = trimmed.replace(/\D/g, '');
        
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15 && !isNaN(Number(digitsOnly))) {
          setConsumerAccount(trimmed);
          setSuccessMsg(`Auto-filled Account Number: "${trimmed}"`);
        } else if (trimmed.startsWith('MTR-') || trimmed.match(/^[A-Z0-9-]{6,15}$/i)) {
          setMeterNumber(trimmed.toUpperCase());
          setSuccessMsg(`Auto-filled Meter Number: "${trimmed}"`);
        } else {
          setSerialNumber(trimmed.toUpperCase());
          setSuccessMsg(`Auto-filled Serial Number: "${trimmed}"`);
        }
        setTimeout(() => setSuccessMsg(""), 4050);
      }
    } else {
      // Search / Lookup Mode
      if (isJson && parsedData) {
        // If they scanned an intake spec card in search mode, use the meter number or account number to look up!
        const searchVal = parsedData.meterNumber || parsedData.consumerAccount || parsedData.serialNumber || '';
        setSearchQuery(searchVal);
        setQrNotification(`Lookup matched scanned card: ${searchVal}`);
      } else {
        const trimmed = decodedText.trim();
        setSearchQuery(trimmed);
        setQrNotification(`Lookup matched scanned tag: ${trimmed}`);
      }
      setTimeout(() => setQrNotification(""), 5050);
    }
  };

  // Registry List Category Area Filters
  const [filterCompany, setFilterCompany] = useState<string>('26');
  const [filterCircle, setFilterCircle] = useState<string>('all');
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [filterSubdivision, setFilterSubdivision] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');

  // Parsed structure derived in real-time
  const parsedAccount = parseAccountNumber(consumerAccount);

  // Auto Generate Receipt Number
  const generateReceiptNumber = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `REC-2026-${randomSuffix}`;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    const digitsOnlyVal = consumerAccount.replace(/\D/g, '');
    if (!consumerAccount || digitsOnlyVal.length < 10) {
      setErrorMsg('Consumer Account Number is required and should contain 10-14 digits.');
      return;
    }
    if (!consumerName.trim()) {
      setErrorMsg('Consumer Name is required.');
      return;
    }
    if (!meterNumber.trim()) {
      setErrorMsg('Meter Number is required.');
      return;
    }
    if (!serialNumber.trim()) {
      setErrorMsg('Hardware Serial Number is required.');
      return;
    }
    if (!make.trim()) {
      setErrorMsg('Meter Make / Manufacturer is required.');
      return;
    }

    const generatedNum = generateReceiptNumber();
    const today = getPKTDateString();

    // Create the Receipt Record
    const newReceipt: EquipmentReceipt = {
      id: `r-gen-${Date.now()}`,
      receiptNumber: generatedNum,
      dateReceived: today,
      consumerAccount,
      consumerName,
      fatherName,
      meterType,
      meterNumber,
      serialNumber,
      make,
      receivedFrom: receivedFrom || 'Unspecified Division',
      reasonForTesting: reasonForTesting || 'Routine Calibration',
      newOrUsed,
      receivedBy: currentUser.name,
      remarks: remarks || undefined
    };

    // Auto-create a corresponding Meter entry in 'received' state
    const associatedMeter: Meter = {
      id: `m-gen-${Date.now()}`,
      meterNumber,
      serialNumber,
      manufacturer: make,
      accuracyClass: meterType === 'single_phase' ? 'Class 1.0' : 
                     meterType === 'three_phase_whole' ? 'Class 1.0' :
                     meterType === 'smart' ? 'Class 0.2S' : 'Class 0.5S',
      category: meterType,
      status: 'received',
      stockStatus: 'In Store',
      purchaseDate: today,
      remarks: `Intake registered via receipt ${generatedNum}.`,
      nameplatePhotoUrl
    };

    onAddReceipt(newReceipt, associatedMeter);
    setSuccessMsg(`Receipt ${generatedNum} registered successfully! Associated meter logged waiting for test.`);
    
    // Reset Form Fields
    setConsumerAccount('');
    setConsumerName('');
    setFatherName('');
    setMeterNumber('');
    setSerialNumber('');
    setMake('');
    setReceivedFrom('');
    setReasonForTesting('');
    setRemarks('');
    setNameplatePhotoUrl(undefined);

    // Slide down alert
    setTimeout(() => {
      setShowAddForm(false);
      setSuccessMsg('');
    }, 2500);
  };

  const filteredReceipts = receipts.filter(r => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      r.receiptNumber.toLowerCase().includes(query) ||
      r.consumerAccount.toLowerCase().includes(query) ||
      r.consumerName.toLowerCase().includes(query) ||
      r.meterNumber.toLowerCase().includes(query) ||
      r.serialNumber.toLowerCase().includes(query)
    );
    if (!matchesSearch) return false;

    // Extract area details for categorization
    const parsed = parseAccountNumber(r.consumerAccount);
    const absCompany = parsed.companyCode;
    const absCircle = parsed.circleCode;
    const absDivision = parsed.companyCode + parsed.circleCode + parsed.divisionCode;
    const absSubdivision = parsed.companyCode + parsed.circleCode + parsed.divisionCode + parsed.subdivisionCode;

    if (filterCompany !== 'all' && absCompany !== filterCompany) return false;
    if (filterCircle !== 'all' && absCircle !== filterCircle) return false;
    if (filterDivision !== 'all' && absDivision !== filterDivision) return false;
    if (filterSubdivision !== 'all' && absSubdivision !== filterSubdivision) return false;
    if (filterBatch !== 'all' && parsed.batchNumber !== filterBatch) return false;

    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* Header Profile Controls */}
      <div className="flex flex-col sm:flex-row items-col sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Equipment Receipt Register
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Record, print receipt and queue electricity meters and transformers entering laboratory custody.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded flex items-center gap-1 transition-all active:scale-95 shadow-xs shrink-0 self-start sm:self-center"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {showAddForm ? 'View Registry Table' : 'Log New Equipment'}
        </button>
      </div>

      {showAddForm ? (
        /* Dynamic Intake Entry Form */
        <div id="new-receipt-sub-form" className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="bg-slate-900 p-3 text-white flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-500/10 rounded text-emerald-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Formal Inward Intake Record Form</h3>
                <p className="text-[10px] text-slate-350">Creates legal laboratory chain of custody tags automatically.</p>
              </div>
            </div>

            {/* Form Mode Selector: Single vs Bulk */}
            <div className="flex bg-slate-850 p-0.5 rounded text-[10px] font-bold border border-slate-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => setFormMode('single')}
                className={`px-3 py-1 rounded transition-all select-none ${
                  formMode === 'single' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Single Intake Log
              </button>
              <button
                type="button"
                onClick={() => setFormMode('bulk')}
                className={`px-3 py-1 rounded transition-all flex items-center gap-1 select-none ${
                  formMode === 'bulk' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Bulk Import Paste
              </button>
            </div>
          </div>

          {formMode === 'single' ? (
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4">
            {errorMsg && (
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border-l-2 border-rose-500 text-rose-800 dark:text-rose-400 text-xs font-semibold rounded flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-emerald-500 text-emerald-800 dark:text-emerald-400 text-xs font-semibold rounded flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Fast-Track QR Scanner Prompt */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-850 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-1 select-none">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <QrCode className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">Fast-Track QR Intake Identification</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Scan printed meter barcode tags, utility receipts, or JSON equipment cards to skip manual indexing.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQRScanMode('intake');
                  setIsQRScannerOpen(true);
                }}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 text-center cursor-pointer min-h-[32px] shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan Intake Tag
              </button>
            </div>

            {/* PROGRESS WIZARD INDICATOR */}
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInwardStep(1)}
                className={`p-2 rounded-lg border text-left transition-all relative ${
                  inwardStep === 1 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">Step 1</span>
                  {consumerAccount.length >= 10 && consumerName.trim() !== '' && fatherName.trim() !== '' ? (
                    <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">✓</span>
                  ) : (
                    <span className="w-4 h-4 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450 rounded-full flex items-center justify-center text-[9px] font-bold">1</span>
                  )}
                </div>
                <span className="text-[11px] font-black block truncate mt-1 text-slate-700 dark:text-slate-200">Consumer Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setInwardStep(2)}
                className={`p-2 rounded-lg border text-left transition-all relative ${
                  inwardStep === 2 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">Step 2</span>
                  {meterNumber.trim() !== '' && serialNumber.trim() !== '' && make.trim() !== '' ? (
                    <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">✓</span>
                  ) : (
                    <span className="w-4 h-4 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450 rounded-full flex items-center justify-center text-[9px] font-bold">2</span>
                  )}
                </div>
                <span className="text-[11px] font-black block truncate mt-1 text-slate-700 dark:text-slate-200">Hardware specs</span>
              </button>

              <button
                type="button"
                onClick={() => setInwardStep(3)}
                className={`p-2 rounded-lg border text-left transition-all relative ${
                  inwardStep === 3 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">Step 3</span>
                  <span className="w-4 h-4 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450 rounded-full flex items-center justify-center text-[9px] font-bold">3</span>
                </div>
                <span className="text-[11px] font-black block truncate mt-1 text-slate-700 dark:text-slate-200">Classification</span>
              </button>
            </div>

            {/* STEP 1: CONSUMER LEDGER */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <button
                type="button"
                onClick={() => setInwardStep(inwardStep === 1 ? 0 : 1)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    inwardStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>I</span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight">Consumer Profile & Connection Ledger</h3>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Account lookup and primary billing info</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {consumerAccount.length >= 10 && consumerName.trim() !== '' && fatherName.trim() !== '' && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Complete</span>
                  )}
                  {inwardStep === 1 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              <div className={`${inwardStep === 1 ? 'p-4 sm:p-5' : 'hidden'} space-y-4 animate-in fade-in duration-200`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest block">I. Consumer & Connection Ledger</span>
                    {/* Mode Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setInputMode('single')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          inputMode === 'single' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        14-Digit Account Number
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputMode('segmented');
                          if (!consumerAccount || consumerAccount.length < 14) {
                            setConsumerAccount('01263110000000');
                          }
                        }}
                        className={`px-2 py-0.5 rounded transition-all ${
                          inputMode === 'segmented' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Segmented Area Fields
                      </button>
                    </div>
                  </div>

                  {inputMode === 'single' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Consumer Account Number *</label>
                      <input
                        type="text"
                        maxLength={30}
                        placeholder="e.g. 01263110083300"
                        value={consumerAccount}
                        onChange={(e) => setConsumerAccount(e.target.value)}
                        className="w-full text-xs font-mono p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-bold tracking-wider"
                      />
                      <p className="text-[9px] text-slate-450 mt-0.5 font-medium">Enter direct 14-digit area ledger index number.</p>
                    </div>
                  ) : (
                    <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-50 dark:bg-slate-850/50 p-3 rounded border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                      {/* Segmented Inputs */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Batch No *</label>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="01"
                          value={consumerAccount.substring(0, 2)}
                          onChange={(e) => {
                            const accParts = {
                              batch: consumerAccount.substring(0, 2) || '',
                              company: consumerAccount.substring(2, 4) || '',
                              circle: consumerAccount.substring(4, 5) || '',
                              division: consumerAccount.substring(5, 6) || '',
                              subdivision: consumerAccount.substring(6, 7) || '',
                              consumer: consumerAccount.substring(7, 14) || '',
                            };
                            const val = e.target.value.replace(/\D/g, '');
                            accParts.batch = val;
                            const joined = [
                              accParts.batch.padEnd(2, '0').substring(0, 2),
                              accParts.company.padEnd(2, '0').substring(0, 2),
                              accParts.circle.padEnd(1, '0').substring(0, 1),
                              accParts.division.padEnd(1, '0').substring(0, 1),
                              accParts.subdivision.padEnd(1, '0').substring(0, 1),
                              accParts.consumer.padEnd(7, '0').substring(0, 7)
                            ].join('');
                            setConsumerAccount(joined);
                          }}
                          className="w-full text-xs font-mono p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white text-center font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Company *</label>
                        <select
                          value={consumerAccount.substring(2, 4)}
                          onChange={(e) => {
                            const accParts = {
                              batch: consumerAccount.substring(0, 2) || '',
                              company: consumerAccount.substring(2, 4) || '',
                              circle: consumerAccount.substring(4, 5) || '',
                              division: consumerAccount.substring(5, 6) || '',
                              subdivision: consumerAccount.substring(6, 7) || '',
                              consumer: consumerAccount.substring(7, 14) || '',
                            };
                            accParts.company = e.target.value;
                            const joined = [
                              accParts.batch.padEnd(2, '0').substring(0, 2),
                              accParts.company.padEnd(2, '0').substring(0, 2),
                              accParts.circle.padEnd(1, '0').substring(0, 1),
                              accParts.division.padEnd(1, '0').substring(0, 1),
                              accParts.subdivision.padEnd(1, '0').substring(0, 1),
                              accParts.consumer.padEnd(7, '0').substring(0, 7)
                            ].join('');
                            setConsumerAccount(joined);
                          }}
                          className="w-full text-xs p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-semibold cursor-pointer"
                        >
                          <option value="26">PESCO</option>
                          <option value="11">LESCO</option>
                          <option value="22">FESCO</option>
                          <option value="14">IESCO</option>
                          <option value="15">MEPCO</option>
                          <option value="25">HESCO</option>
                          <option value="18">PESCO</option>
                          <option value="31">SEPCO</option>
                          <option value="24">QESCO</option>
                          <option value="35">TESCO</option>
                          <option value="09">PESCO</option>
                          <option value="02">Local</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Circle *</label>
                        <select
                          value={consumerAccount.substring(4, 5)}
                          onChange={(e) => {
                            const newCircleCode = e.target.value;
                            const activeCircle = PESCO_HIERARCHY.find(c => c.code.endsWith(newCircleCode));
                            let defaultDiv = '1';
                            let defaultSub = '1';
                            if (activeCircle && activeCircle.divisions.length > 0) {
                              const firstDiv = activeCircle.divisions[0];
                              defaultDiv = firstDiv.code.slice(-1) || '1';
                              if (firstDiv.subdivisions.length > 0) {
                                defaultSub = firstDiv.subdivisions[0].code.slice(-1) || '1';
                              }
                            }
                            const accParts = {
                              batch: consumerAccount.substring(0, 2) || '',
                              company: consumerAccount.substring(2, 4) || '',
                              circle: newCircleCode,
                              division: defaultDiv,
                              subdivision: defaultSub,
                              consumer: consumerAccount.substring(7, 14) || '',
                            };
                            const joined = [
                              accParts.batch.padEnd(2, '0').substring(0, 2),
                              accParts.company.padEnd(2, '0').substring(0, 2),
                              accParts.circle.padEnd(1, '0').substring(0, 1),
                              accParts.division.padEnd(1, '0').substring(0, 1),
                              accParts.subdivision.padEnd(1, '0').substring(0, 1),
                              accParts.consumer.padEnd(7, '0').substring(0, 7)
                            ].join('');
                            setConsumerAccount(joined);
                          }}
                          className="w-full text-xs p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-semibold cursor-pointer"
                        >
                          {PESCO_HIERARCHY.map(c => {
                            const val = c.code.substring(2) || '3';
                            return (
                              <option key={c.code} value={val}>
                                {c.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Division *</label>
                        <select
                          value={consumerAccount.substring(5, 6)}
                          onChange={(e) => {
                            const newDivCodeSuffix = e.target.value;
                            const activeCircle = PESCO_HIERARCHY.find(c => c.code.endsWith(consumerAccount.substring(4, 5)));
                            let defaultSub = '1';
                            if (activeCircle) {
                              const activeDiv = activeCircle.divisions.find(d => d.code.endsWith(newDivCodeSuffix));
                              if (activeDiv && activeDiv.subdivisions.length > 0) {
                                defaultSub = activeDiv.subdivisions[0].code.slice(-1) || '1';
                              }
                            }
                            const accParts = {
                              batch: consumerAccount.substring(0, 2) || '',
                              company: consumerAccount.substring(2, 4) || '',
                              circle: consumerAccount.substring(4, 5) || '',
                              division: newDivCodeSuffix,
                              subdivision: defaultSub,
                              consumer: consumerAccount.substring(7, 14) || '',
                            };
                            const joined = [
                              accParts.batch.padEnd(2, '0').substring(0, 2),
                              accParts.company.padEnd(2, '0').substring(0, 2),
                              accParts.circle.padEnd(1, '0').substring(0, 1),
                              accParts.division.padEnd(1, '0').substring(0, 1),
                              accParts.subdivision.padEnd(1, '0').substring(0, 1),
                              accParts.consumer.padEnd(7, '0').substring(0, 7)
                            ].join('');
                            setConsumerAccount(joined);
                          }}
                          className="w-full text-xs p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-semibold cursor-pointer"
                        >
                          {(() => {
                            const currentCircleSuffix = consumerAccount.substring(4, 5);
                            const activeCircle = PESCO_HIERARCHY.find(c => c.code.endsWith(currentCircleSuffix));
                            const divisionsList = activeCircle ? activeCircle.divisions : PESCO_HIERARCHY.flatMap(c => c.divisions);
                            const seen = new Set();
                            const filteredDivs = divisionsList.filter(d => {
                              const val = d.code.slice(-1) || '1';
                              if (seen.has(val)) return false;
                              seen.add(val);
                              return true;
                            });
                            if (filteredDivs.length === 0) {
                              return <option value="1">Division 1</option>;
                            }
                            return filteredDivs.map(d => {
                              const val = d.code.slice(-1) || '1';
                              return (
                                <option key={d.code} value={val}>
                                  {d.name}
                                </option>
                              );
                            });
                          })()}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Sub-Div *</label>
                        <select
                          value={consumerAccount.substring(6, 7)}
                          onChange={(e) => {
                            const accParts = {
                              batch: consumerAccount.substring(0, 2) || '',
                              company: consumerAccount.substring(2, 4) || '',
                              circle: consumerAccount.substring(4, 5) || '',
                              division: consumerAccount.substring(5, 6) || '',
                              subdivision: e.target.value,
                              consumer: consumerAccount.substring(7, 14) || '',
                            };
                            const joined = [
                              accParts.batch.padEnd(2, '0').substring(0, 2),
                              accParts.company.padEnd(2, '0').substring(0, 2),
                              accParts.circle.padEnd(1, '0').substring(0, 1),
                              accParts.division.padEnd(1, '0').substring(0, 1),
                              accParts.subdivision.padEnd(1, '0').substring(0, 1),
                              accParts.consumer.padEnd(7, '0').substring(0, 7)
                            ].join('');
                            setConsumerAccount(joined);
                          }}
                          className="w-full text-xs p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-semibold cursor-pointer"
                        >
                          {(() => {
                            const currentCircleSuffix = consumerAccount.substring(4, 5);
                            const currentDivisionSuffix = consumerAccount.substring(5, 6);
                            const activeCircle = PESCO_HIERARCHY.find(c => c.code.endsWith(currentCircleSuffix));
                            let subsList: any[] = [];
                            if (activeCircle) {
                              const activeDiv = activeCircle.divisions.find(d => d.code.endsWith(currentDivisionSuffix));
                              if (activeDiv) {
                                subsList = activeDiv.subdivisions;
                              } else {
                                subsList = activeCircle.divisions.flatMap(d => d.subdivisions);
                              }
                            } else {
                              subsList = PESCO_HIERARCHY.flatMap(c => c.divisions.flatMap(d => d.subdivisions));
                            }
                            const seen = new Set();
                            const filteredSubs = subsList.filter(s => {
                              const val = s.code.slice(-1) || '1';
                              if (seen.has(val)) return false;
                              seen.add(val);
                              return true;
                            });
                            if (filteredSubs.length === 0) {
                              return <option value="1">Sub-Div 1</option>;
                            }
                            return filteredSubs.map(s => {
                              const val = s.code.slice(-1) || '1';
                              return (
                                <option key={s.code} value={val}>
                                  {s.name}
                                </option>
                              );
                            });
                          })()}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Consumer No *</label>
                        <input
                          type="text"
                          maxLength={7}
                          placeholder="0083300"
                          value={consumerAccount.substring(7, 14)}
                          onChange={(e) => {
                            const accParts = {
                              batch: consumerAccount.substring(0, 2) || '',
                              company: consumerAccount.substring(2, 4) || '',
                              circle: consumerAccount.substring(4, 5) || '',
                              division: consumerAccount.substring(5, 6) || '',
                              subdivision: consumerAccount.substring(6, 7) || '',
                              consumer: consumerAccount.substring(7, 14) || '',
                            };
                            accParts.consumer = e.target.value.replace(/\D/g, '');
                            const joined = [
                              accParts.batch.padEnd(2, '0').substring(0, 2),
                              accParts.company.padEnd(2, '0').substring(0, 2),
                              accParts.circle.padEnd(1, '0').substring(0, 1),
                              accParts.division.padEnd(1, '0').substring(0, 1),
                              accParts.subdivision.padEnd(1, '0').substring(0, 1),
                              accParts.consumer.padEnd(7, '0').substring(0, 7)
                            ].join('');
                            setConsumerAccount(joined);
                          }}
                          className="w-full text-xs font-mono p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white text-center font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Real-time Decomposed Category breakdown display */}
                  {consumerAccount.length > 0 && (
                    <div className="md:col-span-3 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded text-[10.5px] space-y-1.5 animate-in slide-in-from-top-1 duration-150 select-none">
                      <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Real-time Category Breakdown of Account No: <span className="font-mono text-slate-800 dark:text-white font-extrabold">{consumerAccount.padEnd(14, '·')}</span></span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-slate-600 dark:text-slate-300">
                        <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Batch Number</span>
                          <span className="font-mono font-black text-slate-800 dark:text-white">{parsedAccount.batchNumber || '—'}</span>
                        </div>
                        <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Company</span>
                          <span className="font-sans font-extrabold text-blue-600 dark:text-blue-400 truncate block" title={parsedAccount.companyName}>
                            {parsedAccount.companyCode ? `${parsedAccount.companyCode} (${parsedAccount.companyName.split(' ')[0]})` : '—'}
                          </span>
                        </div>
                        <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Circle Code</span>
                          <span className="font-sans font-extrabold text-slate-800 dark:text-white block truncate" title={parsedAccount.circleCode ? getCircleName(parsedAccount.circleCode) : ''}>
                            {parsedAccount.circleCode ? `${parsedAccount.circleCode} (${getCircleName(parsedAccount.circleCode)})` : '—'}
                          </span>
                        </div>
                        <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Division Code</span>
                          <span className="font-sans font-extrabold text-slate-800 dark:text-white block truncate" title={parsedAccount.divisionCode ? getDivisionName(parsedAccount.divisionCode, parsedAccount.circleCode) : ''}>
                            {parsedAccount.divisionCode ? getDivisionName(parsedAccount.divisionCode, parsedAccount.circleCode) : '—'}
                          </span>
                        </div>
                        <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Sub-Division</span>
                          <span className="font-sans font-extrabold text-slate-800 dark:text-white block truncate" title={parsedAccount.subdivisionCode ? getSubdivisionName(parsedAccount.subdivisionCode, parsedAccount.divisionCode, parsedAccount.circleCode) : ''}>
                            {parsedAccount.subdivisionCode ? getSubdivisionName(parsedAccount.subdivisionCode, parsedAccount.divisionCode, parsedAccount.circleCode) : '—'}
                          </span>
                        </div>
                        <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Consumer Code</span>
                          <span className="font-mono font-black text-slate-800 dark:text-white">{parsedAccount.consumerCode || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Consumer Primary Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Blue Ridge Textiles Ltd"
                        value={consumerName}
                        onChange={(e) => setConsumerName(e.target.value)}
                        className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Father / Guardian Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Haji Waris Khan / Official Utility Custody"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (consumerAccount.replace(/\D/g, '').length < 10 || consumerName.trim() === '' || fatherName.trim() === '') {
                        setErrorMsg('Please fill in Consumer Account Number (10+ digits), Name, and Father Name before continuing.');
                        return;
                      }
                      setErrorMsg('');
                      setInwardStep(2);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-sm select-none cursor-pointer"
                  >
                    Continue to Hardware Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 2: HARDWARE SPECIFICATIONS */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <button
                type="button"
                onClick={() => setInwardStep(inwardStep === 2 ? 0 : 2)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    inwardStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>II</span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight">Hardware Specifications & Make</h3>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Meter type, identification labels, and manufacturer info</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {meterNumber.trim() !== '' && serialNumber.trim() !== '' && make.trim() !== '' && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Complete</span>
                  )}
                  {inwardStep === 2 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              <div className={`${inwardStep === 2 ? 'p-4 sm:p-5' : 'hidden'} space-y-4 animate-in fade-in duration-200`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Meter Target Type *</label>
                    <select
                      value={meterType}
                      onChange={(e) => setMeterType(e.target.value as MeterCategory)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold dark:text-white cursor-pointer"
                    >
                      <option value="single_phase">Single Phase Meter</option>
                      <option value="three_phase_whole">Three Phase Whole Current</option>
                      <option value="three_phase_ct">Three Phase CT Operated</option>
                      <option value="three_phase_ct_pt">Three Phase CT/PT Operated</option>
                      <option value="smart">Smart Cellular Meter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
                      Meter ID / Number *
                      <button
                        type="button"
                        onClick={() => {
                          setQRScanMode('meterNumber');
                          setIsQRScannerOpen(true);
                        }}
                        className="flex items-center gap-1 text-[9px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-extrabold uppercase"
                      >
                        <Camera className="w-3 h-3" />
                        Scan Label
                      </button>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MTR-982103"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-extrabold text-blue-600 dark:text-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center justify-between">
                      Warp / Serial Code: *
                      <button
                        type="button"
                        onClick={() => {
                          setQRScanMode('serialNumber');
                          setIsQRScannerOpen(true);
                        }}
                        className="flex items-center gap-1 text-[9px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-extrabold uppercase"
                      >
                        <Camera className="w-3 h-3" />
                        Scan Label
                      </button>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SN-772183-A"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Manufacturer Make *</label>
                    <input
                      type="text"
                      placeholder="e.g. Landis+Gyr"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Testing Reason *</label>
                    <input
                      type="text"
                      placeholder="e.g. Billing Dispute"
                      value={reasonForTesting}
                      onChange={(e) => setReasonForTesting(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Origin Division Received From</label>
                    <input
                      type="text"
                      placeholder="e.g. Sub-Division-IV"
                      value={receivedFrom}
                      onChange={(e) => setReceivedFrom(e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInwardStep(1)}
                    className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (meterNumber.trim() === '' || serialNumber.trim() === '' || make.trim() === '') {
                        setErrorMsg('Please fill in Meter ID, Serial Code, and Make before continuing.');
                        return;
                      }
                      setErrorMsg('');
                      setInwardStep(3);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-sm select-none cursor-pointer"
                  >
                    Continue to Classification
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 3: CLASSIFICATION & REMARKS */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <button
                type="button"
                onClick={() => setInwardStep(inwardStep === 3 ? 0 : 3)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    inwardStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>III</span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight">Classification & Authority Sealing</h3>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">Visual conditions, photos, and final observations</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {inwardStep === 3 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              <div className={`${inwardStep === 3 ? 'p-4 sm:p-5' : 'hidden'} space-y-4 animate-in fade-in duration-200`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Condition Class</label>
                    <div className="flex gap-4 mt-1.5">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="newOrUsed"
                          checked={newOrUsed === 'New'}
                          onChange={() => setNewOrUsed('New')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        New Meter
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="newOrUsed"
                          checked={newOrUsed === 'Used'}
                          onChange={() => setNewOrUsed('Used')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Previously Deployed
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Authorized Receiver Staff</label>
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-500 dark:text-slate-400 font-semibold select-none">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {currentUser.name}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <PhotoCapture 
                      label="Nameplate Image Capture (Optional)"
                      photoUrl={nameplatePhotoUrl}
                      onChange={setNameplatePhotoUrl}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Inward Remarks / Observed Deficiencies</label>
                    <textarea
                      placeholder="e.g. Cover screws slightly rusty, glass has minor scratches."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInwardStep(2)}
                    className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-md select-none cursor-pointer"
                  >
                    File Formal Receipt & Queue
                  </button>
                </div>
              </div>
            </div>
          </form>
          ) : (() => {
            // Define handleBulkSubmit here safely inside component closure
            const handleBulkSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              setErrorMsg('');
              setSuccessMsg('');

              if (!bulkText.trim()) {
                setErrorMsg('Please paste some text/entries first.');
                return;
              }

              const parsedRows = parseBulkInput(bulkText);
              const validRows = parsedRows.filter(r => r.isValid);
              if (validRows.length === 0) {
                setErrorMsg('No valid rows found to import. Verify your fields format.');
                return;
              }

              const newReceiptsList: EquipmentReceipt[] = [];
              const associatedMetersList: Meter[] = [];
              const today = getPKTDateString();

              validRows.forEach((row, i) => {
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const generatedNum = `REC-2026-B${randomSuffix}-${i}`;

                const newReceipt: EquipmentReceipt = {
                  id: `r-gen-bulk-${Date.now()}-${i}`,
                  receiptNumber: generatedNum,
                  dateReceived: today,
                  consumerAccount: row.consumerAccount,
                  consumerName: row.consumerName,
                  fatherName: row.fatherName,
                  meterType: row.meterType,
                  meterNumber: row.meterNumber,
                  serialNumber: row.serialNumber,
                  make: row.make,
                  receivedFrom: row.receivedFrom,
                  reasonForTesting: row.reasonForTesting,
                  newOrUsed: 'Used',
                  receivedBy: currentUser.name,
                  remarks: row.readings ? `Readings: ${row.readings}` : undefined
                };

                const associatedMeter: Meter = {
                  id: `m-gen-bulk-${Date.now()}-${i}`,
                  meterNumber: row.meterNumber,
                  serialNumber: row.serialNumber,
                  manufacturer: row.make,
                  accuracyClass: row.meterType === 'single_phase' ? 'Class 1.0' : 
                                 row.meterType === 'three_phase_whole' ? 'Class 1.0' :
                                 row.meterType === 'smart' ? 'Class 0.2S' : 'Class 0.5S',
                  category: row.meterType,
                  status: 'received',
                  stockStatus: 'In Store',
                  purchaseDate: today,
                  remarks: `Bulk intake registered via receipt ${generatedNum}.`
                };

                newReceiptsList.push(newReceipt);
                associatedMetersList.push(associatedMeter);
              });

              if (onAddBulkReceipts) {
                onAddBulkReceipts(newReceiptsList, associatedMetersList);
              } else {
                newReceiptsList.forEach((rect, idx) => {
                  onAddReceipt(rect, associatedMetersList[idx]);
                });
              }

              setSuccessMsg(`Bulk Import completely successful! ${validRows.length} inward records parsed, receipts registered, and hardware queued.`);
              setBulkText('');

              setTimeout(() => {
                setShowAddForm(false);
                setSuccessMsg('');
              }, 2800);
            };

            return (
              <div className="p-4 sm:p-5 space-y-4">
                {errorMsg && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border-l-2 border-rose-500 text-rose-800 dark:text-rose-400 text-xs font-semibold rounded flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-emerald-500 text-emerald-800 dark:text-emerald-400 text-xs font-semibold rounded flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    {successMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Excel File Drop Area */}
                  <div className="md:col-span-2 border-2 border-dashed border-indigo-200 dark:border-indigo-900/40 hover:border-indigo-500 dark:hover:border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/5 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 group transition-all relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 rounded-full text-indigo-650 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-400 block uppercase tracking-wider">
                        Upload Excel Sheet or CSV File
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">
                        Drop a spreadsheet (.xlsx, .xls, .csv) here or click to browse
                      </span>
                    </div>
                    <span className="inline-block px-3 py-1 bg-white dark:bg-slate-850 border border-indigo-100 dark:border-slate-705 rounded text-[9px] font-black text-indigo-700 uppercase tracking-widest pointer-events-none group-hover:bg-indigo-600 group-hover:text-white transition-colors mt-1 shadow-xs">
                      Choose Sheet File
                    </span>
                  </div>

                  {/* Template Downloader */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-extrabold text-indigo-950 dark:text-indigo-455 text-xs uppercase tracking-wide">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        <span>Receipt Columns Sequence</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed font-bold">
                        Requires columns: Account No, Consumer Name, Father Name, Meter Type, Meter No, Readings, Warp / Serial Code, Make, Reason, Origin Division.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="w-full mt-3 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer font-bold select-none"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download Template (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Manual Text Override */}
                <details className="group border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                  <summary className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 font-extrabold text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none list-none">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Raw Data CSV Buffer / Manual Direct Paste override</span>
                    </div>
                    <span className="text-[10px] text-indigo-650 font-bold group-open:hidden">▶ Show</span>
                    <span className="text-[10px] text-indigo-650 font-bold hidden group-open:inline">▼ Hide</span>
                  </summary>
                  <div className="p-3 bg-slate-50/30 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Uploading an Excel file fills this buffer automatically. You can also paste manually or edit entries directly below:
                    </p>
                    <textarea
                      rows={5}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="Consumer Account Number,Consumer Primary Name,Father / Guardian Name,Meter Type,Meter ID / Number,Readings,Serial Number,Make,Testing Reason,Origin Division"
                      className="w-full font-mono text-xs p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none dark:text-white"
                    />
                  </div>
                </details>

                {bulkText.trim().length > 0 && (() => {
                  const parsed = parseBulkInput(bulkText);
                  const validRows = parsed.filter(r => r.isValid);
                  const invalidRows = parsed.filter(r => !r.isValid);

                  return (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-100 dark:bg-slate-850 p-2 rounded border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Live Import Validation Preview
                        </span>
                        <div className="flex gap-2 text-[9.5px] font-bold">
                          <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded">
                            {validRows.length} Valid
                          </span>
                          {invalidRows.length > 0 && (
                            <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 px-2 py-0.5 rounded">
                              {invalidRows.length} Faulty
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="max-h-[220px] overflow-y-auto overflow-x-auto border border-slate-205 dark:border-slate-800/80 rounded">
                        <table className="w-full text-[10.5px] text-left border-collapse bg-white dark:bg-slate-905 min-w-[700px]">
                          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-550 font-black uppercase text-[8.5px] border-b border-slate-100 dark:border-slate-800 select-none">
                            <tr>
                              <th className="p-2 border-r border-slate-100 dark:border-slate-800">L#</th>
                              <th className="p-2 border-r border-slate-100 dark:border-slate-800">Account No</th>
                              <th className="p-2 border-r border-slate-100 dark:border-slate-800">Consumer Name</th>
                              <th className="p-2 border-r border-slate-100 dark:border-slate-800">Meter / Serial</th>
                              <th className="p-2 border-r border-slate-100 dark:border-slate-800">Type</th>
                              <th className="p-2 border-r border-slate-100 dark:border-slate-800">Readings / Make</th>
                              <th className="p-2 border-r border-slate-100 dark:border-slate-800">Reason / Division</th>
                              <th className="p-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                            {parsed.map((row, i) => (
                              <tr key={i} className={`hover:bg-slate-500/5 ${row.isValid ? '' : 'bg-rose-50/50 dark:bg-rose-950/5'}`}>
                                <td className="p-2 text-center font-mono text-[9px] text-slate-400">{row.index}</td>
                                <td className="p-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {row.consumerAccount ? row.consumerAccount : <span className="text-rose-400">Missing</span>}
                                </td>
                                <td className="p-2 truncate max-w-[120px] font-sans" title={`Consumer: ${row.consumerName} | Father: ${row.fatherName}`}>
                                  <div className="font-bold">{row.consumerName || <span className="text-rose-400">Missing Name</span>}</div>
                                  <div className="text-[9.5px] text-slate-400 font-medium leading-tight block">F/G: {row.fatherName || <span className="text-rose-400">Missing</span>}</div>
                                </td>
                                <td className="p-2 font-mono">
                                  <div className="font-extrabold text-blue-600 dark:text-blue-400">{row.meterNumber || '—'}</div>
                                  <div className="text-[9.5px] text-slate-400">{row.serialNumber || '—'}</div>
                                </td>
                                <td className="p-2 font-sans text-center">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] uppercase font-black tracking-wider ${
                                    row.meterType === 'single_phase' 
                                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30' 
                                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                                  }`}>
                                    {row.meterType === 'single_phase' ? '1-Phase' : '3-Phase'}
                                  </span>
                                </td>
                                <td className="p-2 font-mono text-[9px]">
                                  <div className="font-black text-slate-800 dark:text-slate-200">{row.readings || '—'}</div>
                                  <div className="text-slate-400 block truncate max-w-[80px]" title={row.make}>{row.make || '—'}</div>
                                </td>
                                <td className="p-2 font-medium">
                                  <div className="truncate max-w-[90px]" title={row.reasonForTesting}>{row.reasonForTesting || '—'}</div>
                                  <div className="text-[9.5px] text-slate-400 font-sans truncate max-w-[85px] block">{row.receivedFrom || '—'}</div>
                                </td>
                                <td className="p-2 text-center">
                                  {row.isValid ? (
                                    <span className="text-emerald-600 font-extrabold flex items-center justify-center gap-0.5 select-none animate-pulse">
                                      ✓ OK
                                    </span>
                                  ) : (
                                    <span className="text-rose-500 font-bold text-[9px] leading-tight block select-none" title={row.errors.join(', ')}>
                                      ⚠ {row.errors[0]}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Bulk Commit Controls Row */}
                      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setBulkText('');
                            setErrorMsg('');
                          }}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 rounded text-slate-500 dark:text-slate-400 font-extrabold text-xs transition-colors"
                        >
                          Clear Text
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkSubmit}
                          disabled={validRows.length === 0}
                          className={`px-4 py-1.5 font-extrabold text-xs tracking-wider uppercase rounded transition-all shadow-sm ${
                            validRows.length > 0 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Register {validRows.length} Valid Intake Records
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      ) : (
        /* Registry Log View */
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Controls bar with Structured Area Segment Filters */}
          <div className="p-3 bg-slate-55/40 dark:bg-slate-850/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
            {qrNotification && (
              <div className="p-2 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-l-2 border-blue-500 text-[10.5px] font-bold rounded-md flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                <QrCode className="w-4 h-4 text-blue-500 shrink-0 animate-pulse" />
                <span>{qrNotification}</span>
              </div>
            )}
            
            {pendingPushReceipts.length > 0 && (
              <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/5 text-blue-800 dark:text-blue-400 border border-blue-500/20 text-[11px] font-bold rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-500 shrink-0 animate-bounce" />
                  <div>
                    <span>Found {pendingPushReceipts.length} inward record{pendingPushReceipts.length > 1 ? 's' : ''} not present in the Hardware Inventory Vault.</span>
                    <p className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Pushing maps records to central stores, enabling testing workflows.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onPushBulkMetersToInventory) {
                      const listToPush = pendingPushReceipts.map(getMeterFromReceipt);
                      onPushBulkMetersToInventory(listToPush);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 text-[10.5px] cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Push All to Vault ({pendingPushReceipts.length})</span>
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Account / Meter / Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-12 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 dark:text-slate-400 text-xs px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded select-none cursor-pointer"
                  >
                    ×
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setQRScanMode('search');
                    setIsQRScannerOpen(true);
                  }}
                  title="Scan QR/Barcode Tag to lookup"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[11px] font-bold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Showing <span className="text-blue-600 dark:text-blue-400 font-mono font-black">{filteredReceipts.length}</span> Intake Records</span>
              </div>
            </div>

            {/* Area categorization filtering grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Company</label>
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="26">PESCO</option>
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Circle</label>
                <select
                  value={filterCircle}
                  onChange={(e) => {
                    setFilterCircle(e.target.value);
                    setFilterDivision('all');
                    setFilterSubdivision('all');
                  }}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="all">All Circles</option>
                  {PESCO_HIERARCHY.map(c => (
                    <option key={c.code} value={c.code.substring(2)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Division</label>
                <select
                  value={filterDivision}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterDivision(val);
                    if (val !== 'all') {
                      setFilterCircle(val.substring(2, 3));
                    }
                    setFilterSubdivision('all');
                  }}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="all">All Divisions</option>
                  {(() => {
                    const seen = new Set();
                    const list = filterCircle === 'all'
                      ? PESCO_HIERARCHY.flatMap(c => c.divisions)
                      : PESCO_HIERARCHY.filter(c => c.code.endsWith(filterCircle)).flatMap(c => c.divisions);
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

              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Sub-Division</label>
                <select
                  value={filterSubdivision}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterSubdivision(val);
                    if (val !== 'all') {
                      setFilterDivision(val.substring(0, 4));
                      setFilterCircle(val.substring(2, 3));
                    }
                  }}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="all">All Sub-Divisions</option>
                  {(() => {
                    const seen = new Set();
                    let list = [];
                    if (filterDivision !== 'all') {
                      list = PESCO_HIERARCHY.flatMap(c => c.divisions)
                        .filter(d => d.code === filterDivision)
                        .flatMap(d => d.subdivisions);
                    } else if (filterCircle !== 'all') {
                      list = PESCO_HIERARCHY.filter(c => c.code.endsWith(filterCircle))
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

              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Batch</label>
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="all">All Batches</option>
                  {['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','24','26','27','30','31','41','42','43'].map(b => (
                    <option key={b} value={b}>
                      Batch {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters helper button */}
            {(filterCompany !== '26' || filterCircle !== 'all' || filterDivision !== 'all' || filterSubdivision !== 'all' || filterBatch !== 'all') && (
              <div className="flex justify-end pt-0.5">
                <button
                  onClick={() => {
                    setFilterCompany('26');
                    setFilterCircle('all');
                    setFilterDivision('all');
                    setFilterSubdivision('all');
                    setFilterBatch('all');
                  }}
                  className="text-[9.5px] font-bold text-rose-600 hover:text-rose-700 hover:underline dark:text-rose-400 transition-all cursor-pointer"
                >
                  Reset Active Area Filters [×]
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 text-[9px] uppercase tracking-wider">
                  <th className="p-2 sm:p-2.5">Receipt Num</th>
                  <th className="p-2 sm:p-2.5">Date Received</th>
                  <th className="p-2 sm:p-2.5">Consumer Details</th>
                  <th className="p-2 sm:p-2.5">Meter Target Spec</th>
                  <th className="p-2 sm:p-2.5">Serial Number</th>
                  <th className="p-2 sm:p-2.5">Classification</th>
                  <th className="p-2 sm:p-2.5">Receiving Officer</th>
                  <th className="p-2 sm:p-2.5">Vault Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-300">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 dark:text-slate-500">
                      <HelpCircle className="w-6 h-6 text-slate-350 mx-auto mb-1.5" />
                      <p className="font-bold text-slate-700 dark:text-slate-350">No Matching Intake Receipts</p>
                      <p className="text-[10px] mt-0.5">Try resetting search filters or register a new incoming meter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(r => {
                    const parsed = parseAccountNumber(r.consumerAccount);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="p-2 sm:p-2.5 font-bold text-slate-900 dark:text-white font-mono">{r.receiptNumber}</td>
                        <td className="p-2 sm:p-2.5 font-mono text-slate-450 dark:text-slate-500">{r.dateReceived}</td>
                        <td className="p-2 sm:p-2.5">
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{r.consumerName}</p>
                          <div className="mt-1 space-y-1">
                            <span className="text-[10px] text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded inline-block font-bold">
                              CC: {r.consumerAccount}
                            </span>
                            {parsed.isValid && (
                              <div className="flex flex-wrap gap-1 text-[8.5px] font-black uppercase tracking-tight select-none">
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1 rounded truncate max-w-[125px]" title={parsed.companyName}>
                                  {parsed.companyName}
                                </span>
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1 rounded">
                                  {getCircleName(parsed.circleCode)} Circle
                                </span>
                                <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1 rounded">
                                  {getDivisionName(parsed.divisionCode, parsed.circleCode)}
                                </span>
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450 px-1 rounded">
                                  {getSubdivisionName(parsed.subdivisionCode, parsed.divisionCode, parsed.circleCode)}
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-1 rounded">
                                  Bch {parsed.batchNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 sm:p-2.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{r.meterNumber}</span>
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold capitalize">
                            {r.meterType.replace('_', ' ')}
                          </p>
                        </td>
                        <td className="p-2 sm:p-2.5 font-mono text-slate-600 dark:text-slate-400">{r.serialNumber}</td>
                        <td className="p-2 sm:p-2.5">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            r.newOrUsed === 'New' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30'
                          }`}>
                            {r.newOrUsed}
                          </span>
                        </td>
                        <td className="p-2 sm:p-2.5">
                          <p className="font-medium text-slate-800 dark:text-slate-250 leading-tight">{r.receivedBy}</p>
                          <p className="text-[10.5px] text-slate-450 dark:text-slate-500">Officer desk</p>
                        </td>
                        <td className="p-2 sm:p-2.5">
                          {(() => {
                            const isSynced = meters.some(m => m.meterNumber === r.meterNumber || m.serialNumber === r.serialNumber);
                            if (isSynced) {
                              return (
                                <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/20 w-fit">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>In Vault</span>
                                </div>
                              );
                            }
                            return (
                              <button
                                onClick={() => {
                                  if (onPushMeterToInventory) {
                                    onPushMeterToInventory(getMeterFromReceipt(r));
                                  }
                                }}
                                className="flex items-center gap-1.5 text-[9.5px] font-bold text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white bg-blue-500/10 hover:bg-blue-600 dark:bg-blue-500/5 dark:hover:bg-blue-500 px-2.5 py-1 rounded border border-blue-500/25 hover:border-transparent transition-all cursor-pointer w-fit"
                                title="Push this inward entry directly to the Hardware Inventory Vault"
                              >
                                <Boxes className="w-3 h-3" />
                                <span>Push to Vault</span>
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Universal Laboratory QR Decoder Overlay */}
      <QRScannerModal 
        isOpen={isQRScannerOpen} 
        onClose={() => setIsQRScannerOpen(false)} 
        onScan={handleQRScanResult}
        title={qrScanMode === 'intake' ? 'Equipment Inward Intake QR Scanner' : 'Register Search & Identifications Scanner'}
      />
    </div>
  );
}
