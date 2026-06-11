/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  SlidersHorizontal
} from 'lucide-react';
import { EquipmentReceipt, MeterCategory, Meter } from '../types';
import { parseAccountNumber } from '../utils';

interface RegisterViewProps {
  receipts: EquipmentReceipt[];
  onAddReceipt: (newReceipt: EquipmentReceipt, associatedMeter: Meter) => void;
  currentUser: any;
}

export default function RegisterView({ receipts, onAddReceipt, currentUser }: RegisterViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Area Input Fields Configuration State
  const [inputMode, setInputMode] = useState<'single' | 'segmented'>('single');
  
  // Form State
  const [consumerAccount, setConsumerAccount] = useState('');
  const [consumerName, setConsumerName] = useState('');
  const [meterType, setMeterType] = useState<MeterCategory>('single_phase');
  const [meterNumber, setMeterNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [make, setMake] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [reasonForTesting, setReasonForTesting] = useState('');
  const [newOrUsed, setNewOrUsed] = useState<'New' | 'Used'>('Used');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Registry List Category Area Filters
  const [filterCompany, setFilterCompany] = useState<string>('all');
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
    if (!consumerAccount || consumerAccount.length < 10) {
      setErrorMsg('Consumer Account Number is required and should be valid (10-14 digits).');
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
    const today = new Date().toISOString().split('T')[0];

    // Create the Receipt Record
    const newReceipt: EquipmentReceipt = {
      id: `r-gen-${Date.now()}`,
      receiptNumber: generatedNum,
      dateReceived: today,
      consumerAccount,
      consumerName,
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
      remarks: `Intake registered via receipt ${generatedNum}.`
    };

    onAddReceipt(newReceipt, associatedMeter);
    setSuccessMsg(`Receipt ${generatedNum} registered successfully! Associated meter logged waiting for test.`);
    
    // Reset Form Fields
    setConsumerAccount('');
    setConsumerName('');
    setMeterNumber('');
    setSerialNumber('');
    setMake('');
    setReceivedFrom('');
    setReasonForTesting('');
    setRemarks('');

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
    if (filterCompany !== 'all' && parsed.companyCode !== filterCompany) return false;
    if (filterCircle !== 'all' && parsed.circleCode !== filterCircle) return false;
    if (filterDivision !== 'all' && parsed.divisionCode !== filterDivision) return false;
    if (filterSubdivision !== 'all' && parsed.subdivisionCode !== filterSubdivision) return false;
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
          <div className="bg-slate-900 p-3 text-white flex items-center gap-2">
            <div className="p-1 bg-blue-500/10 rounded text-emerald-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Formal Inward Intake Record Form</h3>
              <p className="text-[10px] text-slate-350">Creates legal laboratory chain of custody tags automatically.</p>
            </div>
          </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Consumer Info Section */}
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
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Consumer Account Number (14 Digits) *</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="e.g. 01263110083300"
                    value={consumerAccount}
                    onChange={(e) => setConsumerAccount(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-mono p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white font-bold tracking-wider"
                    required
                  />
                  <p className="text-[9px] text-slate-450 mt-0.5 font-medium">Enter direct 14-digit area ledger index number.</p>
                </div>
              ) : (
                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-50 dark:bg-slate-850/50 p-3 rounded border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                  {/* Segmented Inputs */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Batch No (2d) *</label>
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Company (2d) *</label>
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
                      <option value="26">GEPCO (26)</option>
                      <option value="11">LESCO (11)</option>
                      <option value="22">FESCO (22)</option>
                      <option value="14">IESCO (14)</option>
                      <option value="15">MEPCO (15)</option>
                      <option value="25">HESCO (25)</option>
                      <option value="18">PESCO (18)</option>
                      <option value="31">SEPCO (31)</option>
                      <option value="24">QESCO (24)</option>
                      <option value="35">TESCO (35)</option>
                      <option value="09">PESCO (09)</option>
                      <option value="02">Local (02)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Circle (1d) *</label>
                    <select
                      value={consumerAccount.substring(4, 5)}
                      onChange={(e) => {
                        const accParts = {
                          batch: consumerAccount.substring(0, 2) || '',
                          company: consumerAccount.substring(2, 4) || '',
                          circle: consumerAccount.substring(4, 5) || '',
                          division: consumerAccount.substring(5, 6) || '',
                          subdivision: consumerAccount.substring(6, 7) || '',
                          consumer: consumerAccount.substring(7, 14) || '',
                        };
                        accParts.circle = e.target.value;
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
                      <option value="3">3</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="0">0</option>
                      <option value="4">4</option>
                      <option value="9">9</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Division (1d) *</label>
                    <input
                      type="text"
                      maxLength={1}
                      placeholder="1"
                      value={consumerAccount.substring(5, 6)}
                      onChange={(e) => {
                        const accParts = {
                          batch: consumerAccount.substring(0, 2) || '',
                          company: consumerAccount.substring(2, 4) || '',
                          circle: consumerAccount.substring(4, 5) || '',
                          division: consumerAccount.substring(5, 6) || '',
                          subdivision: consumerAccount.substring(6, 7) || '',
                          consumer: consumerAccount.substring(7, 14) || '',
                        };
                        accParts.division = e.target.value.replace(/\D/g, '');
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Sub-Div (1d) *</label>
                    <input
                      type="text"
                      maxLength={1}
                      placeholder="1"
                      value={consumerAccount.substring(6, 7)}
                      onChange={(e) => {
                        const accParts = {
                          batch: consumerAccount.substring(0, 2) || '',
                          company: consumerAccount.substring(2, 4) || '',
                          circle: consumerAccount.substring(4, 5) || '',
                          division: consumerAccount.substring(5, 6) || '',
                          subdivision: consumerAccount.substring(6, 7) || '',
                          consumer: consumerAccount.substring(7, 14) || '',
                        };
                        accParts.subdivision = e.target.value.replace(/\D/g, '');
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 mb-0.5 uppercase">Consumer No (7d)*</label>
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
                      required
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
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Company (26000)</span>
                      <span className="font-sans font-extrabold text-blue-600 dark:text-blue-400 truncate block" title={parsedAccount.companyName}>
                        {parsedAccount.companyCode ? `${parsedAccount.companyCode} (${parsedAccount.companyName.split(' ')[0]})` : '—'}
                      </span>
                    </div>
                    <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Circle Code</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">
                        {parsedAccount.circleCode ? `Circle ${parsedAccount.circleCode}` : '—'}
                      </span>
                    </div>
                    <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Division Code</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">
                        {parsedAccount.divisionCode ? `Div ${parsedAccount.divisionCode}` : '—'}
                      </span>
                    </div>
                    <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Sub-Division</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">
                        {parsedAccount.subdivisionCode ? `Sub-Div ${parsedAccount.subdivisionCode}` : '—'}
                      </span>
                    </div>
                    <div className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Consumer Code</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">{parsedAccount.consumerCode || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Consumer Primary Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Ridge Textiles Ltd"
                  value={consumerName}
                  onChange={(e) => setConsumerName(e.target.value)}
                  className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold dark:text-white"
                  required
                />
              </div>

              {/* Hardware Specifications */}
              <div className="md:col-span-3 pt-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest block">II. Hardware Specifications & Make</span>
              </div>

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
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Meter ID / Number *</label>
                <input
                  type="text"
                  placeholder="e.g. MTR-982103"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-extrabold text-blue-600 dark:text-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Warp/Serial Number *</label>
                <input
                  type="text"
                  placeholder="e.g. SN-772183-A"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                  required
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
                  required
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
                  required
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

              {/* Classification */}
              <div className="md:col-span-3 pt-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest block">III. Classification & Authority Sealing</span>
              </div>

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

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs tracking-wider uppercase rounded transition-all shadow-sm"
              >
                File Formal Receipt & Queue
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Registry Log View */
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Controls bar with Structured Area Segment Filters */}
          <div className="p-3 bg-slate-55/40 dark:bg-slate-850/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Account / Meter / Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                />
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
                  <option value="all">All Companies</option>
                  <option value="26">PESCO (26)</option>
                  <option value="11">LESCO (11)</option>
                  <option value="22">FESCO (22)</option>
                  <option value="14">IESCO (14)</option>
                  <option value="15">MEPCO (15)</option>
                  <option value="25">HESCO (25)</option>
                  <option value="18">PESCO (18)</option>
                  <option value="31">SEPCO (31)</option>
                  <option value="24">QESCO (24)</option>
                  <option value="35">TESCO (35)</option>
                  <option value="09">PESCO (09)</option>
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Circle</label>
                <select
                  value={filterCircle}
                  onChange={(e) => setFilterCircle(e.target.value)}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="all">All Circles</option>
                  <option value="1">Peshawar (1)</option>
                  <option value="2">Khyber (2)</option>
                  <option value="3">Mardan (3)</option>
                  <option value="5">Swat (5)</option>
                  <option value="6">Bannu (6)</option>
                  <option value="8">Swabi (8)</option>
                  <option value="9">DI Khan (9)</option>
                  <option value="7">Circle 7</option>
                  <option value="0">Circle 0</option>
                  <option value="4">Circle 4</option>
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Division</label>
                <select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="all">All Divisions</option>
                  <option value="1">Division 1</option>
                  <option value="2">Division 2</option>
                  <option value="3">Division 3</option>
                  <option value="4">Division 4</option>
                  <option value="5">Division 5</option>
                  <option value="6">Division 6</option>
                  <option value="7">Division 7</option>
                  <option value="8">Division 8</option>
                  <option value="9">Division 9</option>
                  <option value="0">Division 0</option>
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Filter Sub-Division</label>
                <select
                  value={filterSubdivision}
                  onChange={(e) => setFilterSubdivision(e.target.value)}
                  className="w-full text-[10px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="all">All Sub-Divisions</option>
                  <option value="1">Sub-Division 1</option>
                  <option value="2">Sub-Division 2</option>
                  <option value="3">Sub-Division 3</option>
                  <option value="4">Sub-Division 4</option>
                  <option value="5">Sub-Division 5</option>
                  <option value="6">Sub-Division 6</option>
                  <option value="7">Sub-Division 7</option>
                  <option value="8">Sub-Division 8</option>
                  <option value="9">Sub-Division 9</option>
                  <option value="0">Sub-Division 0</option>
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
                  <option value="01">Batch 01</option>
                  <option value="11">Batch 11</option>
                  <option value="12">Batch 12</option>
                  <option value="14">Batch 14</option>
                  <option value="02">Batch 02</option>
                  <option value="03">Batch 03</option>
                  <option value="05">Batch 05</option>
                  <option value="15">Batch 15</option>
                  <option value="22">Batch 22</option>
                  <option value="26">Batch 26</option>
                </select>
              </div>
            </div>

            {/* Clear Filters helper button */}
            {(filterCompany !== 'all' || filterCircle !== 'all' || filterDivision !== 'all' || filterSubdivision !== 'all' || filterBatch !== 'all') && (
              <div className="flex justify-end pt-0.5">
                <button
                  onClick={() => {
                    setFilterCompany('all');
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-300">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 dark:text-slate-500">
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
                                  {parsed.companyName.split(' ')[0]}
                                </span>
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1 rounded">
                                  Cir {parsed.circleCode}
                                </span>
                                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450 px-1 rounded">
                                  Sub-Div {parsed.subdivisionCode}
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
