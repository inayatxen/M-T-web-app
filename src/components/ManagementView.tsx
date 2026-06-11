/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  UserCheck, 
  Download, 
  Upload, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Settings,
  ShieldAlert,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { User, AuditLog, CalibrationStandard, UserRole } from '../types';

interface ManagementViewProps {
  users: User[];
  onUpdateRole: (role: UserRole) => void;
  currentUser: User;
  auditLogs: AuditLog[];
  standards: CalibrationStandard[];
  onAddStandard: (std: CalibrationStandard) => void;
  onUpdateStandard: (id: string, multiplier: number) => void;
  onBackupState: () => void;
  onRestoreState: (jsonContent: string) => boolean;
}

export default function ManagementView({
  users,
  onUpdateRole,
  currentUser,
  auditLogs,
  standards,
  onAddStandard,
  onUpdateStandard,
  onBackupState,
  onRestoreState
}: ManagementViewProps) {
  
  const [activePane, setActivePane] = useState<'profile' | 'audit' | 'settings' | 'backup'>('profile');
  const [newStdName, setNewStdName] = useState('');
  const [newStdVal, setNewStdVal] = useState('');
  const [newStdMult, setNewStdMult] = useState(1.0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local file state for restore
  const [uploadedFileText, setUploadedFileText] = useState('');

  const registerNewStandard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStdName || !newStdVal) return;

    onAddStandard({
      id: `std-gen-${Date.now()}`,
      name: newStdName,
      standardValue: newStdVal,
      multiplier: newStdMult
    });

    setNewStdName('');
    setNewStdVal('');
    setSuccessMsg('Calibration standard registered successfully.');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleImportRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setUploadedFileText(text);
      }
    };
    reader.readAsText(file);
  };

  const triggerStateRestore = () => {
    try {
      if (!uploadedFileText) {
        setErrorMsg('Please choose a valid backup JSON file first.');
        return;
      }
      const success = onRestoreState(uploadedFileText);
      if (success) {
        setSuccessMsg('Laboratory database successfully restored from system backup!');
        setUploadedFileText('');
      } else {
        setErrorMsg('Data restoration failed: corrupt schema or missing root elements.');
      }
    } catch {
      setErrorMsg('Data restoration failed: invalid JSON formatting.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab controls with title bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            System Control & Lab Configuration
          </h2>
          <p className="text-xs text-slate-500">Rotate testing roles, configure calibration reference benches, audit logs, and download offline snapshots.</p>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setActivePane('profile')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activePane === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Role Simulation
          </button>
          <button
            onClick={() => setActivePane('audit')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activePane === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            System Audit Trail
          </button>
          <button
            onClick={() => setActivePane('settings')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activePane === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Calibration Standards
          </button>
          <button
            onClick={() => setActivePane('backup')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activePane === 'backup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Backup & Restore
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-bold rounded flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {activePane === 'profile' && (
        /* Role Simulations */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex gap-2 items-center text-sm font-extrabold text-indigo-950 uppercase">
              <Users className="w-5 h-5 text-indigo-650" />
              Role-Based Access Simulation Drawer
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Laboratory software checks permissions adaptively depending on staff hierarchy. Shift into specific roles below to demo view permissions and calibration parameters configuration:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
              {[
                { 
                  role: 'administrator', 
                  title: 'Administrator Mode', 
                  sub: 'Configure reference standards, evaluate audit logs, edit roles, backup master DB databases.' 
                },
                { 
                  role: 'lab_manager', 
                  title: 'Lab Manager Mode', 
                  sub: 'Overlook calibrations, certify dispute cases, sign-off compliance certificates, approve reports.' 
                },
                { 
                  role: 'testing_engineer', 
                  title: 'Testing Engineer Mode', 
                  sub: 'Trigger calibration bench, enter phase dials, report discrepancies, execute testing forms.' 
                },
                { 
                  role: 'data_entry_operator', 
                  title: 'Data Entry Operator Mode', 
                  sub: 'Log incoming meters, update receipts lists, input IMEI details, register logistics condition.' 
                },
                { 
                  role: 'circle_supervisor', 
                  title: 'Circle Supervisor Mode', 
                  sub: 'Review local dispute meters, verify calibration signatures, select regional compliance files.' 
                },
              ].map(r => {
                const isActive = currentUser.role === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => onUpdateRole(r.role as UserRole)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2.5 hover:shadow-md ${
                      isActive 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500' 
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">{r.title}</span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-medium">{r.sub}</p>
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isActive ? 'Simulating Active' : 'Select Simulation'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activePane === 'audit' && (
        /* Global logs Audit trails */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-150">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Global Compliance Audit Trail Ledger ({auditLogs.length})
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Legally tracking who certified metrics, changed inventory status, or created Board cases.</p>
          </div>

          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[9px]">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User & Role</th>
                  <th className="p-4">Action Performed</th>
                  <th className="p-4">Before State</th>
                  <th className="p-4">After State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {auditLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-400 font-mono text-[10px]">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{l.user}</p>
                      <span className="text-[9px] font-black uppercase text-indigo-700">{l.role}</span>
                    </td>
                    <td className="p-4 text-indigo-950 font-semibold">{l.action}</td>
                    <td className="p-4 font-mono text-rose-600 text-[10px] bg-rose-50/30">{l.oldValue}</td>
                    <td className="p-4 font-mono text-emerald-700 text-[10px] bg-emerald-50/30">{l.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePane === 'settings' && (
        /* Calibration standards configuration */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-150">
          
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
              Registered Primary Reference Standard Benches
            </span>

            <div className="divide-y divide-slate-100">
              {standards.map(s => (
                <div key={s.id} className="py-3 flex justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                    <p className="text-[10px] text-slate-400">{s.standardValue}</p>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-slate-400">Multiplier coeff:</span>
                    <strong className="text-indigo-950 font-bold bg-slate-100 px-2.5 py-0.5 rounded">{s.multiplier}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 block">Configure reference bench standard</span>
            {currentUser.role !== 'administrator' ? (
              <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                Only the designated Administrator accounts can configure reference bench standard multipliers.
              </div>
            ) : (
              <form onSubmit={registerNewStandard} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-650 mb-1">Standard Bench Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sub-class 0.01 precision standard"
                    value={newStdName}
                    onChange={(e) => setNewStdName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-650 mb-1">Precision Range</label>
                  <input
                    type="text"
                    placeholder="e.g. ±0.01%"
                    value={newStdVal}
                    onChange={(e) => setNewStdVal(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-650 mb-1">Calibration Multiplier Coeff (0.9 to 1.1)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min={0.9}
                    max={1.1}
                    value={newStdMult}
                    onChange={(e) => setNewStdMult(parseFloat(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                >
                  Register reference rule
                </button>
              </form>
            )}
          </div>

        </div>
      )}

      {activePane === 'backup' && (
        /* Backup & Restore mechanism download to text, upload from user */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          
          {/* Download JSON backup file */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Download Database backups (Backup Functionality)
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Save a local encryption snapshot of all laboratory records (Meters inventory, Receipts list, signed reports, board cases, and Audit Trails) as a portable local text JSON database.
              </p>
            </div>

            <button
              onClick={onBackupState}
              className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm mt-3.5 self-start"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Download Offline JSON Backup
            </button>
          </div>

          {/* Upload JSON backup to restore */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Restore Database snapshots (Restore Functionality)
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select a previously saved laboratory backup snapshot from your desktop to overwrite the active database records instantly.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportRestore}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-800 hover:file:bg-indigo-100 cursor-pointer"
              />

              <button
                type="button"
                onClick={triggerStateRestore}
                disabled={!uploadedFileText}
                className={`w-full py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 ${
                  uploadedFileText 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' 
                    : 'bg-slate-100 text-slate-350 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Trigger Database Restore from File
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
