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
  Database,
  Trash2,
  Menu,
  X,
  Truck
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
  MeterStatus,
  UserRole,
  AvailableSIM,
  OutwardRecord
} from './types';

// Predefined seed data
import {
  SEED_USERS,
  SEED_METERS,
  SEED_RECEIPTS,
  SEED_OUTWARD_RECORDS,
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
import OutwardRegisterView from './components/OutwardRegisterView';
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

interface ThemeColorPalette {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryLightBg: string;
  darkAccent: string;
}

const COLOR_PALETTES: ThemeColorPalette[] = [
  {
    id: 'blue',
    name: 'PESCO Ocean Blue',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: 'rgba(37, 99, 235, 0.15)',
    primaryLightBg: 'rgba(37, 99, 235, 0.05)',
    darkAccent: '#1e1b4b',
  },
  {
    id: 'teal',
    name: 'Cyber Teal Aura',
    primary: '#0d9488',
    primaryHover: '#0f766e',
    primaryLight: 'rgba(13, 148, 136, 0.15)',
    primaryLightBg: 'rgba(13, 148, 136, 0.05)',
    darkAccent: '#115e59',
  },
  {
    id: 'orange',
    name: 'Solar Tangerine',
    primary: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: 'rgba(234, 88, 12, 0.15)',
    primaryLightBg: 'rgba(234, 88, 12, 0.05)',
    darkAccent: '#7c2d12',
  },
  {
    id: 'violet',
    name: 'Royal Lab Violet',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: 'rgba(124, 58, 237, 0.15)',
    primaryLightBg: 'rgba(124, 58, 237, 0.05)',
    darkAccent: '#4c1d95',
  },
  {
    id: 'indigo',
    name: 'Deep Indigo Navy',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: 'rgba(79, 70, 229, 0.15)',
    primaryLightBg: 'rgba(79, 70, 229, 0.05)',
    darkAccent: '#312e81',
  },
  {
    id: 'amber',
    name: 'Industrial Amber',
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: 'rgba(217, 119, 6, 0.15)',
    primaryLightBg: 'rgba(217, 119, 6, 0.05)',
    darkAccent: '#78350f',
  },
  {
    id: 'rose',
    name: 'Crimson Power Red',
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryLight: 'rgba(225, 29, 72, 0.15)',
    primaryLightBg: 'rgba(225, 29, 72, 0.05)',
    darkAccent: '#881337',
  },
  {
    id: 'slate',
    name: 'Tech Slate Obsidian',
    primary: '#475569',
    primaryHover: '#334155',
    primaryLight: 'rgba(71, 85, 105, 0.15)',
    primaryLightBg: 'rgba(71, 85, 105, 0.05)',
    darkAccent: '#1e293b',
  }
];

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
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    return localStorage.getItem('mtlms_color_palette') || 'blue';
  });

  const handleSelectPalette = (id: string) => {
    setSelectedPaletteId(id);
    localStorage.setItem('mtlms_color_palette', id);
  };

  const [activePageId, setActivePageId] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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
  const [outwardRecords, setOutwardRecords] = useState<OutwardRecord[]>([]);
  const [cts, setCts] = useState<CTRecord[]>([]);
  const [pts, setPts] = useState<PTRecord[]>([]);
  const [cases, setCases] = useState<CommitteeCase[]>([]);
  const [reports, setReports] = useState<TestReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [standards, setStandards] = useState<CalibrationStandard[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [availableSims, setAvailableSims] = useState<AvailableSIM[]>([]);
  
  // Real-time dynamic Users directory synchronized from Supabase
  const [users, setUsers] = useState<UserType[]>(() => {
    try {
      const stored = localStorage.getItem('mtlms_users');
      const loaded = stored ? JSON.parse(stored) : SEED_USERS;
      const seen = new Set<string>();
      return loaded.filter((u: UserType) => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });
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
          const seen = new Set<string>();
          const uniqueMapped = mapped.filter(u => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
          });
          setUsers(uniqueMapped);
          localStorage.setItem('mtlms_users', JSON.stringify(uniqueMapped));
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
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState<boolean>(false);

  // Cloud database real-time sync status
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const handlePullAllFromDatabase = async (): Promise<boolean> => {
    setSyncStatus('syncing');
    try {
      const { error: testError } = await supabase.from('meters').select('id').limit(1);
      if (testError) {
        if (testError.code === '42P01') {
          console.warn('[Supabase Auto-Sync] Connected but schema or tables do not exist yet in Supabase.');
          setSyncStatus('error');
        } else {
          console.warn('[Supabase Auto-Sync] Supabase unreachable or wrong credentials:', testError.message);
          setSyncStatus('offline');
        }
        return false;
      }

      console.log('[Supabase Auto-Sync] Connected successfully. Performing database pulling and sync...');
      
      const tablesToSync = [
        { key: 'meters', stateSetter: setMeters, localSeed: SEED_METERS },
        { key: 'receipts', stateSetter: setReceipts, localSeed: SEED_RECEIPTS },
        { key: 'outward_records', stateSetter: setOutwardRecords, localSeed: SEED_OUTWARD_RECORDS },
        { key: 'cts', stateSetter: setCts, localSeed: SEED_CTS },
        { key: 'pts', stateSetter: setPts, localSeed: SEED_PTS },
        { key: 'cases', stateSetter: setCases, localSeed: SEED_COMMITTEE_CASES },
        { key: 'reports', stateSetter: setReports, localSeed: SEED_REPORTS },
        { key: 'auditLogs', stateSetter: setAuditLogs, localSeed: SEED_AUDIT_LOGS },
        { key: 'standards', stateSetter: setStandards, localSeed: SEED_CALIBRATION_STANDARDS },
        { key: 'available_sims', stateSetter: setAvailableSims, localSeed: [] }
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
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return true;
    } catch (err: any) {
      console.error('[Supabase Auto-Sync Exception]', err);
      setSyncStatus('error');
      return false;
    }
  };

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
      setOutwardRecords(getOrSeed<OutwardRecord[]>('outward_records', SEED_OUTWARD_RECORDS));
      setCts(getOrSeed<CTRecord[]>('cts', SEED_CTS));
      setPts(getOrSeed<PTRecord[]>('pts', SEED_PTS));
      setCases(getOrSeed<CommitteeCase[]>('cases', SEED_COMMITTEE_CASES));
      setReports(getOrSeed<TestReport[]>('reports', SEED_REPORTS));
      setAuditLogs(getOrSeed<AuditLog[]>('auditLogs', SEED_AUDIT_LOGS));
      setStandards(getOrSeed<CalibrationStandard[]>('standards', SEED_CALIBRATION_STANDARDS));
      setAvailableSims(getOrSeed<AvailableSIM[]>('available_sims', []));
    } catch (e) {
      console.error('LocalStorage hydration failed, falling back to default seed.', e);
      setMeters(SEED_METERS);
      setReceipts(SEED_RECEIPTS);
      setOutwardRecords(SEED_OUTWARD_RECORDS);
      setCts(SEED_CTS);
      setPts(SEED_PTS);
      setCases(SEED_COMMITTEE_CASES);
      setReports(SEED_REPORTS);
      setAuditLogs(SEED_AUDIT_LOGS);
      setStandards(SEED_CALIBRATION_STANDARDS);
      setAvailableSims([]);
    }
  }, []);

  // 1b. Supabase Bi-directional Auto Sync on startup (keeps analytics and tables updated as per database)
  useEffect(() => {
    const timeout = setTimeout(handlePullAllFromDatabase, 800);
    
    return () => {
      clearTimeout(timeout);
    };
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
  
  const handleAddOutwardRecord = (newRecord: OutwardRecord, selectedItemIds: string[]) => {
    // Update outward records state and local storage
    const updatedRecords = [newRecord, ...outwardRecords];
    setOutwardRecords(updatedRecords);
    saveState('outward_records', updatedRecords);

    // Update stock status of selected meters to 'Installed'
    if (newRecord.equipmentType && ['single_phase', 'three_phase_whole', 'three_phase_ct', 'three_phase_ct_pt', 'net_metering'].includes(newRecord.equipmentType)) {
      const updatedMeters = meters.map(m => {
        if (selectedItemIds.includes(m.id)) {
          return { 
            ...m, 
            stockStatus: 'Installed' as StockStatus,
            movementHistory: [
              ...(m.movementHistory || []),
              {
                timestamp: new Date().toISOString().split('T')[0],
                fromStatus: m.stockStatus,
                toStatus: 'Installed' as StockStatus,
                actor: currentUser?.name || 'System',
                details: `Dispatched in outward register entry ${newRecord.outwardNumber} to subdivision ${newRecord.subdivision}`
              }
            ]
          };
        }
        return m;
      });
      setMeters(updatedMeters);
      saveState('meters', updatedMeters);
    }

    recordAuditTrail(
      `Filed Outward ${newRecord.outwardNumber}`,
      'Meter Dispatch',
      `Issued ${selectedItemIds.length} items of type ${newRecord.equipmentType || 'Meter'} to ${newRecord.issuedTo} (${newRecord.subdivision})`
    );
  };

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

  const handlePushMeterToInventory = (associatedMeter: Meter) => {
    if (meters.some(m => m.meterNumber === associatedMeter.meterNumber || m.serialNumber === associatedMeter.serialNumber)) {
      return;
    }
    const updatedMeters = [associatedMeter, ...meters];
    setMeters(updatedMeters);
    saveState('meters', updatedMeters);

    recordAuditTrail(
      `Pushed Meter ${associatedMeter.meterNumber} to Inventory`,
      'N/A: Manual Register Push',
      `Registered Meter ${associatedMeter.meterNumber} in Hardware Inventory Vault`,
      updatedMeters
    );
  };

  const handlePushBulkMetersToInventory = (metersToPush: Meter[]) => {
    const newMeters = metersToPush.filter(meter => 
      !meters.some(m => m.meterNumber === meter.meterNumber || m.serialNumber === meter.serialNumber)
    );
    if (newMeters.length === 0) return;
    
    const updatedMeters = [...newMeters, ...meters];
    setMeters(updatedMeters);
    saveState('meters', updatedMeters);

    recordAuditTrail(
      `Pushed ${newMeters.length} Meters to Inventory`,
      'N/A: Manual Bulk Register Push',
      `Registered ${newMeters.length} Meters in Hardware Inventory Vault`,
      updatedMeters
    );
  };

  // B. Inventory Dispatch Condition modifier
  const handleUpdateStockStatus = (meterId: string, status: StockStatus) => {
    const targetMeter = meters.find(m => m.id === meterId);
    const oldStatus = targetMeter ? targetMeter.stockStatus : 'Unknown';

    const getMeterStatusFromStockStatus = (stockStat: StockStatus, currentStat: MeterStatus): MeterStatus => {
      switch (stockStat) {
        case 'In Store':
          return currentStat === 'passed' || currentStat === 'failed' || currentStat === 'report_issued' 
            ? currentStat 
            : 'pending_testing';
        case 'Under Testing':
          return 'under_testing';
        case 'Approved':
          return 'passed';
        case 'Rejected':
          return 'failed';
        case 'Installed':
          return 'report_issued';
        case 'Scrapped':
          return 'failed';
        default:
          return currentStat;
      }
    };

    const updated = meters.map(m => {
      if (m.id === meterId) {
        const matchedReceipt = receipts.find(r => 
          r.meterNumber.toUpperCase() === m.meterNumber.toUpperCase() ||
          r.serialNumber.toUpperCase() === m.serialNumber.toUpperCase()
        );
        const consName = m.consumerName || matchedReceipt?.consumerName || 'Official Utility Custody';
        const consAcc = m.consumerAccount || matchedReceipt?.consumerAccount || 'N/A';
        const manufacturerVal = m.manufacturer && m.manufacturer !== 'Secure Meters Ltd' ? m.manufacturer : (matchedReceipt?.make || m.manufacturer);

        const historyItem = {
          timestamp: formatPKTDateTime(new Date()),
          fromStatus: m.stockStatus,
          toStatus: status,
          actor: currentUser ? `${currentUser.name} (${currentUser.role})` : 'System Operator',
          details: `Dispatched condition shifted to [${status}]. Carried forward client account: ${consAcc} & consumer: ${consName}.`
        };

        const existingHistory = m.movementHistory || [];

        return { 
          ...m, 
          stockStatus: status,
          status: getMeterStatusFromStockStatus(status, m.status),
          manufacturer: manufacturerVal,
          consumerName: consName,
          consumerAccount: consAcc !== 'N/A' ? consAcc : undefined,
          movementHistory: [...existingHistory, historyItem]
        };
      }
      return m;
    });

    setMeters(updated);
    saveState('meters', updated);

    recordAuditTrail(
      `Dispatched stock condition for meter ${targetMeter?.meterNumber || 'Hardware'} (Carried Forward Details)`,
      `Stock Status: ${oldStatus}`,
      `Stock Status: ${status} • Preserved customer and calibration profile`
    );
  };

  const handleUpdateBulkStockStatus = (meterIds: string[], status: StockStatus) => {
    const getMeterStatusFromStockStatus = (stockStat: StockStatus, currentStat: MeterStatus): MeterStatus => {
      switch (stockStat) {
        case 'In Store':
          return currentStat === 'passed' || currentStat === 'failed' || currentStat === 'report_issued' 
            ? currentStat 
            : 'pending_testing';
        case 'Under Testing':
          return 'under_testing';
        case 'Approved':
          return 'passed';
        case 'Rejected':
          return 'failed';
        case 'Installed':
          return 'report_issued';
        case 'Scrapped':
          return 'failed';
        default:
          return currentStat;
      }
    };

    const updated = meters.map(m => {
      if (meterIds.includes(m.id)) {
        const matchedReceipt = receipts.find(r => 
          r.meterNumber.toUpperCase() === m.meterNumber.toUpperCase() ||
          r.serialNumber.toUpperCase() === m.serialNumber.toUpperCase()
        );
        const consName = m.consumerName || matchedReceipt?.consumerName || 'Official Utility Custody';
        const consAcc = m.consumerAccount || matchedReceipt?.consumerAccount || 'N/A';
        const manufacturerVal = m.manufacturer && m.manufacturer !== 'Secure Meters Ltd' ? m.manufacturer : (matchedReceipt?.make || m.manufacturer);

        const historyItem = {
          timestamp: formatPKTDateTime(new Date()),
          fromStatus: m.stockStatus,
          toStatus: status,
          actor: currentUser ? `${currentUser.name} (${currentUser.role})` : 'System Operator',
          details: `Bulk movement transition to [${status}]. Carried forward client account: ${consAcc} & consumer: ${consName}.`
        };

        const existingHistory = m.movementHistory || [];

        return { 
          ...m, 
          stockStatus: status,
          status: getMeterStatusFromStockStatus(status, m.status),
          manufacturer: manufacturerVal,
          consumerName: consName,
          consumerAccount: consAcc !== 'N/A' ? consAcc : undefined,
          movementHistory: [...existingHistory, historyItem]
        };
      }
      return m;
    });

    setMeters(updated);
    saveState('meters', updated);

    recordAuditTrail(
      `Bulk dispatched stock condition for ${meterIds.length} meters (Carried Forward Details)`,
      "Stock Status: Various",
      `Stock Status: ${status} • Preserved all dynamic parameters`
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
  const handleUpdateAvailableSims = (valueOrUpdater: AvailableSIM[] | ((prev: AvailableSIM[]) => AvailableSIM[])) => {
    setAvailableSims(prev => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      saveState('available_sims', next);
      return next;
    });
  };

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

  // Clear or Factory Reset Local Data Registers method
  const handleClearLocalData = (resetToSeed: boolean) => {
    const targetMeters = resetToSeed ? SEED_METERS : [];
    const targetReceipts = resetToSeed ? SEED_RECEIPTS : [];
    const targetOutwardRecords = resetToSeed ? SEED_OUTWARD_RECORDS : [];
    const targetCts = resetToSeed ? SEED_CTS : [];
    const targetPts = resetToSeed ? SEED_PTS : [];
    const targetCases = resetToSeed ? SEED_COMMITTEE_CASES : [];
    const targetReports = resetToSeed ? SEED_REPORTS : [];
    const targetAuditLogs = resetToSeed ? SEED_AUDIT_LOGS : [];
    const targetStandards = resetToSeed ? SEED_CALIBRATION_STANDARDS : [];

    setMeters(targetMeters);
    saveState('meters', targetMeters);

    setReceipts(targetReceipts);
    saveState('receipts', targetReceipts);

    setOutwardRecords(targetOutwardRecords);
    saveState('outward_records', targetOutwardRecords);

    setCts(targetCts);
    saveState('cts', targetCts);

    setPts(targetPts);
    saveState('pts', targetPts);

    setCases(targetCases);
    saveState('cases', targetCases);

    setReports(targetReports);
    saveState('reports', targetReports);

    setAuditLogs(targetAuditLogs);
    saveState('auditLogs', targetAuditLogs);

    setStandards(targetStandards);
    saveState('standards', targetStandards);

    const actionDesc = resetToSeed 
      ? 'Factory Setup: Reset all laboratory metadata back to baseline seed records'
      : 'Purged: Cleared all datasets and reports for clean laboratory registry';

    recordAuditTrail(
      resetToSeed ? 'Factory Seed Reset' : 'Database Purged',
      'Active database rows',
      actionDesc
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
      outwardRecords,
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

      if (parsed.outwardRecords) { setOutwardRecords(parsed.outwardRecords); saveState('outward_records', parsed.outwardRecords); }

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

  // Update specific user profile properties dynamically (like circle and mapped role)
  const handleUpdateUserProfile = (userId: string, updatedFields: Partial<UserType>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...updatedFields } : u);
    setUsers(updated);
    localStorage.setItem('mtlms_users', JSON.stringify(updated));
    
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      const fieldDesc = Object.entries(updatedFields)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join(', ');
      recordAuditTrail(
        `Aligned profile credentials for ${userToUpdate.name}`,
        `Previous Role: ${userToUpdate.role.toUpperCase()}`,
        `New Configuration (${fieldDesc})`
      );
    }
  };

  // Remove duplicate users keeping only unique emails (or names, if email is empty)
  const handleRemoveDuplicateUsers = async () => {
    const seenEmails = new Set<string>();
    const seenIds = new Set<string>();
    const deduplicatedUsers: UserType[] = [];
    const duplicateIdsToDelete: string[] = [];

    for (const u of users) {
      const emailNorm = u.email.trim().toLowerCase();
      const duplicateById = seenIds.has(u.id);
      const duplicateByEmail = emailNorm && seenEmails.has(emailNorm);

      if (duplicateById || duplicateByEmail) {
        duplicateIdsToDelete.push(u.id);
      } else {
        seenIds.add(u.id);
        if (emailNorm) {
          seenEmails.add(emailNorm);
        }
        deduplicatedUsers.push(u);
      }
    }

    if (duplicateIdsToDelete.length === 0) {
      alert("No duplicate users detected in your directory registry!");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${duplicateIdsToDelete.length} duplicate user record(s)? This will keep the first instance of each unique member email and delete duplicates.`)) {
      return;
    }

    // Save to local state and localStorage
    setUsers(deduplicatedUsers);
    localStorage.setItem('mtlms_users', JSON.stringify(deduplicatedUsers));

    // Try to sync deletion to Supabase
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', duplicateIdsToDelete);
      
      if (error) {
        console.warn("Could not delete from Supabase, local state updated:", error);
        alert(`Successfully cleaned local directory. Removed ${duplicateIdsToDelete.length} duplicate user records. (Remote Supabase deletion skipped/failed: ${error.message})`);
      } else {
        alert(`Successfully removed ${duplicateIdsToDelete.length} duplicate user records from both local cache and central Supabase ledger!`);
      }
    } catch (e: any) {
      console.warn("Database deletion error:", e);
      alert(`Successfully cleaned local directory. Removed ${duplicateIdsToDelete.length} duplicate user records.`);
    }

    recordAuditTrail(
      "Deduplicated Team Officer Directory",
      `${users.length} registered officers`,
      `${deduplicatedUsers.length} clean accounts (${duplicateIdsToDelete.length} duplicates removed)`
    );
  };

  // Trigger page displacement from any link shortcut
  const handleNavigateToPage = (pageId: string) => {
    setActivePageId(pageId);
    setActivePdfReport(null); // Clear preview when shifting
    setIsMobileSidebarOpen(false); // Close responsive sidebar on tap
  };

  // List of active menu items corresponding with the requested 17 dashboards page
  const menuItems = [
    { section: 'DASHBOARDS', items: [
      { id: 'dashboard', label: '1. Laboratory Analytics', icon: TrendingUp },
      { id: 'receipt_register', label: '2. Meter Inward Register', icon: Layers },
      { id: 'outward_register', label: '3. Meter Outward Register', icon: Truck },
      { id: 'meter_inventory', label: '4. Hardware Inventory Vault', icon: Boxes }
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
          // Check if on a mobile device to display the Laboratory Analytics Page (id: 'dashboard')
          const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            setActivePageId('dashboard');
            setIsMobileSidebarOpen(false);
          }
        }} 
        isDarkMode={isDarkMode} 
        users={users}
        syncStatus={syncStatus}
      />
    );
  }

  const activeUser = currentUser;

  const renderSidebarContent = (isDrawer = false) => {
    return (
      <>
        <div className="p-3.5 space-y-4">
          {/* Main utilities banner logo block header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 bg-white rounded-full overflow-hidden flex items-center justify-center shadow shrink-0 border border-slate-700">
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
            {isDrawer && (
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
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
                  syncStatus === 'error' ? 'bg-rose-500' : 'bg-slate-400'
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
                          className={`w-full text-left py-1 px-2 rounded flex items-center gap-2 transition-all cursor-pointer ${
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

          {/* Color Scheme Picker */}
          <div className="space-y-1.5 px-0.5 pb-2 border-b border-slate-800/60">
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
              App Color Scheme
            </span>
            <div className="grid grid-cols-4 gap-2 py-1">
              {COLOR_PALETTES.map((pal) => {
                const isSelected = selectedPaletteId === pal.id;
                return (
                  <button
                    key={pal.id}
                    onClick={() => handleSelectPalette(pal.id)}
                    title={pal.name}
                    className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center border transition-all cursor-pointer relative group ${
                      isSelected 
                        ? 'border-white scale-110 shadow-md ring-2 ring-indigo-500/50 ring-offset-1 ring-offset-slate-900' 
                        : 'border-slate-700/60 opacity-80 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: pal.primary }}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    )}
                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-950 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {pal.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Shift */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700/30 cursor-pointer"
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

          {/* Clear Local Data Action */}
          <button
            onClick={() => setIsClearDataModalOpen(true)}
            className="w-full py-1 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 hover:text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-amber-900/30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Local Data
          </button>

          {/* Sign Out Action */}
          <button
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem('mtlms_currentUser');
            }}
            className="w-full py-1 bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-red-900/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </>
    );
  };

  const activePalette = COLOR_PALETTES.find(p => p.id === selectedPaletteId) || COLOR_PALETTES[0];

  return (
    <div className={`min-h-[100dvh] flex ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-800'}`}>
      <style>{`
        :root {
          --primary-color: ${activePalette.primary};
          --primary-hover: ${activePalette.primaryHover};
          --primary-light: ${activePalette.primaryLight};
          --primary-light-bg: ${activePalette.primaryLightBg};
          --primary-dark: ${activePalette.darkAccent};
        }

        /* Force brand overrides across standard Tailwind classes dynamically */
        /* Background Colors */
        .bg-blue-600, .bg-indigo-600, .bg-blue-500, .bg-indigo-500 {
          background-color: var(--primary-color) !important;
        }
        .hover\\:bg-blue-700:hover, .hover\\:bg-indigo-700:hover, .hover\\:bg-blue-600:hover, .hover\\:bg-indigo-600:hover, .hover\\:bg-indigo-700\\/90:hover {
          background-color: var(--primary-hover) !important;
        }
        .bg-blue-700, .bg-indigo-700 {
          background-color: var(--primary-hover) !important;
        }

        /* Ambient colored cards and deep highlights */
        .light .bg-blue-800, .light .bg-indigo-800, .light .bg-blue-900, .light .bg-indigo-900, .light .bg-blue-950, .light .bg-indigo-950 {
          background-color: var(--primary-dark) !important;
        }
        .dark .bg-blue-800, .dark .bg-indigo-800, .dark .bg-blue-900, .dark .bg-indigo-900, .dark .bg-blue-950, .dark .bg-indigo-950 {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }

        /* Tinted block background helpers */
        .light .bg-indigo-50, .light .bg-blue-50, .light .bg-indigo-50\\/10, .light .bg-blue-50\\/10, .light .bg-indigo-50\\/20, .light .bg-blue-50\\/20, .light .bg-blue-500\\/10, .light .bg-indigo-500\\/10, .light .bg-indigo-600\\/10, .light .bg-indigo-650\\/10, .light .bg-blue-600\\/10, .light .bg-indigo-900\\/5, .light .bg-indigo-950\\/5, .light .bg-indigo-950\\/20, .light .bg-blue-950\\/20, .light .bg-indigo-950\\/40, .light .bg-blue-950\\/40 {
          background-color: var(--primary-light-bg) !important;
        }
        .dark .bg-indigo-50, .dark .bg-blue-50, .dark .bg-indigo-50\\/10, .dark .bg-blue-50\\/10, .dark .bg-indigo-50\\/20, .dark .bg-blue-50\\/20, .dark .bg-blue-500\\/10, .dark .bg-indigo-500\\/10, .dark .bg-indigo-600\\/10, .dark .bg-indigo-650\\/10, .dark .bg-blue-600\\/10, .dark .bg-indigo-900\\/5, .dark .bg-indigo-950\\/5, .dark .bg-indigo-950\\/20, .dark .bg-blue-950\\/20, .dark .bg-indigo-950\\/40, .dark .bg-blue-950\\/40 {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .light .hover\\:bg-indigo-50:hover, .light .hover\\:bg-blue-50:hover, .light .hover\\:bg-indigo-100:hover, .light .hover\\:bg-blue-100:hover {
          background-color: var(--primary-light-bg) !important;
        }
        .dark .hover\\:bg-indigo-50:hover, .dark .hover\\:bg-blue-50:hover, .dark .hover\\:bg-indigo-100:hover, .dark .hover\\:bg-blue-100:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* Dynamic High-Contrast Text Rules */
        /* LIGHT MODE */
        .light .text-blue-600, .light .text-indigo-600, .light .text-indigo-700, .light .text-blue-750, .light .text-indigo-650, .light .text-blue-500, .light .text-indigo-500, .light .text-blue-700, .light .text-blue-400, .light .text-indigo-400 {
          color: var(--primary-color) !important;
        }
        .light .text-indigo-800, .light .text-blue-800, .light .text-indigo-900, .light .text-blue-900, .light .text-indigo-950, .light .text-blue-950, .light .text-indigo-905 {
          color: var(--primary-dark) !important;
        }
        .light .text-indigo-300, .light .text-blue-300 {
          color: var(--primary-color) !important;
          font-weight: 700 !important;
        }

        /* DARK MODE */
        .dark {
          --brand-bright: ${selectedPaletteId === 'blue' ? '#38bdf8' : 
                            selectedPaletteId === 'teal' ? '#2dd4bf' : 
                            selectedPaletteId === 'orange' ? '#fb923c' : 
                            selectedPaletteId === 'violet' ? '#a78bfa' : 
                            selectedPaletteId === 'indigo' ? '#818cf8' : 
                            selectedPaletteId === 'amber' ? '#f59e0b' : 
                            selectedPaletteId === 'rose' ? '#f87171' : '#94a3b8'};
        }
        .dark .text-blue-600, .dark .text-indigo-600, .dark .text-indigo-700, .dark .text-blue-750, .dark .text-indigo-650, .dark .text-blue-500, .dark .text-indigo-500, .dark .text-blue-700, .dark .text-blue-400, .dark .text-indigo-400 {
          color: var(--brand-bright) !important;
        }
        .dark .text-indigo-800, .dark .text-blue-800, .dark .text-indigo-900, .dark .text-blue-900, .dark .text-indigo-950, .dark .text-blue-950, .dark .text-indigo-905 {
          color: #f8fafc !important;
        }
        .dark .text-indigo-300, .dark .text-blue-300 {
          color: var(--brand-bright) !important;
          opacity: 0.95 !important;
        }

        /* Border Colors */
        .light .border-blue-600, .light .border-indigo-600, .light .border-blue-500, .light .border-indigo-500 {
          border-color: var(--primary-color) !important;
        }
        .dark .border-blue-600, .dark .border-indigo-600, .dark .border-blue-500, .dark .border-indigo-500 {
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        .light .border-blue-100, .light .border-indigo-100, .light .border-blue-200, .light .border-indigo-200, .light .border-blue-300, .light .border-indigo-300, .light .border-indigo-700\\/10, .light .border-indigo-700\\/20, .light .border-indigo-900\\/30, .light .border-indigo-900\\/40, .light .border-blue-400\\/15, .light .hover\\:border-indigo-500:hover, .light .hover\\:border-blue-500:hover, .light .hover\\:border-indigo-600:hover, .light .hover\\:border-blue-600:hover {
          border-color: var(--primary-light) !important;
        }
        .dark .border-blue-100, .dark .border-indigo-100, .dark .border-blue-200, .dark .border-indigo-200, .dark .border-blue-300, .dark .border-indigo-300, .dark .border-indigo-700\\/10, .dark .border-indigo-700\\/20, .dark .border-indigo-900\\/30, .dark .border-indigo-900\\/40, .dark .border-blue-400\\/15, .dark .hover\\:border-indigo-500:hover, .dark .hover\\:border-blue-500:hover, .dark .hover\\:border-indigo-600:hover, .dark .hover\\:border-blue-600:hover {
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        /* Gradients */
        .light .from-blue-50, .light .from-indigo-50 {
          background-image: linear-gradient(to right, var(--primary-light-bg), transparent) !important;
        }
        .dark .from-blue-50, .dark .from-indigo-50 {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05), transparent) !important;
        }

        .light .to-blue-50, .light .to-indigo-50 {
          background-image: linear-gradient(to left, var(--primary-light-bg), transparent) !important;
        }
        .dark .to-blue-50, .dark .to-indigo-50 {
          background-image: linear-gradient(to left, rgba(255, 255, 255, 0.05), transparent) !important;
        }

        /* Interaction Utilities */
        .accent-indigo-600, .accent-blue-600 {
          accent-color: var(--primary-color) !important;
        }
        .ring-indigo-600, .ring-blue-650 {
          --tw-ring-color: var(--primary-color) !important;
        }
        .focus\\:ring-indigo-500:focus, .focus\\:ring-blue-500:focus {
          --tw-ring-color: var(--primary-color) !important;
        }
      `}</style>
      
      {/* MOBILE TRIGGER BACKDROP */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* MOBILE SIDEBAR/DRAWER */}
      <aside className={`fixed inset-y-0 left-0 w-64 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300'} border-r z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-out transform md:hidden print:hidden ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </aside>

      {/* LEFT NAVIGATION DRAWER (Utility Blue Sidebar) - Hidden during print */}
      <aside className={`hidden md:flex w-60 border-r shrink-0 flex-col justify-between print:hidden h-screen sticky top-0 overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
        {renderSidebarContent(false)}
      </aside>

      {/* RIGHT VIEWPORT VIEW CANVAS CONTAINER */}
      <main className="flex-grow flex flex-col min-h-[100dvh] overflow-x-hidden relative max-w-full">
        
        {/* Mobile Navigation Button (FAB) */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-900/20 flex items-center justify-center transition-transform active:scale-95 print:hidden"
          title="Open Navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* TOP STATUS HEADER PANEL - Hidden during print */}
        <header className={`h-11 px-4 border-b flex items-center justify-between shrink-0 print:hidden z-10 sticky top-0 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1 px-1.5 rounded mr-1 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 md:hidden cursor-pointer"
              title="Open Navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-black uppercase tracking-wider hidden sm:inline-block">
              Verification Node-3
            </span>
            <div className="text-[10px] text-slate-400 font-medium hidden md:inline">
              Laboratory Calibration Terminal • Active connection • Latency 12ms
            </div>
          </div>

          {/* Centered logo container for mobile viewposts */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:hidden select-none">
            <img 
              src={pescoLogo} 
              alt="PESCO Logo" 
              className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-xs" 
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] font-black tracking-tight uppercase text-slate-800 dark:text-slate-100">
              PESCO MTL
            </span>
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
        <div className={`p-2 sm:p-4 flex-grow overflow-y-auto print:p-0 print:bg-white relative ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
          
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
                  syncStatus={syncStatus}
                  lastSyncedTime={lastSyncedTime}
                  onRefreshAllData={handlePullAllFromDatabase}
                  availableSims={availableSims}
                  outwardRecords={outwardRecords}
                />
              )}

              {activePageId === 'receipt_register' && (
                <RegisterView 
                  receipts={receipts} 
                  onAddReceipt={handleAddReceipt} 
                  onAddBulkReceipts={handleAddBulkReceipts}
                  currentUser={currentUser} 
                  meters={meters}
                  onPushMeterToInventory={handlePushMeterToInventory}
                  onPushBulkMetersToInventory={handlePushBulkMetersToInventory}
                />
              )}

              {activePageId === 'outward_register' && (
                <OutwardRegisterView
                  outwardRecords={outwardRecords}
                  onAddOutwardRecord={handleAddOutwardRecord}
                  currentUser={currentUser}
                  meters={meters}
                  cts={cts}
                  pts={pts}
                />
              )}

              {activePageId === 'meter_inventory' && (
                <InventoryView 
                  meters={meters} 
                  receipts={receipts}
                  reports={reports}
                  onUpdateStockStatus={handleUpdateStockStatus} 
                  onUpdateBulkStockStatus={handleUpdateBulkStockStatus}
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
                  receipts={receipts}
                  onUpdateSIMDetails={handleUpdateSIMDetails} 
                  currentUser={currentUser} 
                  availableSims={availableSims}
                  onUpdateAvailableSims={handleUpdateAvailableSims}
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
                  onUpdateUserProfile={handleUpdateUserProfile}
                  onRemoveDuplicateUsers={handleRemoveDuplicateUsers}
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
                  onUpdateUserProfile={handleUpdateUserProfile}
                  onRemoveDuplicateUsers={handleRemoveDuplicateUsers}
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
                  availableSims={availableSims}
                  setAvailableSims={handleUpdateAvailableSims}
                  outwardRecords={outwardRecords}
                  setOutwardRecords={setOutwardRecords}
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

      {/* CLEAR LOCAL DATA MODAL OVERLAY */}
      {isClearDataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center shrink-0 border border-amber-500/20 text-amber-500 dark:text-amber-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black tracking-tight uppercase text-slate-900 dark:text-white">
                  Reset Laboratory State Database
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  This will override your current browser-cached local registers. Choose a baseline model to set up your laboratory calibration state:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option A: Factory Baseline Seeds */}
              <button
                onClick={() => {
                  handleClearLocalData(true);
                  setIsClearDataModalOpen(false);
                }}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950/80 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-3 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-blue-500/10 dark:bg-blue-400/15 flex items-center justify-center text-blue-500 dark:text-blue-400 border border-blue-500/20">
                  <Database className="w-4 h-4 fill-blue-500/10" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Restore Baseline Seed Records
                  </p>
                  <p className="text-[9.5px] text-slate-400 font-medium truncate">
                    Re-seeds meters, equipment receipts, reports, standards, and CT/PT lists.
                  </p>
                </div>
              </button>

              {/* Option B: Fully Empty Database */}
              <button
                onClick={() => {
                  handleClearLocalData(false);
                  setIsClearDataModalOpen(false);
                }}
                className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950/80 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-3 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-red-500/10 dark:bg-red-400/15 flex items-center justify-center text-red-500 dark:text-red-400 border border-red-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    Reset to a Completely Empty State
                  </p>
                  <p className="text-[9.5px] text-slate-400 font-medium truncate">
                    Wipes all local entries. Ideal for entering real laboratory-specific datasets.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                onClick={() => setIsClearDataModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[11px] font-bold transition border border-slate-200/40 dark:border-slate-700/50"
              >
                Cancel Setup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
