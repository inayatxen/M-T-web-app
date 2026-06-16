/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, 
  Meter, 
  EquipmentReceipt, 
  CTRecord, 
  PTRecord, 
  CommitteeCase, 
  TestReport, 
  AuditLog, 
  CalibrationStandard 
} from '../types';

export const SEED_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Sarah Rahman',
    email: 'sarah.rahman@powercorp.com',
    role: 'lab_manager',
    designation: 'Laboratory Executive & Manager',
    circleCode: '261',
    password: 'manager123'
  },
  {
    id: 'u-2',
    name: 'Amit Kumar',
    email: 'amit.kumar@powercorp.com',
    role: 'testing_engineer',
    designation: 'Senior Testing Field Engineer',
    circleCode: '262',
    password: 'engineer123'
  },
  {
    id: 'u-3',
    name: 'Devon Miller',
    email: 'devon.miller@powercorp.com',
    role: 'administrator',
    designation: 'System Administrator',
    circleCode: '266',
    password: 'admin123'
  },
  {
    id: 'u-4',
    name: 'Priya Sharma',
    email: 'priya.sharma@powercorp.com',
    role: 'data_entry_operator',
    designation: 'Laboratory Intake Officer',
    circleCode: '263',
    password: 'operator123'
  }
];

export const SEED_METERS: Meter[] = [
  {
    id: 'm-1',
    meterNumber: 'MTR-982103',
    serialNumber: 'SN-772183-A',
    manufacturer: 'Secure Meters Ltd',
    accuracyClass: 'Class 0.5S',
    category: 'three_phase_ct',
    status: 'passed',
    stockStatus: 'Approved',
    purchaseDate: '2025-10-15',
    ctRatio: '200/5 A',
    remarks: 'Tested at full load. Error margin exceptionally narrow.'
  },
  {
    id: 'm-2',
    meterNumber: 'MTR-442183',
    serialNumber: 'SN-109281-B',
    manufacturer: 'Landis+Gyr',
    accuracyClass: 'Class 1.0',
    category: 'single_phase',
    status: 'report_issued',
    stockStatus: 'Installed',
    purchaseDate: '2026-01-12',
    remarks: 'Field replacement case, report generated.'
  },
  {
    id: 'm-3',
    meterNumber: 'MTR-552718',
    serialNumber: 'SN-991201-C',
    manufacturer: 'Hexing Electrical',
    accuracyClass: 'Class 0.2S',
    category: 'smart',
    status: 'pending_testing',
    stockStatus: 'Under Testing',
    purchaseDate: '2026-03-22',
    imei: '862091048817261',
    simNumber: '899100128312019',
    simInstallStatus: 'Pending',
    communicationStatus: 'No SIM',
    signalStrength: 0,
    remarks: 'Imported smart grid batch. Needs automated SIM testing.'
  },
  {
    id: 'm-4',
    meterNumber: 'MTR-102941',
    serialNumber: 'SN-402910-X',
    manufacturer: 'Schneider Electric',
    accuracyClass: 'Class 0.2S',
    category: 'three_phase_ct_pt',
    status: 'under_testing',
    stockStatus: 'Under Testing',
    purchaseDate: '2025-12-05',
    ctRatio: '400/5 A',
    ptRatio: '11KV/110V',
    remarks: 'Grid substation interconnection meter.'
  },
  {
    id: 'm-5',
    meterNumber: 'MTR-881290',
    serialNumber: 'SN-339218-W',
    manufacturer: 'Landis+Gyr',
    accuracyClass: 'Class 1.5',
    category: 'single_phase',
    status: 'failed',
    stockStatus: 'Rejected',
    purchaseDate: '2026-02-18',
    remarks: 'Shunt resistance burnt, recorded slow readings.'
  },
  {
    id: 'm-6',
    meterNumber: 'MTR-309128',
    serialNumber: 'SN-552817-Y',
    manufacturer: 'Itron',
    accuracyClass: 'Class 0.5S',
    category: 'smart',
    status: 'under_testing',
    stockStatus: 'In Store',
    purchaseDate: '2026-04-10',
    imei: '861009182312001',
    simNumber: '899101019283128',
    simInstallStatus: 'Installed',
    communicationStatus: 'Online',
    signalStrength: 4,
    remarks: 'SIM installed, signal strength verification active.'
  },
  {
    id: 'm-7',
    meterNumber: 'MTR-772183',
    serialNumber: 'SN-901828-M',
    manufacturer: 'Elster',
    accuracyClass: 'Class 1.0',
    category: 'three_phase_whole',
    status: 'received',
    stockStatus: 'In Store',
    purchaseDate: '2026-05-11',
    remarks: 'Domestic commercial meter replacement.'
  },
  {
    id: 'm-8',
    meterNumber: 'MTR-661029',
    serialNumber: 'SN-112390-P',
    manufacturer: 'Secure Meters Ltd',
    accuracyClass: 'Class 0.2S',
    category: 'smart',
    status: 'passed',
    stockStatus: 'Approved',
    purchaseDate: '2026-05-20',
    imei: '862091001239102',
    simNumber: '899144029103982',
    simInstallStatus: 'Communication Verified',
    communicationStatus: 'Online',
    signalStrength: 5,
    remarks: 'Integrated cell tower verification successful.'
  }
];

export const SEED_RECEIPTS: EquipmentReceipt[] = [
  {
    id: 'r-1',
    receiptNumber: 'REC-2026-0402',
    dateReceived: '2026-04-02',
    consumerAccount: '12093847210928',
    consumerName: 'Blue Ridge Textiles Ltd',
    meterType: 'three_phase_ct_pt',
    meterNumber: 'MTR-102941',
    serialNumber: 'SN-402910-X',
    make: 'Schneider Electric',
    receivedFrom: 'Sub-Division-III Zone-C',
    reasonForTesting: 'MDI Accuracy check on seasonal tariff shift',
    newOrUsed: 'Used',
    receivedBy: 'Priya Sharma',
    remarks: 'Secondary terminals box seal was reported open.'
  },
  {
    id: 'r-2',
    receiptNumber: 'REC-2026-0511',
    dateReceived: '2026-05-11',
    consumerAccount: '14221190281726',
    consumerName: 'Dr. Sameer Al-Faisal',
    meterType: 'three_phase_whole',
    meterNumber: 'MTR-772183',
    serialNumber: 'SN-901828-M',
    make: 'Elster',
    receivedFrom: 'Commercial Line Sub-Grid-2',
    reasonForTesting: 'High billing dispute raised by customer',
    newOrUsed: 'Used',
    receivedBy: 'Priya Sharma',
    remarks: 'Terminal lid found slightly dusty but intact.'
  },
  {
    id: 'r-3',
    receiptNumber: 'REC-2026-0610',
    dateReceived: '2026-06-10',
    consumerAccount: '11029182736450',
    consumerName: 'Alpha Tech Parks Inc',
    meterType: 'smart',
    meterNumber: 'MTR-309128',
    serialNumber: 'SN-552817-Y',
    make: 'Itron',
    receivedFrom: 'System Operations Division',
    reasonForTesting: 'SIM communication drop investigation',
    newOrUsed: 'Used',
    receivedBy: 'Priya Sharma',
    remarks: 'SIM slot appears slightly oxidized.'
  }
];

export const SEED_CTS: CTRecord[] = [
  {
    id: 'ct-1',
    ctNumber: 'CT-2026-001',
    make: 'Siemens India',
    ratio: '200/5 A',
    accuracyClass: '0.2S',
    dateReceived: '2026-04-15',
    testDate: '2026-04-18',
    testResult: 'passed',
    remarks: 'Ratios match current curves closely. Phase angle error within limit.'
  },
  {
    id: 'ct-2',
    ctNumber: 'CT-2026-002',
    make: 'ABB Transformers',
    ratio: '400/5 A',
    accuracyClass: '0.5',
    dateReceived: '2026-05-20',
    testDate: '2026-05-22',
    testResult: 'failed',
    remarks: 'Secondary winding resistance exceeded limits. Winding malfunction.'
  },
  {
    id: 'ct-3',
    ctNumber: 'CT-2026-003',
    make: 'Siemens India',
    ratio: '150/5 A',
    accuracyClass: '0.2S',
    dateReceived: '2026-06-02',
    testResult: 'pending',
    remarks: 'Initial optical checks pass. Standard impedance load check pending.'
  }
];

export const SEED_PTS: PTRecord[] = [
  {
    id: 'pt-1',
    ptNumber: 'PT-2026-001',
    make: 'CG Power',
    ratio: '11000/110 V',
    accuracyClass: '0.2',
    dateReceived: '2026-04-22',
    testDate: '2026-04-24',
    testResult: 'passed',
    remarks: 'No dielectric breakdown observed during high voltage test.'
  },
  {
    id: 'pt-2',
    ptNumber: 'PT-2026-002',
    make: 'Schneider Electric',
    ratio: '33000/110 V',
    accuracyClass: '0.5',
    dateReceived: '2026-05-18',
    testDate: '2026-05-21',
    testResult: 'passed',
    remarks: 'Ratio error matches certification limits neatly.'
  },
  {
    id: 'pt-3',
    ptNumber: 'PT-2026-003',
    make: 'CG Power',
    ratio: '11000/110 V',
    accuracyClass: '0.2',
    dateReceived: '2026-06-05',
    testResult: 'pending',
    remarks: 'Awaiting high voltage laboratory slot allocation.'
  }
];

export const SEED_COMMITTEE_CASES: CommitteeCase[] = [
  {
    id: 'cc-1',
    caseNumber: 'CASE-2026-101',
    accountNumber: '12093847210928',
    consumerName: 'Blue Ridge Textiles Ltd',
    meterNumber: 'MTR-102941',
    existingMeterDetails: 'Bulk load active commercial connection. Inconsistent peak readings reported.',
    newMeterDetails: 'MTR-982103 (Three Phase CT Operated)',
    reasonForCommitteeCheck: 'Inconsistencies between primary meter calculations and check meter logs',
    committeeMembers: ['Er. Sarah Rahman (Convener)', 'Er. Amit Kumar (Member Sec)', 'Shri Prem Chand (Accounts Officer)'],
    inspectionDate: '2026-05-14',
    findings: 'Found current loop terminal wires slightly loose on phase Y, causing an artificial dampening of recorded current by ~12.3%.',
    recommendations: 'Recommend immediate substitution with newly tested class 0.5S CT operated meter. Instruct field division to seal secondary terminals securely.',
    approvalStatus: 'Approved'
  },
  {
    id: 'cc-2',
    caseNumber: 'CASE-2026-102',
    accountNumber: '11029182736450',
    consumerName: 'Alpha Tech Parks Inc',
    meterNumber: 'MTR-309128',
    existingMeterDetails: 'Smart industrial feeder connection, frequent communication losses.',
    newMeterDetails: 'MTR-661029 (Smart Meter Premium Class 0.2S)',
    reasonForCommitteeCheck: 'Extended telemetry gaps causing estimated MDI billing penalties',
    committeeMembers: ['Er. Sarah Rahman (Convener)', 'Shri K. L. Mehta (IT Head)', 'Er. Amit Kumar (Member)'],
    inspectionDate: '2026-06-08',
    findings: 'Physical cellular antenna inside the client station was shielded by heavy machinery steel bars.',
    recommendations: 'Shift antenna position using outdoor low-loss RF feeder cables. Check connection status before completing handover.',
    approvalStatus: 'Testing'
  }
];

export const SEED_REPORTS: TestReport[] = [
  {
    id: 'tr-1',
    reportNumber: 'REP-2026-0012',
    meterId: 'm-2',
    testDate: '2026-05-14',
    consumerName: 'Dr. Sameer Al-Faisal',
    accountNumber: '14221190281726',
    tariff: 'Commercial B3-A',
    fatherName: 'Ibrahim Al-Faisal',
    natureOfConnection: 'General Commercial Sub-Phase',
    meterNumber: 'MTR-442183',
    meterType: 'single_phase',
    meterMake: 'Landis+Gyr',
    serialNumber: 'SN-109281-B',
    installationDate: '2026-01-15',
    removalDate: '2026-05-11',
    readings: {
      kwhPeak: '12845.2',
      kwhOffPeak: '22819.5',
      kvarhPeak: '419.1',
      kvarhOffPeak: '782.3',
      mdiPeak: '11.8',
      mdiOffPeak: '7.2'
    },
    accuracyTest: {
      accuracyPercentage: '99.85%',
      testLoad: '10 A',
      testVoltage: '230 V',
      testCurrent: '10.01 A',
      powerFactor: '1.00',
      errorPercentage: '-0.15%',
      standardLimit: '±1.0%',
      passFail: 'Pass'
    },
    discrepancies: ['No Discrepancy'],
    checkedBy: 'Amit Kumar',
    checkedByDesignation: 'Senior Testing Field Engineer',
    counterSignedBy: 'Sarah Rahman',
    counterSignedByDesignation: 'Laboratory Executive & Manager',
    approvalDate: '2026-05-15',
    qrCodeMockUrl: 'https://ais-dev-p2jiljth7d7ctdic44bdzp-883555035715.asia-east1.run.app/verify/REP-2026-0012'
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    user: 'Sarah Rahman',
    role: 'lab_manager',
    timestamp: '2026-06-11T07:22:15Z',
    action: 'Approved Dispute Case Recommendation',
    oldValue: 'Status: Received / Inspection Done',
    newValue: 'Status: Case Approved for Meter Substitution'
  },
  {
    id: 'log-2',
    user: 'Amit Kumar',
    role: 'testing_engineer',
    timestamp: '2026-06-11T06:14:02Z',
    action: 'Updated Testing Results for MTR-982103',
    oldValue: 'Status: Pending Testing',
    newValue: 'Status: Passed. Recorded Error margin: +0.25%'
  },
  {
    id: 'log-3',
    user: 'Priya Sharma',
    role: 'data_entry_operator',
    timestamp: '2026-06-10T14:48:33Z',
    action: 'Registered Incoming Equipment Receipt REC-2026-0610',
    oldValue: 'N/A: New Equipment',
    newValue: 'Registered MTR-309128 from Consumer 11029182736450'
  }
];

export const SEED_CALIBRATION_STANDARDS: CalibrationStandard[] = [
  {
    id: 'std-1',
    name: 'Class 0.2S High Precision Secondary Standard Meter',
    standardValue: 'Accuracy baseline ±0.05%',
    multiplier: 1.0001
  },
  {
    id: 'std-2',
    name: 'Standard CT Comparator Bench Class 0.05',
    standardValue: '100% Phase correction factor',
    multiplier: 0.9998
  }
];
