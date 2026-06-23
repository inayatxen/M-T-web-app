/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User Roles
export type UserRole = 'administrator' | 'lab_manager' | 'testing_engineer' | 'data_entry_operator' | 'circle_supervisor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  circleCode?: string;
  password?: string;
}

// Meter Categories and Statuses
export type MeterCategory = 'single_phase' | 'three_phase_whole' | 'three_phase_ct' | 'three_phase_ct_pt' | 'smart';

export type MeterStatus = 'received' | 'pending_testing' | 'under_testing' | 'passed' | 'failed' | 'report_issued';

export type StockStatus = 'In Store' | 'Under Testing' | 'Approved' | 'Rejected' | 'Installed' | 'Scrapped';

export interface Meter {
  id: string;
  meterNumber: string;
  serialNumber: string;
  manufacturer: string;
  accuracyClass: string;
  category: MeterCategory;
  status: MeterStatus;
  stockStatus: StockStatus;
  purchaseDate: string;
  // Specific category fields
  ctRatio?: string;
  ptRatio?: string;
  // Smart meter fields
  imei?: string;
  simNumber?: string;
  simInstallStatus?: 'Pending' | 'Installed' | 'Communication Verified';
  communicationStatus?: 'Online' | 'Offline' | 'No SIM';
  signalStrength?: number; // 0 to 5 bars
  iccid?: string;
  networkProvider?: string;
  simInstalledBy?: string;
  simInstallDate?: string;
  remarks?: string;
  consumerName?: string;
  consumerAccount?: string;
  movementHistory?: {
    timestamp: string;
    fromStatus: StockStatus;
    toStatus: StockStatus;
    actor: string;
    details?: string;
  }[];
}

// Equipment Receipt Information
export interface EquipmentReceipt {
  id: string;
  receiptNumber: string;
  dateReceived: string;
  consumerAccount: string;
  consumerName: string;
  meterType: MeterCategory;
  meterNumber: string;
  serialNumber: string;
  make: string;
  receivedFrom: string;
  reasonForTesting: string;
  newOrUsed: 'New' | 'Used';
  receivedBy: string;
  remarks?: string;
  fatherName?: string;
}

// Current & Potential Transformers
export interface CTRecord {
  id: string;
  ctNumber: string;
  make: string;
  ratio: string;
  accuracyClass: string;
  dateReceived: string;
  testDate?: string;
  testResult: 'pending' | 'passed' | 'failed';
  remarks?: string;
}

export interface PTRecord {
  id: string;
  ptNumber: string;
  make: string;
  ratio: string;
  accuracyClass: string;
  dateReceived: string;
  testDate?: string;
  testResult: 'pending' | 'passed' | 'failed';
  remarks?: string;
}

// Smart Meter SIM Details (Included in Meter model, but can be managed specifically)
export interface SIMDetails {
  meterNumber: string;
  imei: string;
  iccid: string;
  simNumber: string;
  networkProvider: string;
  simInstalledBy?: string;
  installationDate?: string;
  communicationStatus: 'Pending SIM Installation' | 'SIM Installed' | 'Communication Verified';
  signalStrength: number; // 1-5
  remarks?: string;
}

// Committee Case Information
export interface CommitteeCase {
  id: string;
  caseNumber: string;
  accountNumber: string;
  consumerName: string;
  meterNumber: string;
  existingMeterDetails: string;
  newMeterDetails: string;
  reasonForCommitteeCheck: string;
  committeeMembers: string[];
  inspectionDate: string;
  findings: string;
  recommendations: string;
  approvalStatus: 'Created' | 'Inspected' | 'Testing' | 'Approved' | 'Report Issued';
}

// Meter Testing Reading Details
export interface MeterReadings {
  kwhPeak: string;
  kwhOffPeak: string;
  kvarhPeak: string;
  kvarhOffPeak: string;
  mdiPeak: string;
  mdiOffPeak: string;
}

// Meter Testing Correctness & Accuracy
export interface AccuracyTest {
  accuracyPercentage: string;
  testLoad: string; // e.g. "5A", "10A"
  testVoltage: string; // e.g. "230V"
  testCurrent: string; // e.g. "5.0 A"
  powerFactor: string; // e.g. "1.0", "0.8 Lag"
  errorPercentage: string; // e.g. "+0.25%"
  standardLimit: string; // e.g. "±1.0%"
  passFail: 'Pass' | 'Fail';
}

export interface CtPtExtraFields {
  sanctionLoad?: string;
  connectedLoad?: string;
  transformerCapacity?: string;
  multiplyingFactor?: string;
  installedCtsRatio?: string;
  marksOfSealingPlier?: string;
  resultsCheckingSlow?: string;
  resultsCheckingFast?: string;
  resultsCheckingCorrect?: string;
  
  // Security Slips
  touBody?: string;
  touTcover?: string;
  touSimNo?: string;
  touMsb?: string;
  touMsbGlass?: string;
  touSimId?: string;

  // Security Slips Removed
  removedTouBody?: string;
  removedTouTcover?: string;
  removedTouMsb?: string;
  removedTouMsbGlass?: string;

  // Removed AMR Meter
  removedAmrNo?: string;
  removedAmrMake?: string;
  removedAmrAmps?: string;
  removedAmrKwh?: string;
  removedAmrKvarh?: string;
  removedAmrMdi?: string;
  removedAmrSum?: string;
  removedAmrResetNo?: string;

  // Removed Backup Meter
  removedBackupNo?: string;
  removedBackupMake?: string;
  removedBackupAmps?: string;
  removedBackupKwh?: string;
  removedBackupKvarh?: string;
  removedBackupMdi?: string;
  removedBackupSum?: string;
  removedBackupResetNo?: string;

  removedCtsRatio?: string;

  // TOU Table (Import/Export grid)
  kwhImportTotal?: string; kwhExportTotal?: string; kwhImportT1?: string; kwhExportT1?: string; kwhImportT2?: string; kwhExportT2?: string;
  kvarhImportTotal?: string; kvarhExportTotal?: string; kvarhImportT1?: string; kvarhExportT1?: string; kvarhImportT2?: string; kvarhExportT2?: string;
  mdiImportTotal?: string; mdiExportTotal?: string; mdiImportT1?: string; mdiExportT1?: string; mdiImportT2?: string; mdiExportT2?: string;
  sumImportTotal?: string; sumExportTotal?: string; sumImportT1?: string; sumExportT1?: string; sumImportT2?: string; sumExportT2?: string;
  resetImportTotal?: string; resetExportTotal?: string; resetImportT1?: string; resetExportT1?: string; resetImportT2?: string; resetExportT2?: string;
}

// Meter Test Report Schema
export interface TestReport {
  id: string;
  reportNumber: string;
  meterId: string;
  testDate: string;
  consumerName: string;
  accountNumber: string;
  tariff: string;
  fatherName: string;
  natureOfConnection: string;
  meterNumber: string;
  meterType: MeterCategory;
  meterMake: string;
  serialNumber: string;
  installationDate: string;
  removalDate: string;
  readings: MeterReadings;
  accuracyTest: AccuracyTest;
  discrepancies: string[]; // ['Slow Meter', 'burnt', etc]
  otherDiscrepancyRemarks?: string;
  checkedBy: string;
  checkedByDesignation: string;
  counterSignedBy: string;
  counterSignedByDesignation: string;
  approvalDate: string;
  qrCodeMockUrl: string;
  ctPtExtra?: CtPtExtraFields;
}

// Audit Trail interface
export interface AuditLog {
  id: string;
  user: string;
  role: UserRole;
  timestamp: string;
  action: string;
  oldValue: string;
  newValue: string;
}

export interface CalibrationStandard {
  id: string;
  name: string;
  standardValue: string;
  multiplier: number;
}

export interface AvailableSIM {
  id?: string; // Optional database key
  simNumber: string;
  iccid: string;
  provider: string;
}
