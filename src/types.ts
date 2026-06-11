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
