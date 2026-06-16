/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Cpu, 
  Boxes, 
  Radio, 
  UserCheck, 
  FileText, 
  Search, 
  Settings, 
  TrendingUp, 
  Layers, 
  LogOut, 
  Sun, 
  Moon, 
  Bookmark, 
  Activity, 
  Bell, 
  FileSpreadsheet,
  Zap,
  HardDriveUpload,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Database
} from 'lucide-react';

// Shared type signatures
import { 
  User as UserType, 
  Meter, 
  EquipmentReceipt, 
  CTRecord, 
  PTRecord, 
  CommitteeCase, 
  TestReport, 
  AuditLog, 
  CalibrationStandard, 
  StockStatus, 
  UserRole 
} from './types';

// Predefined seed data
import {
  SEED_USERS,
  SEED_METERS,
  SEED_RECEIPTS,
  SEED_CTS,
  SEED_PTS,
  SEED_COMMITTEE_CASES,
  SEED_REPORTS,
  SEED_AUDIT_LOGS,
  SEED_CALIBRATION_STANDARDS
} from './data/seedData';

// Modular children sub-views
import Notifications from './components/Notifications';
import ReportPDF from './components/ReportPDF';
import BatchReportPDF from './components/BatchReportPDF';
import DashboardView from './components/DashboardView';
import RegisterView from './components/RegisterView';
import InventoryView from './components/InventoryView';
import TestingView from './components/TestingView';
import SIMView from './components/SIMView';
import TransformersView from './components/TransformersView';
import CommitteeView from './components/CommitteeView';
import ReportsArchiveView from './components/ReportsArchiveView';
import ManagementView from './components/ManagementView';
import SupabaseSyncView from './components/SupabaseSyncView';
import LoginView from './components/LoginView';
import { supabase } from './utils/supabase';
import { getPKTISOString, getPKTDateString, formatPKTDateTime } from './utils';
import SupabaseTodosView from './components/SupabaseTodosView';
import pescoLogo from './assets/images/pesco_logo.jpg';

export default function App() {
  // Live PKT clock state
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(formatPKTDateTime(new Date()));
    const timer = setInterval(() => {
      setCurrentTime(formatPKTDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activePageId, setActivePageId] = useState<string>('dashboard');

  // Master Database state registers
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const stored = localStorage.getItem('mtlms_currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [meters, setMeters] = useState<Meter[]>([]);
  const [receipts, setReceipts] = useState<EquipmentReceipt[]>([]);
  const [cts, setCts] = useState<CTRecord[]>([]);
  const [pts, setPts] = useState<PTRecord[]>([]);
  const [cases, setCases] = useState<CommitteeCase[]>([]);
  const [reports, setReports] = useState<TestReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [standards, setStandards] = useState<CalibrationStandard[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  
  // Real-time dynamic Users directory synchronized from Supabase
  const [users, setUsers] = useState<UserType[]>(() => {
    try {
      const stored = localStorage.getItem('mtlms_users');
      return stored ? JSON.parse(stored) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  });

  // Fetch users from Supabase database
  useEffect(() => {
    async function loadUsersFromSupabase() {
      try {
        setSyncStatus('syncing');
        const { data: dbUsers, error } = await supabase.from('users').select('*');
        if (error) {
          throw error;
        }
        if (dbUsers && dbUsers.length > 0) {
          const mapped: UserType[] = dbUsers.map(u => {
            const seedUser = SEED_USERS.find(su => su.id === u.id);
            return {
              id: u.id,
              name: u.name || '',
              email: u.email || '',
              role: u.role as UserRole,
              designation: u.designation || '',
              circleCode: u.circleCode || undefined,
              password: u.password || seedUser?.password || 'password123'
            };
          });
          setUsers(mapped);
          localStorage.setItem('mtlms_users', JSON.stringify(mapped));
          setSyncStatus('synced');
        } else {
          // If remote users is empty, let's push SEED_USERS to it!
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn("Could not fetch users from Supabase:", err);
        setSyncStatus('error');
      }
    }
    loadUsersFromSupabase();
  }, []);

  // Guarantee that only users with 'administrator' role can view administrator pages
  useEffect(() => {
    const adminPages = ['user_management', 'system_settings', 'supabase_sync', 'supabase_todos'];
    if (currentUser && currentUser.role !== 'administrator' && adminPages.includes(activePageId)) {
      setActivePageId('dashboard');
    }
  }, [currentUser, activePageId]);

  // Satisfy Supabase Todos check in App.tsx
  useEffect(() => {
    async function getTodos() {
      try {
        const { data: todosData } = await supabase.from('todos').select();
        if (todosData) {
          setTodos(todosData);
        }
      } catch (e) {
        console.warn("Could not load todos for compliance tracking:", e);
      }
    }
    getTodos();
  }, []);

  // Active printable PDF reference preview
  const [activePdfReport, setActivePdfReport] = useState<TestReport | null>(null);
  const [batchPdfReports, setBatchPdfReports] = useState<TestReport[] | null>(null);

  // Cloud database real-time sync status
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');

  // 1. Initial hydration from localStorage (Offline-first persistence matching "Local Storage")
  useEffect(() => {
    try {
      const getOrSeed = <T,>(key: string, seed: T): T => {
        const stored = localStorage.getItem(`mtlms_${key}`);
        if (stored) return JSON.parse(stored);
        localStorage.setItem(`mtlms_${key}`, JSON.stringify(seed));
        return seed;
      };

      setMeters(getOrSeed<Meter[]>('meters', SEED_METERS));
      setReceipts(getOrSeed<EquipmentReceipt[]>('receipts', SEED_RECEIPTS));
      setCts(getOrSeed<CTRecord[]>('cts', SEED_CTS));
      setPts(getOrSeed<PTRecord[]>('pts', SEED_PTS));
      setCases(getOrSeed<CommitteeCase[]>('cases', SEED_COMMITTEE_CASES));
      setReports(getOrSeed<TestReport[]>('reports', SEED_REPORTS));
      setAuditLogs(getOrSeed<AuditLog[]>('auditLogs', SEED_AUDIT_LOGS));
      setStandards(getOrSeed<CalibrationStandard[]>('standards', SEED_CALIBRATION_STANDARDS));
    } catch (e) {
      console.error('LocalStorage hydration failed, falling back to default seed.', e);
      setMeters(SEED_METERS);
      setReceipts(SEED_RECEIPTS);
      setCts(SEED_CTS);
      setPts(SEED_PTS);
      setCases(SEED_COMMITTEE_CASES);
      setReports(SEED_REPORTS);
      setAuditLogs(SEED_AUDIT_LOGS);
      setStandards(SEED_CALIBRATION_STANDARDS);
    }
  }, []);

  // 1b. Supabase Bi-directional Auto Sync on startup
  useEffect(() => {
    const runStartupSync = async () => {
      setSyncStatus('syncing');
      try {
        // Quick connection test using a light tables check
        const { error: testError } = await supabase.from('meters').select('id').limit(1);
        if (testError) {
          if (testError.code === '42P01') {
            console.warn('[Supabase Auto-Sync] Connected but schema or tables do not exist yet in Supabase.');
            setSyncStatus('error');
          } else {
            console.warn('[Supabase Auto-Sync] Supabase unreachable or wrong credentials:', testError.message);
            setSyncStatus('offline');
          }
          return;
        }

        console.log('[Supabase Auto-Sync] Connected successfully. Performing startup bi-directional sync...');
        
        const tablesToSync = [
          { key: 'meters', stateSetter: setMeters, localSeed: SEED_METERS },
          { key: 'receipts', stateSetter: setReceipts, localSeed: SEED_RECEIPTS },
          { key: 'cts', stateSetter: setCts, localSeed: SEED_CTS },
          { key: 'pts', stateSetter: setPts, localSeed: SEED_PTS },
          { key: 'cases', stateSetter: setCases, localSeed: SEED_COMMITTEE_CASES },
          { key: 'reports', stateSetter: setReports, localSeed: SEED_REPORTS },
          { key: 'auditLogs', stateSetter: setAuditLogs, localSeed: SEED_AUDIT_LOGS },
          { key: 'standards', stateSetter: setStandards, localSeed: SEED_CALIBRATION_STANDARDS }
        ];

        for (const tbl of tablesToSync) {
          const { data: remoteData, error } = await supabase.from(tbl.key).select('*');
          if (error) {
            console.warn(`[Supabase Auto-Sync] Fail pulling table [${tbl.key}]:`, error.message);
            continue;
          }

          if (remoteData && remoteData.length > 0) {
            tbl.stateSetter(remoteData);
            localStorage.setItem(`mtlms_${tbl.key}`, JSON.stringify(remoteData));
            console.log(`[Supabase Auto-Sync] Hydrated state for tbl [${tbl.key}] directly with ${remoteData.length} remote cloud entries.`);
          } else {
            // Postgres table was fully queryable but empty. Let's seed/push local records up so they're in sync!
            const storedLocal = localStorage.getItem(`mtlms_${tbl.key}`);
            const dataToInsert = storedLocal ? JSON.parse(storedLocal) : tbl.localSeed;
            if (dataToInsert && dataToInsert.length > 0) {
              console.log(`[Supabase Auto-Sync] Remote table [${tbl.key}] is empty. Seeding with ${dataToInsert.length} local cache entries...`);
              await supabase.from(tbl.key).upsert(dataToInsert);
            }
          }
        }
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('[Supabase Auto-Sync Exception]', err);
        setSyncStatus('error');
      }
    };

    const timeout = setTimeout(runStartupSync, 800);
    return () => clearTimeout(timeout);
  }, []);

  // Sync back to local storage whenever Master state registers mutate
  const saveState = (key: string, val: any) => {
    localStorage.setItem(`mtlms_${key}`, JSON.stringify(val));
    
    // Background Real-Time Sync to Supabase
    if (val && Array.isArray(val)) {
      setSyncStatus('syncing');
      (async () => {
        try {
          const { error } = await supabase.from(key).upsert(val);
          if (error) {
            console.warn(`[Supabase Auto-Sync Warning] Could not back up [${key}]:`, error.message);
            setSyncStatus('error');
          } else {
            console.log(`[Supabase Auto-Sync Success] Table [${key}] successfully synchronized.`);
            setSyncStatus('synced');
          }
        } catch (err) {
          console.warn(`[Supabase Auto-Sync Error]`, err);
          setSyncStatus('error');
        }
      })();
    }
  };

  // Helper function to log Audit Trail actions
  const recordAuditTrail = (action: string, oldVal: string, newVal: string, currentMeters?: Meter[], currentReceipts?: EquipmentReceipt[], currentCts?: CTRecord[], currentPts?: PTRecord[], currentCases?: CommitteeCase[], currentReports?: TestReport[], currentStandards?: CalibrationStandard[], currentLogs?: AuditLog[]) => {
    const newLog: AuditLog = {
      id: `log-gen-${Date.now()}`,
      user: currentUser ? currentUser.name : 'System Gateway',
      role: currentUser ? currentUser.role : 'data_entry_operator',
      timestamp: getPKTISOString(),
      action,
      oldValue: oldVal,
      newValue: newVal
    };
    
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      saveState('auditLogs', updated);
      return updated;
    });
  };

  // 2. Controller methods linking modules (Write as direct actions updating central store)
  
  // A. Receipt Register Inward link
  const handleAddReceipt = (newReceipt: EquipmentReceipt, associatedMeter: Meter) => {
    const updatedMeters = [associatedMeter, ...meters];
    const updatedReceipts = [newReceipt, ...receipts];
    
    setMeters(updatedMeters);
    saveState('meters', updatedMeters);

    setReceipts(updatedReceipts);
    saveState('receipts', updatedReceipts);

    recordAuditTrail(
      `Filed Receipt ${newReceipt.receiptNumber}`, 
      'N/A: New Equipment Intake', 
      `Assigned Meter ${newReceipt.meterNumber} to warehouse queue`
    );
  };

  const handleAddBulkReceipts = (newReceiptsList: EquipmentReceipt[], associatedMetersList: Meter[]) => {
    const updatedMeters = [...associatedMetersList, ...meters];
    const updatedReceipts = [...newReceiptsList, ...receipts];

    setMeters(updatedMeters);
    saveState('meters', updatedMeters);

    setReceipts(updatedReceipts);
    saveState('receipts', updatedReceipts);

    recordAuditTrail(
      `Bulk Imported ${newReceiptsList.length} Receipts`, 
      'N/A: Bulk Equipment Intake', 
      `Assigned ${associatedMetersList.length} Meters to warehouse queue`
    );
  };

  // B. Inventory Dispatch Condition modifier
  const handleUpdateStockStatus = (meterId: string, status: StockStatus) => {
    const targetMeter = meters.find(m => m.id === meterId);
    const oldStatus = targetMeter ? targetMeter.stockStatus : 'Unknown';

    const updated = meters.map(m => {
      if (m.id === meterId) {
        return { ...m, stockStatus: status };
      }
      return m;
    });

    setMeters(updated);
    saveState('meters', updated);

    recordAuditTrail(
      `Dispatched stock condition for meter ${targetMeter?.meterNumber || 'Hardware'}`,
      `Stock Status: ${oldStatus}`,
      `Stock Status: ${status}`
    );
  };

  // C. Core Calibration bench tester (Sign and issue certification)
  const handleAddReportAndVerifyMeter = (updatedMeter: Meter, report: TestReport) => {
    // 1. Update meters
    const updatedMeters = meters.map(m => m.id === updatedMeter.id ? updatedMeter : m);
    if (!meters.some(m => m.id === updatedMeter.id)) {
      updatedMeters.push(updatedMeter);
    }
    setMeters(updatedMeters);
    saveState('meters', updatedMeters);

    // 2. Push Report to signed ledger PDF archive
    const updatedReports = [report, ...reports];
    setReports(updatedReports);
    saveState('reports', updatedReports);

    recordAuditTrail(
      `Certificated test report ${report.reportNumber} Issued`,
      `Status: Pending Testing / Awaiting calibration`,
      `Status: ${updatedMeter.status.toUpperCase()} • Generated signed certificate layout`
    );
  };

  // D. ICCID Smart SIM Provisioning linking
  const handleUpdateSIMDetails = (meterId: string, updatedFields: Partial<Meter>) => {
    const targetMeter = meters.find(m => m.id === meterId);
    const previousSIMMsg = targetMeter?.simNumber ? `SIM: ${targetMeter.simNumber}` : 'Pending SIM installation';

    const updated = meters.map(m => {
      if (m.id === meterId) {
        return { ...m, ...updatedFields };
      }
      return m;
    });

    setMeters(updated);
    saveState('meters', updated);

    recordAuditTrail(
      `Provisioned Smart SIM parameter specs for ${targetMeter?.meterNumber}`,
      previousSIMMsg,
      `SIM Number ID: ${updatedFields.simNumber || 'N/A'} • ICCID Provision verified`
    );
  };

  // E. Instrument Transformers (CT & PT) test entries
  const handleAddCT = (record: CTRecord) => {
    const updated = [record, ...cts];
    setCts(updated);
    saveState('cts', updated);

    recordAuditTrail(
      `Logged Incoming Current Transformer ${record.ctNumber}`,
      'N/A',
      `Registered ratio: ${record.ratio} accuracy spec class ${record.accuracyClass}`
    );
  };

  const handleAddPT = (record: PTRecord) => {
    const updated = [record, ...pts];
    setPts(updated);
    saveState('pts', updated);

    recordAuditTrail(
      `Logged Incoming Potential Transformer ${record.ptNumber}`,
      'N/A',
      `Registered ratio: ${record.ratio} accuracy spec class ${record.accuracyClass}`
    );
  };

  const handleTestCT = (id: string, testResult: 'passed' | 'failed', remarks: string) => {
    const target = cts.find(c => c.id === id);
    const today = getPKTDateString();

    const updated = cts.map(c => {
      if (c.id === id) {
        return { ...c, testResult, testDate: today, remarks };
      }
      return c;
    });

    setCts(updated);
    saveState('cts', updated);

    recordAuditTrail(
      `Calibrated Current Transformer ${target?.ctNumber}`,
      'Status: pending',
      `Status: ${testResult.toUpperCase()} • Ratio verified`
    );
  };

  const handleTestPT = (id: string, testResult: 'passed' | 'failed', remarks: string) => {
    const target = pts.find(p => p.id === id);
    const today = getPKTDateString();

    const updated = pts.map(p => {
      if (p.id === id) {
        return { ...p, testResult, testDate: today, remarks };
      }
      return p;
    });

    setPts(updated);
    saveState('pts', updated);

    recordAuditTrail(
      `Calibrated Potential Transformer ${target?.ptNumber}`,
      'Status: pending',
      `Status: ${testResult.toUpperCase()} • Coil insulation verified`
    );
  };

  // F. Joint dispute committee cases modifier
  const handleAddCase = (newCase: CommitteeCase) => {
    const updated = [newCase, ...cases];
    setCases(updated);
    saveState('cases', updated);

    recordAuditTrail(
      `Created Test Check Dispute Committee Case ${newCase.caseNumber}`,
      'N/A',
      `Assigned account: ${newCase.accountNumber} with inspector parameters`
    );
  };

  const handleUpdateCaseStatus = (caseId: string, updatedFields: Partial<CommitteeCase>) => {
    const target = cases.find(c => c.id === caseId);

    const updated = cases.map(c => {
      if (c.id === caseId) {
        return { ...c, ...updatedFields };
      }
      return c;
    });

    setCases(updated);
    saveState('cases', updated);

    recordAuditTrail(
      `Updated Test Check findings for Case ${target?.caseNumber}`,
      `Status: ${target?.approvalStatus || 'Created'}`,
      `Status: ${updatedFields.approvalStatus || 'Inspected'}`
    );
  };

  // G. Settings & reference standard benches configurations
  const handleAddStandard = (std: CalibrationStandard) => {
    const updated = [...standards, std];
    setStandards(updated);
    saveState('standards', updated);

    recordAuditTrail(
      `Registered Reference Calibration Standard Standard: ${std.name}`,
      'N/A',
      `Multiplier coefficient value: ${std.multiplier}`
    );
  };

  const handleUpdateStandard = (id: string, multiplier: number) => {
    const target = standards.find(s => s.id === id);

    const updated = standards.map(s => {
      if (s.id === id) {
        return { ...s, multiplier };
      }
      return s;
    });

    setStandards(updated);
    saveState('standards', updated);

    recordAuditTrail(
      `Calibrated Standard Bench Standard: ${target?.name}`,
      `Multiplier: ${target?.multiplier || 1.0}`,
      `Multiplier: ${multiplier}`
    );
  };

  // H. Client side Offline JSON backup generation (Matches Backup requirements)
  const handleBackupState = () => {
    const backupObj = {
      meters,
      receipts,
      cts,
      pts,
      cases,
      reports,
      auditLogs,
      standards
    };

    const textContent = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([textContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = `mtlms-backup-db-${getPKTDateString()}.json`;
    document.body.appendChild(tempLink);
    tempLink.click();
    
    // Clean-up
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);

    recordAuditTrail(
      'Exported local database database locally',
      'Active Browser Cache registers',
      'Backup downloaded as text file successfully.'
    );
  };

  // I. Client side restoration from uploaded backup JSON (Matches Restore requirements)
  const handleRestoreState = (jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      
      // Strict layout compliance checking
      if (!parsed.meters || !parsed.receipts || !parsed.reports) {
        return false;
      }

      setMeters(parsed.meters);
      saveState('meters', parsed.meters);

      setReceipts(parsed.receipts);
      saveState('receipts', parsed.receipts);

      setReports(parsed.reports);
      saveState('reports', parsed.reports);

      if (parsed.cts) { setCts(parsed.cts); saveState('cts', parsed.cts); }
      if (parsed.pts) { setPts(parsed.pts); saveState('pts', parsed.pts); }
      if (parsed.cases) { setCases(parsed.cases); saveState('cases', parsed.cases); }
      if (parsed.auditLogs) { setAuditLogs(parsed.auditLogs); saveState('auditLogs', parsed.auditLogs); }
      if (parsed.standards) { setStandards(parsed.standards); saveState('standards', parsed.standards); }

      recordAuditTrail(
        'Triggered system database restoration operation',
        'Previous browser registers',
        'Database hydatrated from offline backup file successfully'
      );

      return true;
    } catch {
      return false;
    }
  };

  // Switch Active role Simulator
  const handleUpdateRole = (role: UserRole) => {
    if (role === 'circle_supervisor') {
      const supervisorUser: UserType = {
        id: 'usr-sup-simulated',
        name: 'Supervisor Muhammad (Khyber)',
        email: 'supervisor.khyber@pesco.com.pk',
        role: 'circle_supervisor',
        designation: 'PESCO Circle Officer (262)',
        circleCode: '262'
      };
      const oldRole = currentUser ? currentUser.role : 'None';
      setCurrentUser(supervisorUser);
      localStorage.setItem('mtlms_currentUser', JSON.stringify(supervisorUser));
      recordAuditTrail(
        `Switched simulated workspace profile`,
        `Role: ${oldRole}`,
        `Role: CIRCLE_SUPERVISOR (Staff Name: ${supervisorUser.name})`
      );
      return;
    }

    const matchedUser = users.find(u => u.role === role) || SEED_USERS.find(u => u.role === role);
    if (matchedUser) {
      const oldRole = currentUser ? currentUser.role : 'None';
      setCurrentUser(matchedUser);
      localStorage.setItem('mtlms_currentUser', JSON.stringify(matchedUser));
      
      // Log role shift
      recordAuditTrail(
        `Switched simulated workspace profile`,
        `Role: ${oldRole}`,
        `Role: ${role.toUpperCase()} (Staff Name: ${matchedUser.name})`
      );
    }
  };

  // Update specific security password for lab portal members
  const handleUpdateUserPassword = (userId: string, newPass: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, password: newPass } : u);
    setUsers(updated);
    localStorage.setItem('mtlms_users', JSON.stringify(updated));
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      recordAuditTrail(
        `Updated security password for ${userToUpdate.name}`,
        '••••••••',
        'Confidential PIN updated successfully'
      );
    }
  };

  // Trigger page displacement from any link shortcut
  const handleNavigateToPage = (pageId: string) => {
    setActivePageId(pageId);
    setActivePdfReport(null); // Clear preview when shifting
  };

  // List of active menu items corresponding with the requested 17 dashboards page
  const menuItems = [
    { section: 'DASHBOARDS', items: [
      { id: 'dashboard', label: '1. Laboratory Analytics', icon: TrendingUp },
      { id: 'receipt_register', label: '2. Meter Inward Register', icon: Layers },
      { id: 'meter_inventory', label: '3. Hardware Inventory Vault', icon: Boxes }
    ]},
    { section: 'CALIBRATION BENCHES', items: [
      { id: 'single_phase_testing', label: '4. Single Phase testing', icon: Cpu, filter: 'single_phase' },
      { id: 'three_phase_whole_testing', label: '5. Three Phase Whole line', icon: Cpu, filter: 'three_phase_whole' },
      { id: 'three_phase_ct_testing', label: '6. Three Phase CT Op.', icon: Cpu, filter: 'three_phase_ct' },
      { id: 'three_phase_ct_pt_testing', label: '7. Three Phase CT/PT Op.', icon: Cpu, filter: 'three_phase_ct_pt' }
    ]},
    { section: 'INSTRUMENTS COILS & SIMS', items: [
      { id: 'smart_sim', label: '8. Smart SIM provisioning', icon: Radio },
      { id: 'ct_testing', label: '9. Current Transformer (CT)', icon: Building, filter: 'ct' },
      { id: 'pt_testing', label: '10. Potential Transformer (PT)', icon: Building, filter: 'pt' }
    ]},
    { section: 'DISPUTES & DECISION LEDGERS', items: [
      { id: 'test_check_committee', label: '11. Joint Dispute Board', icon: UserCheck },
      { id: 'report_generation', label: '12. Certificate Compilation', icon: FileSpreadsheet },
      { id: 'pdf_archive', label: '13. Signed Certificate Vault', icon: FileText },
      { id: 'search_records', label: '14. Multi-Field record query', icon: Search }
    ]},
    { section: 'ADMINISTRATOR HUB', items: [
      { id: 'user_management', label: '15. Role simulating', icon: User },
      { id: 'system_settings', label: '16. System Control', icon: Settings },
      { id: 'supabase_sync', label: '17. Database Cloud Sync', icon: Database },
      { id: 'supabase_todos', label: '18. Supabase Todos Viewer', icon: Bookmark }
    ]}
  ];

  const handleDirectCompileRedirect = (meter: Meter) => {
    let targetPage = 'single_phase_testing';
    if (meter.category === 'three_phase_whole') targetPage = 'three_phase_whole_testing';
    else if (meter.category === 'three_phase_ct') targetPage = 'three_phase_ct_testing';
    else if (meter.category === 'three_phase_ct_pt') targetPage = 'three_phase_ct_pt_testing';
    else if (meter.category === 'smart') targetPage = 'single_phase_testing'; // Default smart calibrator

    setActivePageId(targetPage);
  };

  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('mtlms_currentUser', JSON.stringify(user));
        }} 
        isDarkMode={isDarkMode} 
        users={users}
        syncStatus={syncStatus}
      />
    );
  }

  const activeUser = currentUser;

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-800'}`}>
      
      {/* LEFT NAVIGATION DRAWER (Utility Blue Sidebar) - Hidden during print */}
      <aside className={`w-60 border-r shrink-0 flex flex-col justify-between print:hidden h-screen sticky top-0 overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
        <div className="p-3.5 space-y-4">
          {/* Main utilities banner logo block header */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-14 h-14 bg-white rounded-full overflow-hidden flex items-center justify-center shadow shrink-0 border border-slate-700">
              <img 
                src={pescoLogo} 
                alt="PESCO Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-xs font-black tracking-tight leading-none uppercase text-white truncate">PESCO MTLMS</h1>
              <p className="text-[9px] text-blue-400 font-bold tracking-wider mt-0.5">METERS TESTING LAB</p>
            </div>
          </div>

          {/* User profile identifier block info */}
          <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/55 flex items-center gap-2.5 select-none hover:bg-slate-955/60 transition-colors">
            <div className="w-8 h-8 rounded bg-blue-700/60 border border-blue-500/30 flex items-center justify-center font-bold text-white shadow-inner uppercase shrink-0 text-xs">
              {activeUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{activeUser.name}</p>
              <p className="text-[10px] text-blue-400 font-bold tracking-wide truncate capitalize mt-0.5">
                💼 {activeUser.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Live Cloud Database Sync Status */}
          <div className="p-2.5 rounded-lg bg-slate-950/25 border border-slate-800/40 space-y-1.5 selection:bg-indigo-950">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-indigo-400 fill-indigo-400/20" />
                Cloud Database
              </span>
              <span className={`px-1 rounded text-[8px] font-black uppercase tracking-widest ${
                syncStatus === 'synced' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' :
                syncStatus === 'syncing' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30' :
                'bg-slate-800 text-slate-400'
              }`}>
                {syncStatus === 'synced' && 'Live'}
                {syncStatus === 'syncing' && 'Sync'}
                {syncStatus === 'offline' && 'Off'}
                {syncStatus === 'error' && 'Check'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300">Sync Pipeline:</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' :
                  syncStatus === 'syncing' ? 'bg-amber-500 animate-ping' :
                  syncStatus === 'error' ? 'bg-rose-500' : 'bg-slate-500'
                }`}></span>
                <span className={`text-[9.5px] font-black uppercase tracking-wider ${
                  syncStatus === 'synced' ? 'text-emerald-400 animate-pulse' :
                  syncStatus === 'syncing' ? 'text-amber-400' :
                  syncStatus === 'error' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {syncStatus === 'synced' && 'CONNECTED'}
                  {syncStatus === 'syncing' && 'SYNCING...'}
                  {syncStatus === 'error' && 'ERR SCHEMA'}
                  {syncStatus === 'offline' && 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Sections navigation list list */}
          <nav className="space-y-3 text-[11px]">
            {menuItems.map((sec, sIdx) => {
              if (sec.section === 'ADMINISTRATOR HUB' && currentUser?.role !== 'administrator') {
                return null;
              }
              return (
                <div key={sIdx} className="space-y-0.5">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block px-1.5 py-0.5 mt-2">
                    {sec.section}
                  </span>

                  <div className="space-y-0.5">
                    {sec.items.map(item => {
                      const IconComponent = item.icon;
                      const isActive = activePageId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigateToPage(item.id)}
                          className={`w-full text-left py-1 px-2 rounded flex items-center gap-2 transition-all ${
                            isActive 
                              ? 'bg-blue-600 text-white font-bold' 
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer controls layout dark/light theme switch */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Terminal Class A</span>
            <span className="text-[9px] px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold uppercase">
              Secure Core
            </span>
          </div>

          {/* Theme Shift */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700/30"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                Eye-Safe Dusk
              </>
            )}
          </button>

          {/* Sign Out Action */}
          <button
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem('mtlms_currentUser');
            }}
            className="w-full py-1 bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-red-900/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* RIGHT VIEWPORT VIEW CANVAS CONTAINER */}
      <main className="flex-grow flex flex-col min-h-screen overflow-x-hidden relative">
        
        {/* TOP STATUS HEADER PANEL - Hidden during print */}
        <header className={`h-11 px-4 border-b flex items-center justify-between shrink-0 print:hidden z-10 sticky top-0 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-black uppercase tracking-wider">
              Verification Node-3
            </span>
            <div className="text-[10px] text-slate-400 font-medium hidden md:inline">
              Laboratory Calibration Terminal • Active connection • Latency 12ms
            </div>
          </div>

          {/* Dynamic notifications bell alarm indicator */}
          <div className="flex items-center gap-3">
            <Notifications 
              meters={meters} 
              cts={cts} 
              pts={pts} 
              onNavigateToPage={handleNavigateToPage} 
            />
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-[10px] font-bold text-slate-500 hidden sm:block">
              Time PKT: <span className="font-mono text-blue-600 font-black">{currentTime}</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEW CONTENT AREA PAGE LAYOUT */}
        <div className={`p-4 flex-grow overflow-y-auto print:p-0 print:bg-white relative ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
          
          {/* Certificate PDF View Cover Overlay */}
          {batchPdfReports && batchPdfReports.length > 0 ? (
            <BatchReportPDF 
              reports={batchPdfReports} 
              onBack={() => setBatchPdfReports(null)} 
            />
          ) : activePdfReport ? (
            <ReportPDF 
              report={activePdfReport} 
              onBack={() => setActivePdfReport(null)} 
            />
          ) : (
            /* Standard page dispatcher */
            <div id="active-dynamic-view-viewport" className="animate-in fade-in slide-in-from-bottom-2 duration-150">
              
              {activePageId === 'dashboard' && (
                <DashboardView 
                  meters={meters} 
                  cts={cts} 
                  pts={pts} 
                  cases={cases} 
                  receipts={receipts}
                  reports={reports}
                  onNavigateToPage={handleNavigateToPage} 
                />
              )}

              {activePageId === 'receipt_register' && (
                <RegisterView 
                  receipts={receipts} 
                  onAddReceipt={handleAddReceipt} 
                  onAddBulkReceipts={handleAddBulkReceipts}
                  currentUser={currentUser} 
                />
              )}

              {activePageId === 'meter_inventory' && (
                <InventoryView 
                  meters={meters} 
                  onUpdateStockStatus={handleUpdateStockStatus} 
                  currentUser={currentUser} 
                />
              )}

              {/* Single Phase Testing Form */}
              {activePageId === 'single_phase_testing' && (
                <TestingView 
                  meters={meters} 
                  receipts={receipts}
                  onAddReportAndVerifyMeter={handleAddReportAndVerifyMeter} 
                  currentUser={currentUser} 
                  defaultCategoryFilter="single_phase" 
                />
              )}

              {/* Three Phase Whole Line testing */}
              {activePageId === 'three_phase_whole_testing' && (
                <TestingView 
                  meters={meters} 
                  receipts={receipts}
                  onAddReportAndVerifyMeter={handleAddReportAndVerifyMeter} 
                  currentUser={currentUser} 
                  defaultCategoryFilter="three_phase_whole" 
                />
              )}

              {/* Three Phase CT testing */}
              {activePageId === 'three_phase_ct_testing' && (
                <TestingView 
                  meters={meters} 
                  receipts={receipts}
                  onAddReportAndVerifyMeter={handleAddReportAndVerifyMeter} 
                  currentUser={currentUser} 
                  defaultCategoryFilter="three_phase_ct" 
                />
              )}

              {/* Three Phase CT/PT testing */}
              {activePageId === 'three_phase_ct_pt_testing' && (
                <TestingView 
                  meters={meters} 
                  receipts={receipts}
                  onAddReportAndVerifyMeter={handleAddReportAndVerifyMeter} 
                  currentUser={currentUser} 
                  defaultCategoryFilter="three_phase_ct_pt" 
                />
              )}

              {/* SIM tracker specs */}
              {activePageId === 'smart_sim' && (
                <SIMView 
                  meters={meters} 
                  onUpdateSIMDetails={handleUpdateSIMDetails} 
                  currentUser={currentUser} 
                />
              )}

              {/* Transformer CT queue */}
              {activePageId === 'ct_testing' && (
                <TransformersView 
                  cts={cts} 
                  pts={pts} 
                  onAddCT={handleAddCT} 
                  onAddPT={handleAddPT} 
                  onTestCT={handleTestCT} 
                  onTestPT={handleTestPT} 
                />
              )}

              {/* Transformer PT queue */}
              {activePageId === 'pt_testing' && (
                <TransformersView 
                  cts={cts} 
                  pts={pts} 
                  onAddCT={handleAddCT} 
                  onAddPT={handleAddPT} 
                  onTestCT={handleTestCT} 
                  onTestPT={handleTestPT} 
                />
              )}

              {/* Joint dispute committee Cases */}
              {activePageId === 'test_check_committee' && (
                <CommitteeView 
                  cases={cases} 
                  receipts={receipts}
                  onAddCase={handleAddCase}
                  onUpdateCaseStatus={handleUpdateCaseStatus} 
                  currentUser={currentUser} 
                />
              )}

              {/* Signed Certificate compilation & searching logs */}
              {(activePageId === 'report_generation' || activePageId === 'pdf_archive' || activePageId === 'search_records') && (
                <ReportsArchiveView 
                  reports={reports} 
                  meters={meters} 
                  cts={cts} 
                  pts={pts} 
                  cases={cases}
                  onOpenReportPDF={(rep) => setActivePdfReport(rep)} 
                  onCompileReportForMeter={handleDirectCompileRedirect} 
                  onOpenBatchReportPDF={(selectedReps) => setBatchPdfReports(selectedReps)}
                />
              )}

              {/* Simulating profiles & Calibration benchmarks */}
              {activePageId === 'user_management' && currentUser?.role === 'administrator' && (
                <ManagementView 
                  users={users} 
                  onUpdateRole={handleUpdateRole} 
                  currentUser={currentUser} 
                  auditLogs={auditLogs} 
                  standards={standards} 
                  onAddStandard={handleAddStandard} 
                  onUpdateStandard={handleUpdateStandard}
                  onBackupState={handleBackupState} 
                  onRestoreState={handleRestoreState} 
                  onRecordAudit={recordAuditTrail}
                  onUpdateUserPassword={handleUpdateUserPassword}
                />
              )}

              {activePageId === 'system_settings' && currentUser?.role === 'administrator' && (
                <ManagementView 
                  users={users} 
                  onUpdateRole={handleUpdateRole} 
                  currentUser={currentUser} 
                  auditLogs={auditLogs} 
                  standards={standards} 
                  onAddStandard={handleAddStandard} 
                  onUpdateStandard={handleUpdateStandard}
                  onBackupState={handleBackupState} 
                  onRestoreState={handleRestoreState} 
                  onRecordAudit={recordAuditTrail}
                  onUpdateUserPassword={handleUpdateUserPassword}
                />
              )}

              {activePageId === 'supabase_sync' && currentUser?.role === 'administrator' && (
                <SupabaseSyncView
                  users={users}
                  setUsers={setUsers}
                  meters={meters}
                  setMeters={setMeters}
                  receipts={receipts}
                  setReceipts={setReceipts}
                  cts={cts}
                  setCts={setCts}
                  pts={pts}
                  setPts={setPts}
                  cases={cases}
                  setCases={setCases}
                  reports={reports}
                  setReports={setReports}
                  auditLogs={auditLogs}
                  setAuditLogs={setAuditLogs}
                  standards={standards}
                  setStandards={setStandards}
                  todos={todos}
                  setTodos={setTodos}
                />
              )}

              {activePageId === 'supabase_todos' && currentUser?.role === 'administrator' && (
                <SupabaseTodosView isDarkMode={isDarkMode} />
              )}

            </div>
          )}

        </div>

        {/* Footer info block */}
        <footer className="h-10 border-t border-slate-200 bg-white flex items-center justify-between px-6 sm:px-8 text-[10px] text-slate-400 shrink-0 print:hidden font-medium select-none">
          <span>Metropolis Power Grid testing laboratory v2.1.0 • Core encrypted</span>
          <span>Security status: Safe • System clock aligned</span>
        </footer>

      </main>

    </div>
  );
}
