/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { formatPKTTime } from '../utils';
import { 
  Database, 
  RefreshCw, 
  CloudUpload, 
  CloudDownload, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Play, 
  Copy, 
  Lock, 
  Check, 
  FlameKindling,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, testSupabaseConnection } from '../supabaseClient';
import { 
  User,
  Meter, 
  EquipmentReceipt, 
  CTRecord, 
  PTRecord, 
  CommitteeCase, 
  TestReport, 
  AuditLog, 
  CalibrationStandard,
  AvailableSIM
} from '../types';

interface SupabaseSyncViewProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  meters: Meter[];
  setMeters: React.Dispatch<React.SetStateAction<Meter[]>>;
  receipts: EquipmentReceipt[];
  setReceipts: React.Dispatch<React.SetStateAction<EquipmentReceipt[]>>;
  cts: CTRecord[];
  setCts: React.Dispatch<React.SetStateAction<CTRecord[]>>;
  pts: PTRecord[];
  setPts: React.Dispatch<React.SetStateAction<PTRecord[]>>;
  cases: CommitteeCase[];
  setCases: React.Dispatch<React.SetStateAction<CommitteeCase[]>>;
  reports: TestReport[];
  setReports: React.Dispatch<React.SetStateAction<TestReport[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  standards: CalibrationStandard[];
  setStandards: React.Dispatch<React.SetStateAction<CalibrationStandard[]>>;
  todos?: any[];
  setTodos?: React.Dispatch<React.SetStateAction<any[]>>;
  availableSims: AvailableSIM[];
  setAvailableSims: (updated: AvailableSIM[] | ((prev: AvailableSIM[]) => AvailableSIM[])) => void;
}

export default function SupabaseSyncView({
  users, setUsers,
  meters, setMeters,
  receipts, setReceipts,
  cts, setCts,
  pts, setPts,
  cases, setCases,
  reports, setReports,
  auditLogs, setAuditLogs,
  standards, setStandards,
  todos = [],
  setTodos,
  availableSims = [],
  setAvailableSims
}: SupabaseSyncViewProps) {
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [dbMessage, setDbMessage] = useState<string>('');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncDirection, setSyncDirection] = useState<'push' | 'pull' | null>(null);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Stats table sizes
  const [supabaseCounts, setSupabaseCounts] = useState<{ [key: string]: number | string }>({
    users: 'Click test',
    meters: 'Click test',
    receipts: 'Click test',
    cts: 'Click test',
    pts: 'Click test',
    cases: 'Click test',
    reports: 'Click test',
    auditLogs: 'Click test',
    standards: 'Click test',
    todos: 'Click test',
    available_sims: 'Click test',
  });

  const checkConnection = async () => {
    setDbStatus('checking');
    setProgressLog(prev => [...prev, `[${formatPKTTime()}] Testing connection to Supabase endpoint...`]);
    const res = await testSupabaseConnection();
    if (res.success) {
      setDbStatus('connected');
      setDbMessage(res.message);
      setProgressLog(prev => [...prev, `[${formatPKTTime()}] Connected structure verified!`]);
      // Query individual table row counts
      fetchSupabaseCounts();
    } else {
      setDbStatus('error');
      setDbMessage(res.message);
      setProgressLog(prev => [...prev, `[${formatPKTTime()}] CONNECTION FAILED: ${res.message}`]);
    }
  };

  const fetchSupabaseCounts = async () => {
    const tables = ['users', 'meters', 'receipts', 'cts', 'pts', 'cases', 'reports', 'auditLogs', 'standards', 'todos', 'available_sims'];
    const updated: { [key: string]: number | string } = {};

    for (const t of tables) {
      try {
        const { count, error } = await supabase
          .from(t)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          updated[t] = 'Table Missing';
        } else {
          updated[t] = count !== null ? count : 0;
        }
      } catch (err) {
        updated[t] = 'Error';
      }
    }
    setSupabaseCounts(updated);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // PostgreSQL copy-paste tables definition DDL queries
  const postgresDDL = `-- 0. Create users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT,
  designation TEXT,
  "circleCode" TEXT,
  password TEXT
);

-- 1. Create meters Table
CREATE TABLE IF NOT EXISTS meters (
  id TEXT PRIMARY KEY,
  "meterNumber" TEXT UNIQUE,
  "serialNumber" TEXT,
  manufacturer TEXT,
  "accuracyClass" TEXT,
  category TEXT,
  status TEXT,
  "stockStatus" TEXT,
  "purchaseDate" TEXT,
  "ctRatio" TEXT,
  "ptRatio" TEXT,
  imei TEXT,
  "simNumber" TEXT,
  "simInstallStatus" TEXT,
  "communicationStatus" TEXT,
  "signalStrength" INTEGER,
  iccid TEXT,
  "networkProvider" TEXT,
  "simInstalledBy" TEXT,
  "simInstallDate" TEXT,
  remarks TEXT,
  "consumerName" TEXT,
  "consumerAccount" TEXT,
  "movementHistory" JSONB
);

-- 2. Create receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  "receiptNumber" TEXT,
  "dateReceived" TEXT,
  "consumerAccount" TEXT,
  "consumerName" TEXT,
  "meterType" TEXT,
  "meterNumber" TEXT,
  "serialNumber" TEXT,
  make TEXT,
  "receivedFrom" TEXT,
  "reasonForTesting" TEXT,
  "newOrUsed" TEXT,
  "receivedBy" TEXT,
  remarks TEXT,
  "fatherName" TEXT
);

-- 3. Create cts Table
CREATE TABLE IF NOT EXISTS cts (
  id TEXT PRIMARY KEY,
  "ctNumber" TEXT,
  make TEXT,
  ratio TEXT,
  "accuracyClass" TEXT,
  "dateReceived" TEXT,
  "testDate" TEXT,
  "testResult" TEXT,
  remarks TEXT
);

-- 4. Create pts Table
CREATE TABLE IF NOT EXISTS pts (
  id TEXT PRIMARY KEY,
  "ptNumber" TEXT,
  make TEXT,
  ratio TEXT,
  "accuracyClass" TEXT,
  "dateReceived" TEXT,
  "testDate" TEXT,
  "testResult" TEXT,
  remarks TEXT
);

-- 5. Create cases Table
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  "caseNumber" TEXT,
  "accountNumber" TEXT,
  "consumerName" TEXT,
  "meterNumber" TEXT,
  "existingMeterDetails" TEXT,
  "newMeterDetails" TEXT,
  "reasonForCommitteeCheck" TEXT,
  "committeeMembers" TEXT[],
  "inspectionDate" TEXT,
  findings TEXT,
  recommendations TEXT,
  "approvalStatus" TEXT
);

-- 6. Create reports Table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  "reportNumber" TEXT,
  "meterId" TEXT,
  "testDate" TEXT,
  "consumerName" TEXT,
  "accountNumber" TEXT,
  tariff TEXT,
  "fatherName" TEXT,
  "natureOfConnection" TEXT,
  "meterNumber" TEXT,
  "meterType" TEXT,
  "meterMake" TEXT,
  "serialNumber" TEXT,
  "installationDate" TEXT,
  "removalDate" TEXT,
  readings JSONB,
  "accuracyTest" JSONB,
  discrepancies TEXT[],
  "otherDiscrepancyRemarks" TEXT,
  "checkedBy" TEXT,
  "checkedByDesignation" TEXT,
  "counterSignedBy" TEXT,
  "counterSignedByDesignation" TEXT,
  "approvalDate" TEXT,
  "qrCodeMockUrl" TEXT
);

-- 7. Create "auditLogs" Table
CREATE TABLE IF NOT EXISTS "auditLogs" (
  id TEXT PRIMARY KEY,
  "user" TEXT,
  role TEXT,
  timestamp TEXT,
  action TEXT,
  "oldValue" TEXT,
  "newValue" TEXT
);

-- 8. Create standards Table
CREATE TABLE IF NOT EXISTS standards (
  id TEXT PRIMARY KEY,
  name TEXT,
  "standardValue" TEXT,
  multiplier NUMERIC
);

-- 9. Create todos Table
CREATE TABLE IF NOT EXISTS todos (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);

-- 10. Create available_sims Table
CREATE TABLE IF NOT EXISTS available_sims (
  iccid TEXT PRIMARY KEY,
  "simNumber" TEXT,
  provider TEXT
);

-- ==========================================
-- DISABLE ROW LEVEL SECURITY (RLS) FOR PIPELINE BYPASS
-- ==========================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "auditLogs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS standards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS available_sims DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- REAL-TIME FALLBACK POLICIES IF YOU RE-ENABLE RLS OR TO BYPASS RESTRICTIONS
-- ==========================================
DROP POLICY IF EXISTS "allow_anon_meters" ON meters;
CREATE POLICY "allow_anon_meters" ON meters FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_receipts" ON receipts;
CREATE POLICY "allow_anon_receipts" ON receipts FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_cts" ON cts;
CREATE POLICY "allow_anon_cts" ON cts FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_pts" ON pts;
CREATE POLICY "allow_anon_pts" ON pts FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_cases" ON cases;
CREATE POLICY "allow_anon_cases" ON cases FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_reports" ON reports;
CREATE POLICY "allow_anon_reports" ON reports FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_auditLogs" ON "auditLogs";
CREATE POLICY "allow_anon_auditLogs" ON "auditLogs" FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_standards" ON standards;
CREATE POLICY "allow_anon_standards" ON standards FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_todos" ON todos;
CREATE POLICY "allow_anon_todos" ON todos FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_users" ON users;
CREATE POLICY "allow_anon_users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_available_sims" ON available_sims;
CREATE POLICY "allow_anon_available_sims" ON available_sims FOR ALL TO anon USING (true) WITH CHECK (true);

-- =========================================================================
-- RECOVERY / PATCH MIGRATION (RUN THIS SECURELY TO PATCH ALREADY-BUILT TABLES)
-- =========================================================================
ALTER TABLE meters ADD COLUMN IF NOT EXISTS "consumerName" TEXT;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS "consumerAccount" TEXT;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS "movementHistory" JSONB;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS "fatherName" TEXT;
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(postgresDDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Push local storage data to Supabase
  const pushStateToSupabase = async () => {
    setSyncing(true);
    setSyncDirection('push');
    setProgressLog(prev => [...prev, `[${formatPKTTime()}] Beginning high-speed remote cloud push backup...`]);

    const items = [
      { name: 'users', data: users },
      { name: 'meters', data: meters },
      { name: 'receipts', data: receipts },
      { name: 'cts', data: cts },
      { name: 'pts', data: pts },
      { name: 'cases', data: cases },
      { name: 'reports', data: reports },
      { name: 'auditLogs', data: auditLogs },
      { name: 'standards', data: standards },
      { name: 'todos', data: todos },
      { name: 'available_sims', data: availableSims },
    ];

    for (const item of items) {
      if (item.data.length === 0) {
        setProgressLog(prev => [...prev, `Skipping table [${item.name}]: No local database records found.`]);
        continue;
      }
      setProgressLog(prev => [...prev, `Pushing ${item.data.length} records to remote table [${item.name}]...`]);
      try {
        const { error } = await supabase.from(item.name).upsert(item.data as any);
        if (error) {
          setProgressLog(prev => [...prev, `⚠️ Error pushing [${item.name}]: ${error.message} (Is the SQL Schema loaded?)`]);
        } else {
          setProgressLog(prev => [...prev, `✓ Table [${item.name}] successfully synchronized in Supabase!`]);
        }
      } catch (err: any) {
        setProgressLog(prev => [...prev, `⚠️ Error pushing [${item.name}]: ${err.message || err}`]);
      }
    }

    setProgressLog(prev => [...prev, `[${formatPKTTime()}] Supabase cloud direct push completed.`]);
    setSyncing(false);
    fetchSupabaseCounts();
  };

  // Trigger instant push backup when database status becomes connected
  useEffect(() => {
    if (dbStatus === 'connected') {
      pushStateToSupabase();
    }
  }, [dbStatus]);

  // Pull remote data from Supabase
  const pullStateFromSupabase = async () => {
    setSyncing(true);
    setSyncDirection('pull');
    setProgressLog(prev => [...prev, `[${formatPKTTime()}] Fetching state indexes from Supabase...`]);

    const pullingJobs = [
      { name: 'users', stateSetter: setUsers },
      { name: 'meters', stateSetter: setMeters },
      { name: 'receipts', stateSetter: setReceipts },
      { name: 'cts', stateSetter: setCts },
      { name: 'pts', stateSetter: setPts },
      { name: 'cases', stateSetter: setCases },
      { name: 'reports', stateSetter: setReports },
      { name: 'auditLogs', stateSetter: setAuditLogs },
      { name: 'standards', stateSetter: setStandards },
      { name: 'todos', stateSetter: setTodos || (() => {}) },
      { name: 'available_sims', stateSetter: setAvailableSims },
    ];

    for (const job of pullingJobs) {
      setProgressLog(prev => [...prev, `Pulling data from table [${job.name}]...`]);
      try {
        const { data, error } = await supabase.from(job.name).select('*');
        if (error) {
          setProgressLog(prev => [...prev, `⚠️ Error pulling [${job.name}]: ${error.message}`]);
        } else if (data) {
          job.stateSetter(data);
          // Sync to local storage
          localStorage.setItem(`mtlms_${job.name}`, JSON.stringify(data));
          setProgressLog(prev => [...prev, `✓ Loaded ${data.length} records into table [${job.name}]!`]);
        }
      } catch (err: any) {
        setProgressLog(prev => [...prev, `⚠️ Error querying [${job.name}]: ${err.message || err}`]);
      }
    }

    setProgressLog(prev => [...prev, `[${formatPKTTime()}] Supabase cloud direct pull completed.`]);
    setSyncing(false);
    fetchSupabaseCounts();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Cloud Engine Integration</span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
            Supabase SQL Multi-Area Sync Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time synchronization engine connecting current local state registers to custom company-wide Supabase database instances.
          </p>
        </div>

        <button
          onClick={checkConnection}
          disabled={dbStatus === 'checking'}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dbStatus === 'checking' ? 'animate-spin' : ''}`} />
          Test Endpoint Connection
        </button>
      </div>

      {/* Connection Banner */}
      <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        dbStatus === 'connected' 
          ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300'
          : dbStatus === 'error'
          ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
          : 'bg-slate-50/50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {dbStatus === 'connected' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10 shrink-0 animate-pulse" />
            ) : dbStatus === 'error' ? (
              <XCircle className="w-5 h-5 text-rose-500 fill-rose-500/10 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-500 fill-blue-500/10 shrink-0" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase block">
              {dbStatus === 'connected' && 'SUCCESFULLY INTEGRATED'}
              {dbStatus === 'error' && 'INTEGRATION FAIL'}
              {dbStatus === 'checking' && 'VERIFYING CREDENTIALS'}
              {dbStatus === 'idle' && 'READY TO INITIALIZE'}
            </span>
            <p className="text-xs font-bold mt-1 max-w-xl leading-relaxed">
              {dbStatus === 'connected' ? dbMessage : dbStatus === 'error' ? dbMessage : 'Database client successfully mapped. Ready to test live remote capabilities.'}
            </p>
            <div className="flex gap-4 mt-2 text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
              <span className="truncate">URL: <span className="font-bold text-slate-700 dark:text-slate-300">uvqgavlqbnioqwfpjosc.supabase.co</span></span>
              <span>Key: <span className="font-bold text-slate-700 dark:text-slate-300">sb_publishable_lH...XB</span></span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            dbStatus === 'connected' 
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-200'
              : 'bg-slate-100 dark:bg-white/10 text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            {dbStatus === 'connected' ? 'ONLINE' : 'PENDING'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sync Controls Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <CloudUpload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Push Backup to Supabase</h3>
                <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-normal">
                  Send current local meter registers, CT/PT tests and logs. Merges existing primary keys smoothly.
                </p>
              </div>
              <button
                onClick={pushStateToSupabase}
                disabled={syncing}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {syncing && syncDirection === 'push' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Completing Upload...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    Push Local State Up
                  </>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CloudDownload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Pull Remote from Supabase</h3>
                <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-normal">
                  Overwrites or populates local cache with remote master records stored inside Supabase SQL servers.
                </p>
              </div>
              <button
                onClick={pullStateFromSupabase}
                disabled={syncing}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {syncing && syncDirection === 'pull' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Fetching Data...
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-3.5 h-3.5" />
                    Sync Remote Down
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Sync Comparison Status Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Database Registers Concordance</h3>
              <p className="text-[10px] font-mono text-slate-450">Active Sync Keys: 10 registers</p>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[11.5px]">
              
              <div className="p-2 px-3 flex justify-between items-center transition bg-slate-50/10">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[9.5px]">Register Table Name</span>
                <div className="flex gap-16 font-semibold uppercase text-[9.5px] text-slate-500 pr-10">
                  <span className="w-20 text-right">Local Cache</span>
                  <span className="w-20 text-right">Supabase Cloud</span>
                </div>
              </div>

              {[
                { label: 'Active User Directory', name: 'users', localCount: users.length },
                { label: 'Meter Registry', name: 'meters', localCount: meters.length },
                { label: 'Inward Receipts', name: 'receipts', localCount: receipts.length },
                { label: 'Current Transformers (CT)', name: 'cts', localCount: cts.length },
                { label: 'Potential Transformers (PT)', name: 'pts', localCount: pts.length },
                { label: 'Joint Dispute Cases', name: 'cases', localCount: cases.length },
                { label: 'Signed Reports Archive', name: 'reports', localCount: reports.length },
                { label: 'Lab Audit Logs', name: 'auditLogs', localCount: auditLogs.length },
                { label: 'Calibration Standards', name: 'standards', localCount: standards.length },
                { label: 'Live Todo Tasks', name: 'todos', localCount: todos.length },
                { label: 'Available SIM Stock', name: 'available_sims', localCount: availableSims.length }
              ].map((row, idx) => (
                <div key={idx} className="p-2.5 px-3 flex justify-between items-center hover:bg-slate-50/55 dark:hover:bg-slate-850/20 transition">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250">{row.label}</span>
                    <span className="text-[9px] font-mono text-slate-400">[{row.name}]</span>
                  </div>
                  
                  <div className="flex gap-16 font-mono text-xs pr-10">
                    <span className="w-20 text-right font-bold text-slate-800 dark:text-white">{row.localCount}</span>
                    <span className={`w-20 text-right font-black ${
                      typeof supabaseCounts[row.name] === 'number'
                        ? supabaseCounts[row.name] === row.localCount
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-450'
                        : 'text-rose-500'
                    }`}>
                      {supabaseCounts[row.name]}
                    </span>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Sync logs telemetry console */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-[10px] text-slate-350 p-3 shadow-lg max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-slate-450 font-bold uppercase text-[9px] tracking-wider">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-blue-400" /> Remote Telemetry Logs</span>
              <button 
                onClick={() => setProgressLog([])}
                className="hover:text-amber-400 text-slate-500 cursor-pointer text-[8px]"
              >
                Clear Console
              </button>
            </div>
            {progressLog.length === 0 ? (
              <p className="text-slate-500 italic">No telemetry events logged. Sync or test connectivity to populate.</p>
            ) : (
              <div className="space-y-1">
                {progressLog.map((log, idx) => {
                  let colorClass = 'text-slate-300';
                  if (log.includes('⚠️') || log.includes('FAILED')) colorClass = 'text-rose-400';
                  else if (log.includes('✓') || log.includes('successfully')) colorClass = 'text-emerald-400 animate-pulse';
                  else if (log.includes('Beginning') || log.includes('Fetching')) colorClass = 'text-indigo-300';
                  return (
                    <div key={idx} className={colorClass}>
                      {log}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right instructions sidebar layout (Copy-Paste DDL SQL) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-200 shadow space-y-4">
            <div className="flex items-center gap-2 text-white">
              <FlameKindling className="w-5 h-5 text-amber-400 fill-amber-400/20 shrink-0" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Set Up Supabase DB Schema</h3>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-450">
              Before syncing, you must create these tables in your Supabase project. Copy and paste this optimized script into your <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong>, then click <strong>Run</strong>.
            </p>

            <div className="relative">
              <div className="absolute right-2 top-2 z-10">
                <button
                  onClick={copySqlToClipboard}
                  className="p-1 px-2 bg-slate-800/80 hover:bg-slate-700/80 rounded border border-slate-700 text-[10px] font-bold text-white flex items-center gap-1 rounded transition cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={postgresDDL}
                readOnly
                className="w-full h-80 bg-slate-950 border border-slate-800 rounded font-mono text-[9px] text-slate-450 p-2.5 outline-none select-all"
              />
            </div>

            <div className="bg-blue-950/20 border border-blue-900/30 p-2.5 rounded-lg flex items-start gap-2 text-[10.5px] text-slate-300">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-slate-400">
                The schema maps all critical fields including nested types like JSONB for calibration metrics and discrepancies lists automatically!
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
