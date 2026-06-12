/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  User, 
  Gauge, 
  BookmarkCheck, 
  HelpCircle, 
  Search, 
  ShieldAlert, 
  CheckSquare, 
  ChevronRight,
  ClipboardList,
  Flame,
  FileCheck
} from 'lucide-react';
import { Meter, TestReport, MeterCategory, MeterReadings, AccuracyTest, EquipmentReceipt } from '../types';

interface TestingViewProps {
  meters: Meter[];
  receipts?: EquipmentReceipt[];
  onAddReportAndVerifyMeter: (updatedMeter: Meter, report: TestReport) => void;
  currentUser: any;
  defaultCategoryFilter: MeterCategory; // which bench is active
}

export default function TestingView({ 
  meters, 
  receipts = [],
  onAddReportAndVerifyMeter, 
  currentUser,
  defaultCategoryFilter
}: TestingViewProps) {

  // Select Meter from Backlog to test
  const pendingMetersOfThisType = meters.filter(
    m => m.category === defaultCategoryFilter && m.status !== 'passed' && m.status !== 'failed' && m.status !== 'report_issued'
  );

  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  
  // Form Fields
  // I. Consumer Info
  const [accountNumber, setAccountNumber] = useState('');
  const [tariff, setTariff] = useState('A-1a Domestic Non-ToU (Sanctioned load up to 5 kW)');
  const [consumerName, setConsumerName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [natureOfConnection, setNatureOfConnection] = useState('Residential Master connection');

  // II. Meter Info
  const [meterNumber, setMeterNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [installationDate, setInstallationDate] = useState('2025-01-01');
  const [removalDate, setRemovalDate] = useState(new Date().toISOString().split('T')[0]);

  // III. Meter Reading Details
  const [kwhPeak, setKwhPeak] = useState('1024.1');
  const [kwhOffPeak, setKwhOffPeak] = useState('841.0');
  const [kvarhPeak, setKvarhPeak] = useState('119.5');
  const [kvarhOffPeak, setKvarhOffPeak] = useState('98.0');
  const [mdiPeak, setMdiPeak] = useState('12.5');
  const [mdiOffPeak, setMdiOffPeak] = useState('8.4');

  // IV. Accuracy Test Parameters
  const [accuracyPercentage, setAccuracyPercentage] = useState('99.75');
  const [testLoad, setTestLoad] = useState('10 A');
  const [testVoltage, setTestVoltage] = useState('230 V');
  const [testCurrent, setTestCurrent] = useState('10.0 A');
  const [powerFactor, setPowerFactor] = useState('1.0');
  const [errorPercentage, setErrorPercentage] = useState('+0.25');
  const [standardLimit, setStandardLimit] = useState('±1.0%');
  const [passFail, setPassFail] = useState<'Pass' | 'Fail'>('Pass');

  // V. Discrepancies checkboxes (multiple allow)
  const [discrepancies, setDiscrepancies] = useState<string[]>(['No Discrepancy']);
  const [otherDiscrepancyRemarks, setOtherDiscrepancyRemarks] = useState('');

  // VI. Certification Details
  const [checkedBy, setCheckedBy] = useState(currentUser.name);
  const [checkedByDesignation, setCheckedByDesignation] = useState(currentUser.designation);
  const [counterSignedBy, setCounterSignedBy] = useState('Sarah Rahman');
  const [counterSignedByDesignation, setCounterSignedByDesignation] = useState('Laboratory Executive & Manager');
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split('T')[0]);

  const [formSuccess, setFormSuccess] = useState('');

  // Auto layout prefill when meter selected from backlog queue
  useEffect(() => {
    if (selectedMeterId) {
      const match = meters.find(m => m.id === selectedMeterId);
      if (match) {
        setMeterNumber(match.meterNumber);
        setSerialNumber(match.serialNumber);
        setManufacturer(match.manufacturer);
        
        // Search for dynamic matches in the Inward Register (receipts)
        const matchedReceipt = receipts.find(r => 
          r.meterNumber.toUpperCase() === match.meterNumber.toUpperCase() ||
          r.serialNumber.toUpperCase() === match.serialNumber.toUpperCase()
        );

        if (matchedReceipt) {
          setAccountNumber(matchedReceipt.consumerAccount || '');
          setConsumerName(matchedReceipt.consumerName || '');
          setNatureOfConnection(matchedReceipt.reasonForTesting || 'Routine Calibration');
          setTariff(matchedReceipt.remarks?.includes('Commercial') ? 'A-2a Commercial Non-ToU (Sanctioned load up to 5 kW)' : 'A-1a Domestic Non-ToU (Sanctioned load up to 5 kW)');
          setFatherName('Official Utility Custody');
        } else {
          // Custom consumer mapping based on preseeded receipts (if exist)
          if (match.meterNumber === 'MTR-102941') {
            setAccountNumber('12093847210928');
            setConsumerName('Blue Ridge Textiles Ltd');
            setFatherName('Waris Ali');
            setNatureOfConnection('Industrial Bulk Feed (Seasonal Tariff)');
          } else if (match.meterNumber === 'MTR-772183') {
            setAccountNumber('14221190281726');
            setConsumerName('Dr. Sameer Al-Faisal');
            setFatherName('Ibrahim Al-Faisal');
            setNatureOfConnection('General Commercial Sub-Phase');
          } else if (match.meterNumber === 'MTR-309128') {
            setAccountNumber('11029182736450');
            setConsumerName('Alpha Tech Parks Inc');
            setFatherName('W. L. Tech');
            setNatureOfConnection('Smart High Voltage Feeder Grid');
          } else {
            // Generate realistic placeholder consumer
            const randomAccountParts = Math.floor(1000000000 + Math.random() * 9000000000);
            setAccountNumber(`100${randomAccountParts}`);
            setConsumerName(`Govt Feeder Client-${match.meterNumber}`);
            setFatherName('Official Utility Custody');
            setNatureOfConnection('Standard Grid Tie');
          }
        }
      }
    } else {
      // Clear fields if custom manual entry is chosen
      setMeterNumber('');
      setSerialNumber('');
      setManufacturer('');
      setAccountNumber('');
      setConsumerName('');
    }
  }, [selectedMeterId, meters, receipts]);

  // Dynamically carry forward details from Inward Receipts when meterNumber or serialNumber changes manually
  useEffect(() => {
    if (meterNumber && !selectedMeterId) {
      const matchReceipt = receipts.find(r => r.meterNumber.toUpperCase() === meterNumber.trim().toUpperCase());
      if (matchReceipt) {
        setAccountNumber(matchReceipt.consumerAccount || '');
        setConsumerName(matchReceipt.consumerName || '');
        setSerialNumber(matchReceipt.serialNumber || '');
        setManufacturer(matchReceipt.make || '');
        setNatureOfConnection(matchReceipt.reasonForTesting || 'Routine Calibration');
      }
    }
  }, [meterNumber, selectedMeterId, receipts]);

  useEffect(() => {
    if (serialNumber && !selectedMeterId) {
      const matchReceipt = receipts.find(r => r.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase());
      if (matchReceipt) {
        setAccountNumber(matchReceipt.consumerAccount || '');
        setConsumerName(matchReceipt.consumerName || '');
        setMeterNumber(matchReceipt.meterNumber || '');
        setManufacturer(matchReceipt.make || '');
        setNatureOfConnection(matchReceipt.reasonForTesting || 'Routine Calibration');
      }
    }
  }, [serialNumber, selectedMeterId, receipts]);

  const handleDiscrepancyToggle = (profile: string) => {
    if (profile === 'No Discrepancy') {
      setDiscrepancies(['No Discrepancy']);
      return;
    }
    
    let updated = discrepancies.filter(x => x !== 'No Discrepancy');
    if (updated.includes(profile)) {
      updated = updated.filter(x => x !== profile);
    } else {
      updated.push(profile);
    }
    
    if (updated.length === 0) {
      updated = ['No Discrepancy'];
    }
    setDiscrepancies(updated);
  };

  const handlesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterNumber || !accountNumber || !consumerName) {
      alert('Please select or specify a valid Meter Number & Consumer Account.');
      return;
    }

    const testId = `tr-gen-${Date.now()}`;
    const reportNumber = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const readings: MeterReadings = defaultCategoryFilter === 'single_phase' ? {
      kwhPeak,
      kwhOffPeak: '—',
      kvarhPeak: '—',
      kvarhOffPeak: '—',
      mdiPeak: '—',
      mdiOffPeak: '—'
    } : {
      kwhPeak,
      kwhOffPeak,
      kvarhPeak,
      kvarhOffPeak,
      mdiPeak,
      mdiOffPeak
    };

    const accuracyTest: AccuracyTest = {
      accuracyPercentage: `${accuracyPercentage}%`,
      testLoad,
      testVoltage,
      testCurrent,
      powerFactor,
      errorPercentage: `${errorPercentage}%`,
      standardLimit,
      passFail
    };

    // Construct reports
    const reportObj: TestReport = {
      id: testId,
      reportNumber,
      meterId: selectedMeterId || `m-manual-${Date.now()}`,
      testDate: approvalDate,
      consumerName,
      accountNumber,
      tariff,
      fatherName,
      natureOfConnection,
      meterNumber,
      meterType: defaultCategoryFilter,
      meterMake: manufacturer || 'Secure Meters Ltd',
      serialNumber,
      installationDate,
      removalDate,
      readings,
      accuracyTest,
      discrepancies,
      otherDiscrepancyRemarks: otherDiscrepancyRemarks || undefined,
      checkedBy,
      checkedByDesignation,
      counterSignedBy,
      counterSignedByDesignation,
      approvalDate,
      qrCodeMockUrl: `${window.location.origin}/verify/${reportNumber}`
    };

    // Target meter state to update
    const updatedMeterObj: Meter = {
      id: selectedMeterId || `m-manual-${Date.now()}`,
      meterNumber,
      serialNumber,
      manufacturer: manufacturer || 'Secure Meters Ltd',
      accuracyClass: defaultCategoryFilter === 'single_phase' ? 'Class 1.0' : 
                     defaultCategoryFilter === 'three_phase_whole' ? 'Class 1.0' :
                     defaultCategoryFilter === 'smart' ? 'Class 0.2S' : 'Class 0.5S',
      category: defaultCategoryFilter,
      status: passFail === 'Pass' ? 'passed' : 'failed',
      stockStatus: passFail === 'Pass' ? 'Approved' : 'Rejected',
      purchaseDate: installationDate,
      remarks: `Lab verification complete: Error recorded ${errorPercentage}%. Result: ${passFail}.`
    };

    onAddReportAndVerifyMeter(updatedMeterObj, reportObj);
    setFormSuccess(`Test Approved & Signed! Compliance report reference: ${reportNumber} successfully compiled.`);
    
    // Clear selections
    setSelectedMeterId('');
    setTimeout(() => {
      setFormSuccess('');
    }, 4500);
  };

  const getBenchTitle = (cat: MeterCategory) => {
    switch (cat) {
      case 'single_phase': return 'Single Phase Bench (Standard)';
      case 'three_phase_whole': return 'Three Phase Whole Current Bench';
      case 'three_phase_ct': return 'Three Phase CT Operated Calibration Bench';
      case 'three_phase_ct_pt': return 'Three Phase CT/PT Instrument Transformer Bench';
      default: return 'Standard Calibration Cell';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl border border-blue-800/40 text-white flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-tight flex items-center gap-1.5">
            <Cpu className="w-5 h-5 text-indigo-300" />
            {getBenchTitle(defaultCategoryFilter)}
          </h2>
          <p className="text-xs text-slate-300 mt-1">Calibrate error parameters and record electrical register indices during laboratory testing.</p>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold">
          Station Type: {defaultCategoryFilter.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2 animate-bounce">
          <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          {formSuccess}
        </div>
      )}

      {/* Main Testing Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar: Queue items awaiting testing */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-amber-500" />
              Intake Backlog Pending Test ({pendingMetersOfThisType.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Select a received meter to start calibration</p>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {pendingMetersOfThisType.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="font-bold text-xs">No Pending Meters</p>
                <p className="text-[10px] mt-1 text-slate-400">All received meters of this category have been tested.</p>
              </div>
            ) : (
              pendingMetersOfThisType.map(pm => (
                <div
                  key={pm.id}
                  onClick={() => setSelectedMeterId(pm.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedMeterId === pm.id 
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm' 
                    : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-indigo-950 text-xs">{pm.meterNumber}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded">
                      Intake Ready
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{pm.manufacturer} • SN: {pm.serialNumber}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side form */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Laboratory Calibration log Sheet Form
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Logged as: {currentUser.name} ({currentUser.role})
            </span>
          </div>

          <form onSubmit={handlesSubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* Sec I: Consumer Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">I. Consumer Account Profile Information</h4>
              </div>

              {(() => {
                const matchingReceipt = receipts.find(r => {
                  const m = selectedMeterId ? meters.find(item => item.id === selectedMeterId) : null;
                  if (m) {
                    return r.meterNumber.toUpperCase() === m.meterNumber.toUpperCase() ||
                           r.serialNumber.toUpperCase() === m.serialNumber.toUpperCase();
                  }
                  return (meterNumber && r.meterNumber.toUpperCase() === meterNumber.trim().toUpperCase()) ||
                         (serialNumber && r.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase());
                });

                if (!matchingReceipt) return null;

                return (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 p-2.5 rounded-lg text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold animate-in fade-in duration-200">
                    <span className="flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        Inward Data Carried Forward from Receipt:{' '}
                        <span className="font-mono font-bold text-slate-800 dark:text-white">{matchingReceipt.receiptNumber}</span>
                        {' '}({matchingReceipt.consumerName})
                      </span>
                    </span>
                    <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded tracking-wider shrink-0 ml-2">
                      Active Linked
                    </span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number * (14 Digits)</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="e.g. 14221190281726"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none focus:bg-white transition-all text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tariff Schedule *</label>
                  <select
                    value={tariff}
                    onChange={(e) => setTariff(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none focus:bg-white text-slate-705 cursor-pointer font-semibold"
                  >
                    <optgroup label="A-1: Residential">
                      <option value="A-1a Domestic Non-ToU (Sanctioned load up to 5 kW)">A-1a Domestic Non-ToU (Sanctioned load up to 5 kW)</option>
                      <option value="A-1b Domestic ToU (Time-of-Use)">A-1b Domestic ToU (Time-of-Use)</option>
                    </optgroup>
                    <optgroup label="A-2: Commercial">
                      <option value="A-2a Commercial Non-ToU (Sanctioned load up to 5 kW)">A-2a Commercial Non-ToU (Sanctioned load up to 5 kW)</option>
                      <option value="A-2b Commercial Non-ToU (Sanctioned load above 5 kW)">A-2b Commercial Non-ToU (Sanctioned load above 5 kW)</option>
                      <option value="A-2c Commercial ToU">A-2c Commercial ToU</option>
                      <option value="A-2d Electric Vehicle Charging Station">A-2d Electric Vehicle Charging Station</option>
                    </optgroup>
                    <optgroup label="A-3: General Services">
                      <option value="A-3 Mosques, Hospitals, Govt Offices, Water Pumps">A-3 Mosques, Hospitals, Govt Offices, Water Pumps</option>
                    </optgroup>
                    <optgroup label="B: Industrial">
                      <option value="B-1 Sanctioned Load up to 25 kW">B-1 Sanctioned Load up to 25 kW</option>
                      <option value="B-2 Sanctioned Load 25 - 500 kW">B-2 Sanctioned Load 25 - 500 kW</option>
                      <option value="B-3 Sanctioned Load 500 - 5000 kW">B-3 Sanctioned Load 500 - 5000 kW</option>
                      <option value="B-4 Sanctioned Load above 5000 kW">B-4 Sanctioned Load above 5000 kW</option>
                    </optgroup>
                    <optgroup label="C: Single Point">
                      <option value="C-1 Supply at 400/230 Volts">C-1 Supply at 400/230 Volts</option>
                      <option value="C-2 Supply at 11 kV">C-2 Supply at 11 kV</option>
                      <option value="C-3 Supply at 33 kV and above">C-3 Supply at 33 kV and above</option>
                    </optgroup>
                    <optgroup label="D: Agriculture">
                      <option value="D-1a Tubewell (Flat rate)">D-1a Tubewell (Flat rate)</option>
                      <option value="D-1b Tubewell (ToU)">D-1b Tubewell (ToU)</option>
                    </optgroup>
                    <optgroup label="E: Temporary">
                      <option value="E-1 Temporary Residential Supply">E-1 Temporary Residential Supply</option>
                      <option value="E-2 Temporary Commercial/Industrial Supply">E-2 Temporary Commercial/Industrial Supply</option>
                    </optgroup>
                    <optgroup label="F: Public Lighting">
                      <option value="F-1 Street Lights">F-1 Street Lights</option>
                    </optgroup>
                    <optgroup label="G: Residential Colony">
                      <option value="G-1 Residential Colony provided with bulk supply">G-1 Residential Colony provided with bulk supply</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Consumer Name *</label>
                  <input
                    type="text"
                    placeholder="Consumer Name"
                    value={consumerName}
                    onChange={(e) => setConsumerName(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none focus:bg-white text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Father / Guardian Name *</label>
                  <input
                    type="text"
                    placeholder="Guardian Name"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none focus:bg-white text-slate-900"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nature of Connection</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard High-Voltage feed connected via line drop"
                    value={natureOfConnection}
                    onChange={(e) => setNatureOfConnection(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Sec II: Meter Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">II. Tested Meter Specifications</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Meter Target Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. MTR-982103"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-950 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Warp/Serial Number *</label>
                  <input
                    type="text"
                    placeholder="SN-...."
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Meter Make/Manufacturer</label>
                  <input
                    type="text"
                    placeholder="Make / Brand"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Installation Date</label>
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Sec III: Readings */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">III. As-Found Register Dial Indexes</h4>
              </div>

              {defaultCategoryFilter === 'single_phase' ? (
                <div className="max-w-xs font-mono">
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Final Reading (kWh) *</label>
                  <input
                    type="text"
                    value={kwhPeak}
                    onChange={(e) => setKwhPeak(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                    placeholder="Enter Final Reading"
                    required
                  />
                  <p className="text-[10.5px] text-indigo-700/80 font-semibold mt-1">
                    ℹ️ For single phase meters, only one "Final Reading" is required. All other complex billing registers are omitted.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">KWH Peak *</label>
                    <input
                      type="text"
                      value={kwhPeak}
                      onChange={(e) => setKwhPeak(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">KWH Off Peak *</label>
                    <input
                      type="text"
                      value={kwhOffPeak}
                      onChange={(e) => setKwhOffPeak(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">KVARH Peak *</label>
                    <input
                      type="text"
                      value={kvarhPeak}
                      onChange={(e) => setKvarhPeak(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">KVARH Off Peak *</label>
                    <input
                      type="text"
                      value={kvarhOffPeak}
                      onChange={(e) => setKvarhOffPeak(e.target.value)}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">MDI Peak * (kW)</label>
                    <input
                      type="text"
                      value={mdiPeak}
                      onChange={(e) => setMdiPeak(e.target.value)}
                      className="w-full text-xs p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg font-black text-indigo-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">MDI Off Peak * (kW)</label>
                    <input
                      type="text"
                      value={mdiOffPeak}
                      onChange={(e) => setMdiOffPeak(e.target.value)}
                      className="w-full text-xs p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg font-black text-indigo-900"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sec IV: Accuracy test details */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">IV. Target Accuracy Benchmark Audit</h4>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Applied Test Load *</label>
                  <input
                    type="text"
                    value={testLoad}
                    onChange={(e) => setTestLoad(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Applied Voltage *</label>
                  <input
                    type="text"
                    value={testVoltage}
                    onChange={(e) => setTestVoltage(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Applied Amperage Current *</label>
                  <input
                    type="text"
                    value={testCurrent}
                    onChange={(e) => setTestCurrent(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Power Factor (PF)</label>
                  <input
                    type="text"
                    value={powerFactor}
                    onChange={(e) => setPowerFactor(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Accuracy Registered % *</label>
                  <input
                    type="text"
                    value={accuracyPercentage}
                    onChange={(e) => setAccuracyPercentage(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-850"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Recorded Error Percentage % *</label>
                  <input
                    type="text"
                    value={errorPercentage}
                    onChange={(e) => setErrorPercentage(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Decision Benchmark</label>
                  <select
                    value={passFail}
                    onChange={(e) => setPassFail(e.target.value as 'Pass' | 'Fail')}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg font-extrabold text-slate-800 cursor-pointer"
                  >
                    <option value="Pass">PASSED COMPARATOR STANDARD</option>
                    <option value="Fail">REJECTED / OUT OF TOLERANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Standard Margin Limit Allowed</label>
                  <input
                    type="text"
                    value={standardLimit}
                    onChange={(e) => setStandardLimit(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Sec V: Discrepancy checklists (9 states) */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">V. Physical & Electrical Abuse Discrepancies Map</h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {[
                  'No Discrepancy',
                  'Slow Meter',
                  'Fast Meter',
                  'Dead Meter',
                  'Display Fault',
                  'Communication Fault',
                  'Burnt Meter',
                  'Tampered Meter',
                  'Other'
                ].map(disc => {
                  const active = discrepancies.includes(disc);
                  return (
                    <div
                      key={disc}
                      onClick={() => handleDiscrepancyToggle(disc)}
                      className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all flex items-center gap-2 ${
                        active 
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CheckSquare className={`w-4 h-4 ${active ? 'text-rose-600 fill-rose-100' : 'text-slate-400'}`} />
                      {disc}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Custom Discrepancy / Analytical Findings</label>
                <textarea
                  placeholder="Provide additional findings regarding magnetic clamp marks or bypass solder wires if any."
                  value={otherDiscrepancyRemarks}
                  onChange={(e) => setOtherDiscrepancyRemarks(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Sec VI: Sign-off Seal authorities */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">VI. Certification & Sign-off Seal authorities</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">I. Testing Lab Officer (Checker)</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Checker Staff Name</label>
                    <input
                      type="text"
                      value={checkedBy}
                      onChange={(e) => setCheckedBy(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Checker Designation</label>
                    <input
                      type="text"
                      value={checkedByDesignation}
                      onChange={(e) => setCheckedByDesignation(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">II. Countersigned Authority (Overseer)</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Countersign Staff Name</label>
                    <input
                      type="text"
                      value={counterSignedBy}
                      onChange={(e) => setCounterSignedBy(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Countersign Designation</label>
                    <input
                      type="text"
                      value={counterSignedByDesignation}
                      onChange={(e) => setCounterSignedByDesignation(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Authorize & Sign Certificate
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
