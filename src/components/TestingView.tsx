/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getPKTDateString } from '../utils';
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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Flame,
  FileCheck,
  QrCode,
  Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SignaturePad } from './SignaturePad';
import { PhotoCapture } from './PhotoCapture';
import { Meter, TestReport, MeterCategory, MeterReadings, AccuracyTest, EquipmentReceipt } from '../types';

interface TestingViewProps {
  meters: Meter[];
  receipts?: EquipmentReceipt[];
  onAddReportAndVerifyMeter: (updatedMeter: Meter, report: TestReport) => void;
  onOpenReportPDF?: (report: TestReport) => void;
  currentUser: any;
  defaultCategoryFilter: MeterCategory; // which bench is active
}

export default function TestingView({ 
  meters, 
  receipts = [],
  onAddReportAndVerifyMeter, 
  onOpenReportPDF,
  currentUser,
  defaultCategoryFilter
}: TestingViewProps) {

  // Select Meter from Backlog to test
  const pendingMetersOfThisType = meters.filter(
    m => {
      const isMatch = m.category === defaultCategoryFilter ||
        (defaultCategoryFilter === 'three_phase_whole' && m.category === 'bi_directional_three_phase_whole') ||
        (defaultCategoryFilter === 'three_phase_ct_pt' && m.category === 'bi_directional_ct_pt');
      return isMatch && m.status !== 'passed' && m.status !== 'failed' && m.status !== 'report_issued';
    }
  );

  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  const [activeStep, setActiveStep] = useState(1);
  
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
  const [removalDate, setRemovalDate] = useState(getPKTDateString());

  // III. Meter Reading Details
  const [kwhPeak, setKwhPeak] = useState('');
  const [kwhOffPeak, setKwhOffPeak] = useState('');
  const [kvarhPeak, setKvarhPeak] = useState('');
  const [kvarhOffPeak, setKvarhOffPeak] = useState('');
  const [mdiPeak, setMdiPeak] = useState('');
  const [mdiOffPeak, setMdiOffPeak] = useState('');

  // Bi-Directional specific states
  const [importKwhPeak, setImportKwhPeak] = useState('');
  const [importKwhOffPeak, setImportKwhOffPeak] = useState('');
  const [importKvarhPeak, setImportKvarhPeak] = useState('');
  const [importKvarhOffPeak, setImportKvarhOffPeak] = useState('');
  const [importMdiPeak, setImportMdiPeak] = useState('');
  const [importMdiOffPeak, setImportMdiOffPeak] = useState('');

  const [exportKwhPeak, setExportKwhPeak] = useState('');
  const [exportKwhOffPeak, setExportKwhOffPeak] = useState('');
  const [exportKvarhPeak, setExportKvarhPeak] = useState('');
  const [exportKvarhOffPeak, setExportKvarhOffPeak] = useState('');
  const [exportMdiPeak, setExportMdiPeak] = useState('');
  const [exportMdiOffPeak, setExportMdiOffPeak] = useState('');

  // IV. Accuracy Test Parameters
  const [accuracyPercentage, setAccuracyPercentage] = useState('');
  const [testLoad, setTestLoad] = useState('');
  const [testVoltage, setTestVoltage] = useState('');
  const [testCurrent, setTestCurrent] = useState('');
  const [powerFactor, setPowerFactor] = useState('1.0');
  const [errorPercentage, setErrorPercentage] = useState('');
  const [standardLimit, setStandardLimit] = useState('±1.0%');
  const [passFail, setPassFail] = useState<'Pass' | 'Fail'>('Pass');

  // V. Discrepancies checkboxes (multiple allow)
  const [discrepancies, setDiscrepancies] = useState<string[]>(['No Discrepancy']);
  const [otherDiscrepancyRemarks, setOtherDiscrepancyRemarks] = useState('');

  // VI. Certification Details
  const [checkedBy, setCheckedBy] = useState(currentUser.name);
  const [checkedBySignature, setCheckedBySignature] = useState<string | undefined>();
  const [checkedByDesignation, setCheckedByDesignation] = useState(currentUser.designation);
  const [counterSignedBy, setCounterSignedBy] = useState('Sarah Rahman');
  const [counterSignedBySignature, setCounterSignedBySignature] = useState<string | undefined>();
  const [counterSignedByDesignation, setCounterSignedByDesignation] = useState('Laboratory Executive & Manager');
  const [approvalDate, setApprovalDate] = useState(getPKTDateString());
  const [nameplatePhotoUrl, setNameplatePhotoUrl] = useState<string | undefined>();
  
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [lastCreatedReport, setLastCreatedReport] = useState<TestReport | null>(null);

  // Extra CT/PT Fields state variables
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [connectedLoad, setConnectedLoad] = useState('');
  const [transformerCapacity, setTransformerCapacity] = useState('');
  const [multiplyingFactor, setMultiplyingFactor] = useState('');
  const [installedCtsRatio, setInstalledCtsRatio] = useState('');
  const [marksOfSealingPlier, setMarksOfSealingPlier] = useState('');
  const [resultsCheckingSlow, setResultsCheckingSlow] = useState('');
  const [resultsCheckingFast, setResultsCheckingFast] = useState('');
  const [resultsCheckingCorrect, setResultsCheckingCorrect] = useState('');

  // Security Slips
  const [touBody, setTouBody] = useState('');
  const [touTcover, setTouTcover] = useState('');
  const [touSimNo, setTouSimNo] = useState('');
  const [touMsb, setTouMsb] = useState('');
  const [touMsbGlass, setTouMsbGlass] = useState('');
  const [touSimId, setTouSimId] = useState('');

  // Security Slips Removed
  const [removedTouBody, setRemovedTouBody] = useState('');
  const [removedTouTcover, setRemovedTouTcover] = useState('');
  const [removedTouMsb, setRemovedTouMsb] = useState('');
  const [removedTouMsbGlass, setRemovedTouMsbGlass] = useState('');

  // Removed AMR details
  const [removedAmrNo, setRemovedAmrNo] = useState('');
  const [removedAmrMake, setRemovedAmrMake] = useState('');
  const [removedAmrAmps, setRemovedAmrAmps] = useState('');
  const [removedAmrKwh, setRemovedAmrKwh] = useState('');
  const [removedAmrKvarh, setRemovedAmrKvarh] = useState('');
  const [removedAmrMdi, setRemovedAmrMdi] = useState('');
  const [removedAmrSum, setRemovedAmrSum] = useState('');
  const [removedAmrResetNo, setRemovedAmrResetNo] = useState('');

  // Removed Backup details
  const [removedBackupNo, setRemovedBackupNo] = useState('');
  const [removedBackupMake, setRemovedBackupMake] = useState('');
  const [removedBackupAmps, setRemovedBackupAmps] = useState('');
  const [removedBackupKwh, setRemovedBackupKwh] = useState('');
  const [removedBackupKvarh, setRemovedBackupKvarh] = useState('');
  const [removedBackupMdi, setRemovedBackupMdi] = useState('');
  const [removedBackupSum, setRemovedBackupSum] = useState('');
  const [removedBackupResetNo, setRemovedBackupResetNo] = useState('');

  const [removedCtsRatio, setRemovedCtsRatio] = useState('');

  // TOU Table (Import/Export grid)
  const [kwhImportTotal, setKwhImportTotal] = useState('');
  const [kwhExportTotal, setKwhExportTotal] = useState('');
  const [kwhImportT1, setKwhImportT1] = useState('');
  const [kwhExportT1, setKwhExportT1] = useState('');
  const [kwhImportT2, setKwhImportT2] = useState('');
  const [kwhExportT2, setKwhExportT2] = useState('');

  const [kvarhImportTotal, setKvarhImportTotal] = useState('');
  const [kvarhExportTotal, setKvarhExportTotal] = useState('');
  const [kvarhImportT1, setKvarhImportT1] = useState('');
  const [kvarhExportT1, setKvarhExportT1] = useState('');
  const [kvarhImportT2, setKvarhImportT2] = useState('');
  const [kvarhExportT2, setKvarhExportT2] = useState('');

  const [mdiImportTotal, setmdiImportTotal] = useState('');
  const [mdiExportTotal, setmdiExportTotal] = useState('');
  const [mdiImportT1, setmdiImportT1] = useState('');
  const [mdiExportT1, setmdiExportT1] = useState('');
  const [mdiImportT2, setmdiImportT2] = useState('');
  const [mdiExportT2, setmdiExportT2] = useState('');

  const [sumImportTotal, setSumImportTotal] = useState('');
  const [sumExportTotal, setSumExportTotal] = useState('');
  const [sumImportT1, setSumImportT1] = useState('');
  const [sumExportT1, setSumExportT1] = useState('');
  const [sumImportT2, setSumImportT2] = useState('');
  const [sumExportT2, setSumExportT2] = useState('');

  const [resetImportTotal, setResetImportTotal] = useState('');
  const [resetExportTotal, setResetExportTotal] = useState('');
  const [resetImportT1, setResetImportT1] = useState('');
  const [resetExportT1, setResetExportT1] = useState('');
  const [resetImportT2, setResetImportT2] = useState('');
  const [resetExportT2, setResetExportT2] = useState('');

  // Auto layout prefill when meter selected from backlog queue
  useEffect(() => {
    if (selectedMeterId) {
      const match = meters.find(m => m.id === selectedMeterId);
      if (match) {
        setMeterNumber(match.meterNumber);
        setSerialNumber(match.serialNumber);
        setManufacturer(match.manufacturer);
        setNameplatePhotoUrl(match.nameplatePhotoUrl);
        
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
          setFatherName(matchedReceipt.fatherName || 'Official Utility Custody');
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
      const matchMeter = meters.find(m => m.meterNumber.toUpperCase() === meterNumber.trim().toUpperCase());
      
      if (matchReceipt) {
        setAccountNumber(matchReceipt.consumerAccount || '');
        setConsumerName(matchReceipt.consumerName || '');
        setSerialNumber(matchReceipt.serialNumber || '');
        setManufacturer(matchReceipt.make || '');
        setNatureOfConnection(matchReceipt.reasonForTesting || 'Routine Calibration');
      }
      if (matchMeter && matchMeter.nameplatePhotoUrl) {
        setNameplatePhotoUrl(matchMeter.nameplatePhotoUrl);
      }
    }
  }, [meterNumber, selectedMeterId, receipts, meters]);

  useEffect(() => {
    if (serialNumber && !selectedMeterId) {
      const matchReceipt = receipts.find(r => r.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase());
      const matchMeter = meters.find(m => m.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase());
      if (matchReceipt) {
        setAccountNumber(matchReceipt.consumerAccount || '');
        setConsumerName(matchReceipt.consumerName || '');
        setMeterNumber(matchReceipt.meterNumber || '');
        setManufacturer(matchReceipt.make || '');
        setNatureOfConnection(matchReceipt.reasonForTesting || 'Routine Calibration');
      }
      if (matchMeter && matchMeter.nameplatePhotoUrl) {
        setNameplatePhotoUrl(matchMeter.nameplatePhotoUrl);
      }
    }
  }, [serialNumber, selectedMeterId, receipts, meters]);

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
    setFormError('');
    if (!meterNumber || !accountNumber || !consumerName) {
      setFormError('Please fill in required fields: Meter Number & Consumer Account & Name.');
      // Auto expand to step 1/2 to help find missing fields
      if (!accountNumber || !consumerName) {
        setActiveStep(1);
      } else {
        setActiveStep(2);
      }
      return;
    }

    const testId = `tr-gen-${Date.now()}`;
    const reportNumber = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const isBiDirectional = defaultCategoryFilter === 'bi_directional_three_phase_whole' || defaultCategoryFilter === 'bi_directional_ct_pt';

    const readings: MeterReadings = defaultCategoryFilter === 'single_phase' ? {
      kwhPeak,
      kwhOffPeak: '—',
      kvarhPeak: '—',
      kvarhOffPeak: '—',
      mdiPeak: '—',
      mdiOffPeak: '—'
    } : isBiDirectional ? {
      kwhPeak: importKwhPeak,
      kwhOffPeak: importKwhOffPeak,
      kvarhPeak: importKvarhPeak,
      kvarhOffPeak: importKvarhOffPeak,
      mdiPeak: importMdiPeak,
      mdiOffPeak: importMdiOffPeak
    } : {
      kwhPeak,
      kwhOffPeak,
      kvarhPeak,
      kvarhOffPeak,
      mdiPeak,
      mdiOffPeak
    };

    const importReadings: MeterReadings | undefined = isBiDirectional ? {
      kwhPeak: importKwhPeak,
      kwhOffPeak: importKwhOffPeak,
      kvarhPeak: importKvarhPeak,
      kvarhOffPeak: importKvarhOffPeak,
      mdiPeak: importMdiPeak,
      mdiOffPeak: importMdiOffPeak
    } : undefined;

    const exportReadings: MeterReadings | undefined = isBiDirectional ? {
      kwhPeak: exportKwhPeak,
      kwhOffPeak: exportKwhOffPeak,
      kvarhPeak: exportKvarhPeak,
      kvarhOffPeak: exportKvarhOffPeak,
      mdiPeak: exportMdiPeak,
      mdiOffPeak: exportMdiOffPeak
    } : undefined;

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

    const selectedMeter = meters.find(m => m.id === selectedMeterId);
    const actualMeterType = selectedMeter?.category || defaultCategoryFilter;

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
      meterType: actualMeterType,
      meterMake: manufacturer || 'Secure Meters Ltd',
      serialNumber,
      installationDate: approvalDate,
      removalDate: approvalDate,
      readings,
      importReadings,
      exportReadings,
      accuracyTest,
      discrepancies,
      otherDiscrepancyRemarks: otherDiscrepancyRemarks || undefined,
      checkedBy,
      checkedBySignature,
      checkedByDesignation,
      counterSignedBy,
      counterSignedBySignature,
      counterSignedByDesignation,
      approvalDate,
      qrCodeMockUrl: `${window.location.origin}/verify/${reportNumber}`,
      nameplatePhotoUrl,
      ctPtExtra: (defaultCategoryFilter === 'three_phase_ct' || defaultCategoryFilter === 'three_phase_ct_pt' || actualMeterType === 'bi_directional_ct_pt') ? {
        sanctionLoad,
        connectedLoad,
        transformerCapacity,
        multiplyingFactor,
        installedCtsRatio,
        marksOfSealingPlier,
        resultsCheckingSlow,
        resultsCheckingFast,
        resultsCheckingCorrect,
        touBody,
        touTcover,
        touSimNo,
        touMsb,
        touMsbGlass,
        touSimId,
        removedTouBody,
        removedTouTcover,
        removedTouMsb,
        removedTouMsbGlass,
        removedAmrNo,
        removedAmrMake,
        removedAmrAmps,
        removedAmrKwh,
        removedAmrKvarh,
        removedAmrMdi,
        removedAmrSum,
        removedAmrResetNo,
        removedBackupNo,
        removedBackupMake,
        removedBackupAmps,
        removedBackupKwh,
        removedBackupKvarh,
        removedBackupMdi,
        removedBackupSum,
        removedBackupResetNo,
        removedCtsRatio,
        kwhImportTotal,
        kwhExportTotal: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : kwhExportTotal,
        kwhImportT1,
        kwhExportT1: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : kwhExportT1,
        kwhImportT2,
        kwhExportT2: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : kwhExportT2,

        kvarhImportTotal,
        kvarhExportTotal: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : kvarhExportTotal,
        kvarhImportT1,
        kvarhExportT1: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : kvarhExportT1,
        kvarhImportT2,
        kvarhExportT2: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : kvarhExportT2,

        mdiImportTotal,
        mdiExportTotal: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : mdiExportTotal,
        mdiImportT1,
        mdiExportT1: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : mdiExportT1,
        mdiImportT2,
        mdiExportT2: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : mdiExportT2,

        sumImportTotal,
        sumExportTotal: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : sumExportTotal,
        sumImportT1,
        sumExportT1: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : sumExportT1,
        sumImportT2,
        sumExportT2: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : sumExportT2,

        resetImportTotal,
        resetExportTotal: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : resetExportTotal,
        resetImportT1,
        resetExportT1: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : resetExportT1,
        resetImportT2,
        resetExportT2: (defaultCategoryFilter === 'three_phase_ct_pt' || defaultCategoryFilter === 'three_phase_ct') ? undefined : resetExportT2,
      } : undefined
    };

    // Target meter state to update
    const updatedMeterObj: Meter = {
      id: selectedMeterId || `m-manual-${Date.now()}`,
      meterNumber,
      serialNumber,
      manufacturer: manufacturer || 'Secure Meters Ltd',
      accuracyClass: actualMeterType === 'single_phase' ? 'Class 1.0' : 
                     actualMeterType === 'three_phase_whole' ? 'Class 1.0' :
                     actualMeterType === 'bi_directional_three_phase_whole' ? 'Class 1.0' :
                     actualMeterType === 'smart' ? 'Class 0.2S' : 'Class 0.5S',
      category: actualMeterType,
      status: passFail === 'Pass' ? 'passed' : 'failed',
      stockStatus: passFail === 'Pass' ? 'Approved' : 'Rejected',
      purchaseDate: approvalDate,
      remarks: `Lab verification complete: Error recorded ${errorPercentage}%. Result: ${passFail}.`
    };

    onAddReportAndVerifyMeter(updatedMeterObj, reportObj);
    setFormSuccess(`Test Approved & Signed! Compliance report reference: ${reportNumber} successfully compiled.`);
    setLastCreatedReport(reportObj);
    setActiveStep(1);
    setFormError('');
    
    // Clear selections
    setSelectedMeterId('');
    setNameplatePhotoUrl(undefined);
    setImportKwhPeak('');
    setImportKwhOffPeak('');
    setImportKvarhPeak('');
    setImportKvarhOffPeak('');
    setImportMdiPeak('');
    setImportMdiOffPeak('');
    setExportKwhPeak('');
    setExportKwhOffPeak('');
    setExportKvarhPeak('');
    setExportKvarhOffPeak('');
    setExportMdiPeak('');
    setExportMdiOffPeak('');
    setTimeout(() => {
      setFormSuccess('');
    }, 4500);
  };

  const getBenchTitle = (cat: MeterCategory) => {
    switch (cat) {
      case 'single_phase': return 'Single Phase Bench (Standard)';
      case 'three_phase_whole': return 'Three Phase Whole Current Bench';
      case 'bi_directional_three_phase_whole': return 'Bi-Directional Three Phase Whole Current Bench';
      case 'three_phase_ct': return 'Three Phase CT Operated Calibration Bench';
      case 'three_phase_ct_pt': return 'Three Phase CT/PT Instrument Transformer Bench';
      case 'bi_directional_ct_pt': return 'Bi-Directional Three Phase CT/PT Instrument Transformer Bench';
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
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold rounded-lg flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          {lastCreatedReport && onOpenReportPDF && (
            <button
              type="button"
              onClick={() => onOpenReportPDF(lastCreatedReport)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-100" />
              <span>Print Created Certificate</span>
            </button>
          )}
        </div>
      )}

      {formError && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-2 animate-shake">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          {formError}
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

          {/* Dynamic Active Target QR Code Card */}
          {(meterNumber || serialNumber) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-700">Active Target QR</span>
                </div>
                <span className="text-[8px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Live</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                  <QRCodeSVG 
                    value={JSON.stringify({
                      consumerAccount: accountNumber,
                      consumerName: consumerName,
                      fatherName: fatherName,
                      meterType: defaultCategoryFilter,
                      meterNumber: meterNumber,
                      serialNumber: serialNumber,
                      make: manufacturer,
                      receivedFrom: natureOfConnection,
                      reasonForTesting: "Calibration Check",
                      remarks: otherDiscrepancyRemarks
                    })}
                    size={160}
                    level="L"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black font-mono text-indigo-950 uppercase">{meterNumber || 'MTR-MANUAL'}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase font-mono">SN: {serialNumber || 'PENDING'}</p>
                </div>
                <p className="text-[8.5px] text-slate-400 bg-white/50 border border-slate-150 p-2 rounded leading-normal">
                  Scan this QR code with any workstation reader or intake scanner to instantly duplicate or load this calibration profile.
                </p>
              </div>
            </div>
          )}
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

          <form onSubmit={handlesSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Step Progress Bar */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calibration Progress</span>
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">Step {activeStep} of 6</span>
              </div>
              
              {/* Progress track line */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300" 
                  style={{ width: `${(activeStep / 6) * 100}%` }}
                />
              </div>

              {/* Steps pills/indicators */}
              <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-start sm:gap-3">
                {[
                  { id: 1, label: 'Profile' },
                  { id: 2, label: 'Specs' },
                  { id: 3, label: 'Readings' },
                  { id: 4, label: 'Accuracy' },
                  { id: 5, label: 'Abuse/Evidence' },
                  { id: 6, label: 'Certification' }
                ].map((step) => {
                  const isCompleted = (step.id === 1 && accountNumber.trim() !== '' && consumerName.trim() !== '') ||
                                      (step.id === 2 && meterNumber.trim() !== '' && serialNumber.trim() !== '') ||
                                      (step.id === 3 && kwhPeak.trim() !== '') ||
                                      (step.id === 4 && accuracyPercentage.trim() !== '') ||
                                      (step.id === 5 && (discrepancies.length > 0 || otherDiscrepancyRemarks.trim() !== '' || nameplatePhotoUrl !== undefined));
                  
                  const isActive = activeStep === step.id;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all border select-none cursor-pointer ${
                        isActive
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                        isActive
                        ? 'bg-white text-indigo-600'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>{step.id}</span>
                      <span className="hidden xs:inline">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 1: CONSUMER INFORMATION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    activeStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>I</span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-indigo-950 dark:text-white leading-tight">I. Consumer Account Profile</h3>
                    <p className="text-[9px] text-slate-400 leading-none mt-0.5 font-semibold">Consumer name, account number, connection details and tariff</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {accountNumber.trim() !== '' && consumerName.trim() !== '' && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Complete</span>
                  )}
                  {activeStep === 1 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              <div className={`${activeStep === 1 ? 'p-4 sm:p-5 space-y-4' : 'hidden'} animate-in fade-in duration-200`}>
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="e.g. 14221190281726"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Testing Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Laboratory dispute calibration check / Routine Test"
                    value={natureOfConnection}
                    onChange={(e) => setNatureOfConnection(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Navigation Actions for Step 1 */}
              <div className="flex justify-end pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (accountNumber.trim() === '' || consumerName.trim() === '') {
                      setFormError('Please fill in Account Number and Consumer Name before continuing.');
                      return;
                    }
                    setFormError('');
                    setActiveStep(2);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-sm select-none cursor-pointer"
                >
                  Continue to Tested Specs
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: TESTED METER SPECIFICATIONS */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveStep(activeStep === 2 ? 0 : 2)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>II</span>
                <div>
                  <h3 className="text-xs font-black uppercase text-indigo-950 dark:text-white leading-tight">II. Tested Meter Specifications</h3>
                  <p className="text-[9px] text-slate-400 leading-none mt-0.5 font-semibold">Meter ID, serial code, make, and test timing records</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {meterNumber.trim() !== '' && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Complete</span>
                )}
                {activeStep === 2 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            <div className={`${activeStep === 2 ? 'p-4 sm:p-5 space-y-4' : 'hidden'} animate-in fade-in duration-200`}>
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Warp / Serial Code:</label>
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Meter Make</label>
                  <input
                    type="text"
                    placeholder="Make / Brand"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Testing Date</label>
                  <input
                    type="date"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
                  />
                </div>
              </div>

              {/* Navigation Actions for Step 2 */}
              <div className="flex justify-between pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 select-none cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (meterNumber.trim() === '' || serialNumber.trim() === '') {
                      setFormError('Please fill in Meter Target Number and Warp/Serial Code before continuing.');
                      return;
                    }
                    setFormError('');
                    setActiveStep(3);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-sm select-none cursor-pointer"
                >
                  Continue to Readings
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* STEP 3: AS-FOUND REGISTER DIAL INDEXES */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveStep(activeStep === 3 ? 0 : 3)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>III</span>
                <div>
                  <h3 className="text-xs font-black uppercase text-indigo-950 dark:text-white leading-tight">III. As-Found Register Dial Indexes</h3>
                  <p className="text-[9px] text-slate-400 leading-none mt-0.5 font-semibold">Active/Reactive energy consumption and demand logs</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {((defaultCategoryFilter === 'bi_directional_three_phase_whole' || defaultCategoryFilter === 'bi_directional_ct_pt') ? importKwhPeak.trim() !== '' : kwhPeak.trim() !== '') && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Complete</span>
                )}
                {activeStep === 3 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            <div className={`${activeStep === 3 ? 'p-4 sm:p-5 space-y-4' : 'hidden'} animate-in fade-in duration-200`}>
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
              ) : (defaultCategoryFilter === 'bi_directional_three_phase_whole' || defaultCategoryFilter === 'bi_directional_ct_pt') ? (
                <div className="space-y-6">
                  {/* Import Readings */}
                  <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <h5 className="text-[11px] font-black uppercase text-amber-950 dark:text-amber-400 tracking-wider">1 - Import Readings</h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KWH Peak *</label>
                        <input
                          type="text"
                          value={importKwhPeak}
                          onChange={(e) => setImportKwhPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KWH Off Peak *</label>
                        <input
                          type="text"
                          value={importKwhOffPeak}
                          onChange={(e) => setImportKwhOffPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KVARH Peak *</label>
                        <input
                          type="text"
                          value={importKvarhPeak}
                          onChange={(e) => setImportKvarhPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KVARH Off Peak *</label>
                        <input
                          type="text"
                          value={importKvarhOffPeak}
                          onChange={(e) => setImportKvarhOffPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">MDI Peak * (kW)</label>
                        <input
                          type="text"
                          value={importMdiPeak}
                          onChange={(e) => setImportMdiPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg font-black text-amber-950 dark:text-amber-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">MDI Off Peak * (kW)</label>
                        <input
                          type="text"
                          value={importMdiOffPeak}
                          onChange={(e) => setImportMdiOffPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg font-black text-amber-950 dark:text-amber-300"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Export Readings */}
                  <div className="p-4 bg-rose-50/40 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <h5 className="text-[11px] font-black uppercase text-rose-950 dark:text-rose-400 tracking-wider">2 - Export Readings</h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KWH Peak *</label>
                        <input
                          type="text"
                          value={exportKwhPeak}
                          onChange={(e) => setExportKwhPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KWH Off Peak *</label>
                        <input
                          type="text"
                          value={exportKwhOffPeak}
                          onChange={(e) => setExportKwhOffPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KVARH Peak *</label>
                        <input
                          type="text"
                          value={exportKvarhPeak}
                          onChange={(e) => setExportKvarhPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">KVARH Off Peak *</label>
                        <input
                          type="text"
                          value={exportKvarhOffPeak}
                          onChange={(e) => setExportKvarhOffPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">MDI Peak * (kW)</label>
                        <input
                          type="text"
                          value={exportMdiPeak}
                          onChange={(e) => setExportMdiPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-lg font-black text-rose-950 dark:text-rose-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">MDI Off Peak * (kW)</label>
                        <input
                          type="text"
                          value={exportMdiOffPeak}
                          onChange={(e) => setExportMdiOffPeak(e.target.value)}
                          className="w-full text-xs p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-lg font-black text-rose-950 dark:text-rose-300"
                          required
                        />
                      </div>
                    </div>
                  </div>
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

              {/* Navigation Actions for Step 3 */}
              <div className="flex justify-between pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 select-none cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isBiDirectional = defaultCategoryFilter === 'bi_directional_three_phase_whole' || defaultCategoryFilter === 'bi_directional_ct_pt';
                    if (isBiDirectional) {
                      if (importKwhPeak.trim() === '' || exportKwhPeak.trim() === '') {
                        setFormError('Please specify both Import and Export main active registers (kWh Peak) to proceed.');
                        return;
                      }
                    } else if (kwhPeak.trim() === '') {
                      setFormError('Please specify the main active register (kWh Peak/Final) to proceed.');
                      return;
                    }
                    setFormError('');
                    setActiveStep(4);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-sm select-none cursor-pointer"
                >
                  Continue to Accuracy Test
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* STEP 4: TARGET ACCURACY BENCHMARK AUDIT */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveStep(activeStep === 4 ? 0 : 4)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>IV</span>
                <div>
                  <h3 className="text-xs font-black uppercase text-indigo-950 dark:text-white leading-tight">IV. Target Accuracy Benchmark Audit</h3>
                  <p className="text-[9px] text-slate-400 leading-none mt-0.5 font-semibold">Load, voltage, current and recorded error calibration metrics</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {accuracyPercentage.trim() !== '' && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Complete</span>
                )}
                {activeStep === 4 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            <div className={`${activeStep === 4 ? 'p-4 sm:p-5 space-y-4' : 'hidden'} animate-in fade-in duration-200`}>
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Applied Current *</label>
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Decision Benchmark of Meter</label>
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

              {/* Navigation Actions for Step 4 */}
              <div className="flex justify-between pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 select-none cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (accuracyPercentage.trim() === '' || errorPercentage.trim() === '') {
                      setFormError('Please fill in Accuracy Registered % and Recorded Error % before continuing.');
                      return;
                    }
                    setFormError('');
                    setActiveStep(5);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-sm select-none cursor-pointer"
                >
                  Continue to Abuse Map
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* STEP 5: PHYSICAL & ELECTRICAL ABUSE DISCREPANCIES & PHOTOGRAPHIC EVIDENCE */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveStep(activeStep === 5 ? 0 : 5)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 5 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>V</span>
                <div>
                  <h3 className="text-xs font-black uppercase text-indigo-950 dark:text-white leading-tight">V. Physical & Electrical Abuse & Photos</h3>
                  <p className="text-[9px] text-slate-400 leading-none mt-0.5 font-semibold">Deficiency mapping, auxiliary CT params and camera evidence</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(discrepancies.length > 0 || otherDiscrepancyRemarks.trim() !== '' || nameplatePhotoUrl !== undefined) && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Configured</span>
                )}
                {activeStep === 5 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            <div className={`${activeStep === 5 ? 'p-4 sm:p-5 space-y-4' : 'hidden'} animate-in fade-in duration-200`}>
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

            {(defaultCategoryFilter === 'three_phase_ct' || defaultCategoryFilter === 'three_phase_ct_pt') && (
              <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-700" />
                    <div>
                      <h4 className="text-sm font-black text-indigo-950 uppercase tracking-tight">Two-Page Report Parameters (CT operated Benches)</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Inputs below map to the official two-page Checking Performa utilized by Mardan Circle.</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-805 font-bold px-2 py-0.5 rounded uppercase">M&T Mardan Circle</span>
                </div>

                {/* Sub-section 1: Service details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Sanctioned Load</label>
                    <input type="text" value={sanctionLoad} onChange={(e) => setSanctionLoad(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Connected Load</label>
                    <input type="text" value={connectedLoad} onChange={(e) => setConnectedLoad(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Transformer Capacity</label>
                    <input type="text" value={transformerCapacity} onChange={(e) => setTransformerCapacity(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Multiplying Factor (MF)</label>
                    <input type="text" value={multiplyingFactor} onChange={(e) => setMultiplyingFactor(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Installed CT Ratio</label>
                    <input type="text" value={installedCtsRatio} onChange={(e) => setInstalledCtsRatio(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Marks of Sealing Plier</label>
                    <input type="text" value={marksOfSealingPlier} onChange={(e) => setMarksOfSealingPlier(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dashed border-slate-200 pt-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Checking Result (A) Slow %</label>
                    <input type="text" value={resultsCheckingSlow} onChange={(e) => setResultsCheckingSlow(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold text-rose-700 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Checking Result (B) Fast %</label>
                    <input type="text" value={resultsCheckingFast} onChange={(e) => setResultsCheckingFast(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold text-blue-700 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Checking Result (C) Correct %</label>
                    <input type="text" value={resultsCheckingCorrect} onChange={(e) => setResultsCheckingCorrect(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold text-emerald-700 font-mono" />
                  </div>
                </div>

                {/* Sub-section 2: TOU Table Import/Export inputs */}
                <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
                  <span className="font-extrabold text-[10.5px] uppercase tracking-wide text-indigo-950 block">1. Import & Export TOU Meter Index Readings (Current Meter)</span>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left font-mono text-[10.5px] shadow-inner divide-y divide-slate-205">
                      <thead className="bg-indigo-50/70 text-indigo-950 font-bold">
                        <tr>
                          <th className="p-2 text-slate-700 font-sans">Index Type</th>
                          <th className="p-2">Import Total</th>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <th className="p-2">Export Total</th>}
                          <th className="p-2">Import T-1</th>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <th className="p-2">Export T-1</th>}
                          <th className="p-2">Import T-2</th>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <th className="p-2">Export T-2</th>}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        <tr>
                          <td className="p-2 font-bold font-sans">KWH</td>
                          <td className="p-1"><input type="text" value={kwhImportTotal} onChange={(e) => setKwhImportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs font-bold" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={kwhExportTotal} onChange={(e) => setKwhExportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={kwhImportT1} onChange={(e) => setKwhImportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={kwhExportT1} onChange={(e) => setKwhExportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={kwhImportT2} onChange={(e) => setKwhImportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={kwhExportT2} onChange={(e) => setKwhExportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-sans">KVARH</td>
                          <td className="p-1"><input type="text" value={kvarhImportTotal} onChange={(e) => setKvarhImportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs font-bold" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={kvarhExportTotal} onChange={(e) => setKvarhExportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={kvarhImportT1} onChange={(e) => setKvarhImportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={kvarhExportT1} onChange={(e) => setKvarhExportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={kvarhImportT2} onChange={(e) => setKvarhImportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={kvarhExportT2} onChange={(e) => setKvarhExportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-sans">MDI</td>
                          <td className="p-1"><input type="text" value={mdiImportTotal} onChange={(e) => setmdiImportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs font-bold" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={mdiExportTotal} onChange={(e) => setmdiExportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={mdiImportT1} onChange={(e) => setmdiImportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={mdiExportT1} onChange={(e) => setmdiExportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={mdiImportT2} onChange={(e) => setmdiImportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={mdiExportT2} onChange={(e) => setmdiExportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-sans">Sum</td>
                          <td className="p-1"><input type="text" value={sumImportTotal} onChange={(e) => setSumImportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs font-bold" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={sumExportTotal} onChange={(e) => setSumExportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={sumImportT1} onChange={(e) => setSumImportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={sumExportT1} onChange={(e) => setSumExportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={sumImportT2} onChange={(e) => setSumImportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={sumExportT2} onChange={(e) => setSumExportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                        </tr>
                        <tr>
                          <td className="p-2 font-bold font-sans">Reset No.</td>
                          <td className="p-1"><input type="text" value={resetImportTotal} onChange={(e) => setResetImportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs font-bold" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={resetExportTotal} onChange={(e) => setResetExportTotal(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={resetImportT1} onChange={(e) => setResetImportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={resetExportT1} onChange={(e) => setResetExportT1(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                          <td className="p-1"><input type="text" value={resetImportT2} onChange={(e) => setResetImportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>
                          {defaultCategoryFilter !== 'three_phase_ct_pt' && defaultCategoryFilter !== 'three_phase_ct' && <td className="p-1"><input type="text" value={resetExportT2} onChange={(e) => setResetExportT2(e.target.value)} className="w-full p-1 border border-slate-200 rounded text-center text-xs" /></td>}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-section 3: Sealing slips */}
                <div className="border-t border-dashed border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <span className="font-extrabold text-[10.5px] uppercase tracking-wide text-indigo-950 block">2. Sealing Slips (Currently Installed)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">Body Slip No</label>
                        <input type="text" value={touBody} onChange={(e) => setTouBody(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">T/Cover Slip No</label>
                        <input type="text" value={touTcover} onChange={(e) => setTouTcover(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">SIM Mobile No</label>
                        <input type="text" value={touSimNo} onChange={(e) => setTouSimNo(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">MSB Box Seal No</label>
                        <input type="text" value={touMsb} onChange={(e) => setTouMsb(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">MSB Glass Slip No</label>
                        <input type="text" value={touMsbGlass} onChange={(e) => setTouMsbGlass(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">SIM ID / ICCID</label>
                        <input type="text" value={touSimId} onChange={(e) => setTouSimId(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="font-extrabold text-[10.5px] uppercase tracking-wide text-indigo-950 block">3. Sealing Slips (Removed)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">Body Slip No</label>
                        <input type="text" value={removedTouBody} onChange={(e) => setRemovedTouBody(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">T/Cover Slip No</label>
                        <input type="text" value={removedTouTcover} onChange={(e) => setRemovedTouTcover(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">MSB Box Seal No</label>
                        <input type="text" value={removedTouMsb} onChange={(e) => setRemovedTouMsb(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 uppercase">MSB Glass Slip No</label>
                        <input type="text" value={removedTouMsbGlass} onChange={(e) => setRemovedTouMsbGlass(e.target.value)} className="w-full text-xs p-2 bg-white border border-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-section 4: Removed meters particulars (AMR & Backup) */}
                <div className="border-t border-dashed border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AMR Particulars */}
                  <div className="space-y-3.5 bg-white p-4 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-[10.5px] uppercase tracking-wide text-indigo-950 block">4. Removed AMR Meter Particulars</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Meter Number</label>
                        <input type="text" value={removedAmrNo} onChange={(e) => setRemovedAmrNo(e.target.value)} className="w-full text-[11px] p-2 border border-slate-200 rounded" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Manufacturer</label>
                        <input type="text" value={removedAmrMake} onChange={(e) => setRemovedAmrMake(e.target.value)} className="w-full text-[11px] p-2 border border-slate-200 rounded" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Amperage (Amps)</label>
                        <input type="text" value={removedAmrAmps} onChange={(e) => setRemovedAmrAmps(e.target.value)} className="w-full text-[11px] p-2 border border-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-2 text-[10px] uppercase font-mono">
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">Kwh Reading</label>
                        <input type="text" value={removedAmrKwh} onChange={(e) => setRemovedAmrKwh(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded" />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">Kvarh Reading</label>
                        <input type="text" value={removedAmrKvarh} onChange={(e) => setRemovedAmrKvarh(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">MDI (kW)</label>
                        <input type="text" value={removedAmrMdi} onChange={(e) => setRemovedAmrMdi(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">Sum Accum.</label>
                        <input type="text" value={removedAmrSum} onChange={(e) => setRemovedAmrSum(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[8.5px] text-slate-400 font-sans">Reset No count</label>
                        <input type="text" value={removedAmrResetNo} onChange={(e) => setRemovedAmrResetNo(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                    </div>
                  </div>

                  {/* Backup Meter Particulars */}
                  <div className="space-y-3.5 bg-white p-4 rounded-lg border border-slate-200">
                    <span className="font-extrabold text-[10.5px] uppercase tracking-wide text-indigo-950 block">5. Removed Backup Meter Particulars</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Meter Number</label>
                        <input type="text" value={removedBackupNo} onChange={(e) => setRemovedBackupNo(e.target.value)} className="w-full text-[11px] p-2 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Manufacturer</label>
                        <input type="text" value={removedBackupMake} onChange={(e) => setRemovedBackupMake(e.target.value)} className="w-full text-[11px] p-2 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Amperage (Amps)</label>
                        <input type="text" value={removedBackupAmps} onChange={(e) => setRemovedBackupAmps(e.target.value)} className="w-full text-[11px] p-2 border border-slate-200 rounded text-slate-900" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-2 text-[10px] uppercase font-mono">
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">Kwh Reading</label>
                        <input type="text" value={removedBackupKwh} onChange={(e) => setRemovedBackupKwh(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">Kvarh Reading</label>
                        <input type="text" value={removedBackupKvarh} onChange={(e) => setRemovedBackupKvarh(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">MDI (kW)</label>
                        <input type="text" value={removedBackupMdi} onChange={(e) => setRemovedBackupMdi(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-400 font-sans">Sum Accum.</label>
                        <input type="text" value={removedBackupSum} onChange={(e) => setRemovedBackupSum(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[8.5px] text-slate-400 font-sans">Reset No count</label>
                        <input type="text" value={removedBackupResetNo} onChange={(e) => setRemovedBackupResetNo(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded text-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-section 5: Removed CT Ratio */}
                <div className="border-t border-dashed border-slate-200 pt-4 max-w-xs">
                  <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">Removed CTs Ratio (16)</label>
                  <input type="text" value={removedCtsRatio} onChange={(e) => setRemovedCtsRatio(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-bold text-slate-900" />
                </div>
              </div>
            )}

            {/* Sec V-B: Nameplate Image Capture */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">V-B. Photographic Evidence</h4>
              </div>
              <div className="max-w-md">
                <PhotoCapture 
                  label="Nameplate / Equipment Photo (Optional)"
                  photoUrl={nameplatePhotoUrl}
                  onChange={setNameplatePhotoUrl}
                />
              </div>
            </div>

            {/* Navigation Actions for Step 5 */}
            <div className="flex justify-between pt-3 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 select-none cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setActiveStep(6);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 shadow-sm select-none cursor-pointer"
              >
                Continue to Certification
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 6: CERTIFICATION & SIGN-OFF SEAL AUTHORITIES */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveStep(activeStep === 6 ? 0 : 6)}
            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-left select-none border-b border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                activeStep === 6 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>VI</span>
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-950 dark:text-white leading-tight">VI. Certification & Sign-off</h3>
                <p className="text-[9px] text-slate-400 leading-none mt-0.5 font-semibold">Authorized tester signature and supervisor countersign</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {(checkedBySignature !== undefined || counterSignedBySignature !== undefined) && (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Signed</span>
              )}
              {activeStep === 6 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </button>

          <div className={`${activeStep === 6 ? 'p-4 sm:p-5 space-y-4' : 'hidden'} animate-in fade-in duration-200`}>
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
                  <div className="pt-2">
                    <SignaturePad
                      label="Checker Signature Capture"
                      onEnd={(data) => setCheckedBySignature(data)}
                      onClear={() => setCheckedBySignature(undefined)}
                      initialDataUrl={checkedBySignature}
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
                  <div className="pt-2">
                    <SignaturePad
                      label="Manager Signature Capture"
                      onEnd={(data) => setCounterSignedBySignature(data)}
                      onClear={() => setCounterSignedBySignature(undefined)}
                      initialDataUrl={counterSignedBySignature}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 select-none cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 select-none cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Authorize & Sign Certificate
              </button>
            </div>
          </div>

          </form>
        </div>

      </div>

    </div>
  );
}
