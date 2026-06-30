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
  Sparkles,
  GitBranch,
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  Search,
  KeyRound
} from 'lucide-react';
import { User, AuditLog, CalibrationStandard, UserRole } from '../types';
import { PESCO_HIERARCHY, updatePescoHierarchy, PescoCircle, PescoDivision, PescoSubdivision, formatPKTDateTime, getRoleFromCircleCode, getCircleName } from '../utils';

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
  onRecordAudit?: (action: string, oldVal: string, newVal: string) => void;
  onUpdateUserPassword?: (userId: string, newPass: string) => void;
  onUpdateUserProfile?: (userId: string, updatedFields: Partial<User>) => void;
  onRemoveDuplicateUsers?: () => void;
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
  onRestoreState,
  onRecordAudit,
  onUpdateUserPassword,
  onUpdateUserProfile,
  onRemoveDuplicateUsers
}: ManagementViewProps) {
  
  const [activePane, setActivePane] = useState<'profile' | 'audit' | 'settings' | 'backup' | 'org'>('profile');
  const [localHierarchy, setLocalHierarchy] = useState<PescoCircle[]>(() => JSON.parse(JSON.stringify(PESCO_HIERARCHY)));
  
  // Selection states
  const [selectedCircle, setSelectedCircle] = useState<PescoCircle | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<PescoDivision | null>(null);
  const [selectedSubdivision, setSelectedSubdivision] = useState<PescoSubdivision | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'circle' | 'division' | 'subdivision' | null>(null);
  
  // Expanded states
  const [expandedCircles, setExpandedCircles] = useState<Record<string, boolean>>({ '261': true, '263': true });
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});

  // Search query
  const [orgSearch, setOrgSearch] = useState('');

  // Add node form states
  const [addCircleCode, setAddCircleCode] = useState('');
  const [addCircleName, setAddCircleName] = useState('');
  const [addDivisionCode, setAddDivisionCode] = useState('');
  const [addDivisionName, setAddDivisionName] = useState('');
  const [addSubdivisionCode, setAddSubdivisionCode] = useState('');
  const [addSubdivisionName, setAddSubdivisionName] = useState('');

  // Edit states for currently selected node
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [isEditingNode, setIsEditingNode] = useState(false);
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

  // Organizational Hierarchy Mutation Helpers
  const commitHierarchyChanges = (newHierarchy: PescoCircle[], auditMessage: string, oldVal: string, newVal: string) => {
    setLocalHierarchy(newHierarchy);
    updatePescoHierarchy(newHierarchy);
    if (onRecordAudit) {
      onRecordAudit(auditMessage, oldVal, newVal);
    }
  };

  const handleAddCircle = (e: React.FormEvent) => {
    e.preventDefault();
    const code = addCircleCode.trim();
    const name = addCircleName.trim().toUpperCase();
    if (!code || !name) {
      setErrorMsg('Circle Code and Name are required.');
      return;
    }
    if (localHierarchy.some(c => c.code === code)) {
      setErrorMsg(`Circle Code ${code} already exists.`);
      return;
    }
    const updated = [...localHierarchy, { code, name, divisions: [] }];
    commitHierarchyChanges(updated, `Added PESCO Circle: ${name} (${code})`, 'N/A', `Circle: ${name} (${code})`);
    
    setAddCircleCode('');
    setAddCircleName('');
    setSuccessMsg(`Circle ${name} added successfully!`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleAddDivision = (parentCircleCode: string, e: React.FormEvent) => {
    e.preventDefault();
    const code = addDivisionCode.trim();
    const name = addDivisionName.trim().toUpperCase();
    if (!code || !name) {
      setErrorMsg('Division Code and Name are required.');
      return;
    }
    const existingDiv = localHierarchy.flatMap(c => c.divisions).find(d => d.code === code);
    if (existingDiv) {
      setErrorMsg(`Division Code ${code} already exists (assigned to ${existingDiv.name}).`);
      return;
    }
    
    const updated = localHierarchy.map(c => {
      if (c.code === parentCircleCode) {
        return {
          ...c,
          divisions: [...c.divisions, { code, name, subdivisions: [] }]
        };
      }
      return c;
    });
    
    commitHierarchyChanges(updated, `Added PESCO Division ${name} (${code}) under Circle ${parentCircleCode}`, 'N/A', `Division: ${name} (${code})`);
    
    setAddDivisionCode('');
    setAddDivisionName('');
    const updatedCircle = updated.find(c => c.code === parentCircleCode) || null;
    setSelectedCircle(updatedCircle);
    setSuccessMsg(`Division ${name} registered successfully.`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleAddSubdivision = (parentCircleCode: string, parentDivisionCode: string, e: React.FormEvent) => {
    e.preventDefault();
    const code = addSubdivisionCode.trim();
    const name = addSubdivisionName.trim().toUpperCase();
    if (!code || !name) {
      setErrorMsg('Subdivision Code and Name are required.');
      return;
    }
    
    const existingSub = localHierarchy
      .flatMap(c => c.divisions)
      .flatMap(d => d.subdivisions)
      .find(s => s.code === code);
    if (existingSub) {
      setErrorMsg(`Subdivision Code ${code} already exists (assigned to ${existingSub.name}).`);
      return;
    }
    
    const updated = localHierarchy.map(c => {
      if (c.code === parentCircleCode) {
        return {
          ...c,
          divisions: c.divisions.map(d => {
            if (d.code === parentDivisionCode) {
              return {
                ...d,
                subdivisions: [...d.subdivisions, { code, name }]
              };
            }
            return d;
          })
        };
      }
      return c;
    });
    
    commitHierarchyChanges(updated, `Added PESCO Subdivision ${name} (${code}) under Division ${parentDivisionCode}`, 'N/A', `Subdivision: ${name} (${code})`);
    
    setAddSubdivisionCode('');
    setAddSubdivisionName('');
    
    const updatedCircle = updated.find(c => c.code === parentCircleCode) || null;
    const updatedDiv = updatedCircle?.divisions.find(d => d.code === parentDivisionCode) || null;
    setSelectedCircle(updatedCircle);
    setSelectedDivision(updatedDiv);
    setSuccessMsg(`Subdivision ${name} registered successfully.`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleEditNode = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = editCode.trim();
    const newName = editName.trim().toUpperCase();
    if (!newCode || !newName) {
      setErrorMsg('Code and Name are required.');
      return;
    }

    if (!selectedLevel) return;

    let updated: PescoCircle[] = [];
    let oldLabel = '';
    let newLabel = `${newName} (${newCode})`;

    if (selectedLevel === 'circle' && selectedCircle) {
      oldLabel = `${selectedCircle.name} (${selectedCircle.code})`;
      if (newCode !== selectedCircle.code && localHierarchy.some(c => c.code === newCode)) {
        setErrorMsg(`Circle Code ${newCode} is already in use.`);
        return;
      }
      updated = localHierarchy.map(c => {
        if (c.code === selectedCircle.code) {
          return { ...c, code: newCode, name: newName };
        }
        return c;
      });
      const fut = updated.find(c => c.code === newCode) || null;
      setSelectedCircle(fut);
    } 
    else if (selectedLevel === 'division' && selectedCircle && selectedDivision) {
      oldLabel = `${selectedDivision.name} (${selectedDivision.code})`;
      if (newCode !== selectedDivision.code && localHierarchy.flatMap(c => c.divisions).some(d => d.code === newCode)) {
        setErrorMsg(`Division Code ${newCode} is already in use.`);
        return;
      }
      updated = localHierarchy.map(c => {
        if (c.code === selectedCircle.code) {
          return {
            ...c,
            divisions: c.divisions.map(d => {
              if (d.code === selectedDivision.code) {
                return { ...d, code: newCode, name: newName };
              }
              return d;
            })
          };
        }
        return c;
      });
      const futC = updated.find(c => c.code === selectedCircle.code) || null;
      const futD = futC?.divisions.find(d => d.code === newCode) || null;
      setSelectedCircle(futC);
      setSelectedDivision(futD);
    } 
    else if (selectedLevel === 'subdivision' && selectedCircle && selectedDivision && selectedSubdivision) {
      oldLabel = `${selectedSubdivision.name} (${selectedSubdivision.code})`;
      if (newCode !== selectedSubdivision.code && localHierarchy.flatMap(c => c.divisions).flatMap(d => d.subdivisions).some(s => s.code === newCode)) {
        setErrorMsg(`Subdivision Code ${newCode} is already in use.`);
        return;
      }
      updated = localHierarchy.map(c => {
        if (c.code === selectedCircle.code) {
          return {
            ...c,
            divisions: c.divisions.map(d => {
              if (d.code === selectedDivision.code) {
                return {
                  ...d,
                  subdivisions: d.subdivisions.map(s => {
                    if (s.code === selectedSubdivision.code) {
                      return { ...s, code: newCode, name: newName };
                    }
                    return s;
                  })
                };
              }
              return d;
            })
          };
        }
        return c;
      });
      const futC = updated.find(c => c.code === selectedCircle.code) || null;
      const futD = futC?.divisions.find(d => d.code === selectedDivision.code) || null;
      const futS = futD?.subdivisions.find(s => s.code === newCode) || null;
      setSelectedCircle(futC);
      setSelectedDivision(futD);
      setSelectedSubdivision(futS);
    }

    commitHierarchyChanges(updated, `Modified PESCO ${selectedLevel}: ${oldLabel} to ${newLabel}`, oldLabel, newLabel);
    setIsEditingNode(false);
    setSuccessMsg(`${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} modified successfully.`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleDeleteNode = (level: 'circle' | 'division' | 'subdivision', item: any) => {
    if (!window.confirm(`Are you absolutely sure you want to delete this ${level} (${item.name})? All sub-offices will be removed as well!`)) {
      return;
    }

    let updated: PescoCircle[] = [];
    const oldLabel = `${item.name} (${item.code})`;

    if (level === 'circle') {
      updated = localHierarchy.filter(c => c.code !== item.code);
      setSelectedCircle(null);
      setSelectedDivision(null);
      setSelectedSubdivision(null);
      setSelectedLevel(null);
    } 
    else if (level === 'division' && selectedCircle) {
      updated = localHierarchy.map(c => {
        if (c.code === selectedCircle.code) {
          return {
            ...c,
            divisions: c.divisions.filter(d => d.code !== item.code)
          };
        }
        return c;
      });
      setSelectedDivision(null);
      setSelectedSubdivision(null);
      setSelectedLevel('circle');
    } 
    else if (level === 'subdivision' && selectedCircle && selectedDivision) {
      updated = localHierarchy.map(c => {
        if (c.code === selectedCircle.code) {
          return {
            ...c,
            divisions: c.divisions.map(d => {
              if (d.code === selectedDivision.code) {
                return {
                  ...d,
                  subdivisions: d.subdivisions.filter(s => s.code !== item.code)
                };
              }
              return d;
            })
          };
        }
        return c;
      });
      setSelectedSubdivision(null);
      setSelectedLevel('division');
    }

    commitHierarchyChanges(updated, `Deleted PESCO ${level}: ${oldLabel}`, oldLabel, 'DELETED');
    setSuccessMsg(`${level.charAt(0).toUpperCase() + level.slice(1)} deleted successfully.`);
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
          <button
            onClick={() => setActivePane('org')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activePane === 'org' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Organizational Editor
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

          {/* Member Security Passwords Registry - ADMINISTRATOR EXCLUSIVE */}
          {currentUser?.role === 'administrator' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex gap-2 items-center text-sm font-extrabold text-indigo-950 uppercase">
                  <KeyRound className="w-5 h-5 text-indigo-650 animate-pulse" />
                  Member Security Passwords & Directory Registry
                </div>
                {onRemoveDuplicateUsers && (
                  <button
                    type="button"
                    onClick={onRemoveDuplicateUsers}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer animate-pulse"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Duplicate Users
                  </button>
                )}
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Configure regional jurisdictions and verify authentication credentials for each laboratory team member below. Passwords and jurisdictions can be synchronized remotely to the central Supabase database ledger.
              </p>

              {/* Automatic Role Assignment Helper Information Box */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-slate-600 space-y-2">
                <div className="font-extrabold text-indigo-955 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-650" />
                  Jurisdiction-Based Role Assignment Matrix (Central Protocols)
                </div>
                <p className="text-slate-500 leading-relaxed">
                  In compliance with PESCO laboratory security protocols, a member's workspace environment is strictly configured based on their assigned regional circle code. Assigning a circle jurisdiction automatically maps their role and system designation:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-1 font-bold text-[10px]">
                  <div className="p-1 px-2.5 bg-indigo-100/40 rounded border border-indigo-150">Code 261 (PESHAWAR) <br/>→ Lab Manager</div>
                  <div className="p-1 px-2.5 bg-amber-100/40 rounded border border-amber-150">Code 262 (KHYBER) <br/>→ Test Engineer</div>
                  <div className="p-1 px-2.5 bg-emerald-100/40 rounded border border-emerald-150">Code 263 (MARDAN) <br/>→ Intake Operator</div>
                  <div className="p-1 px-2.5 bg-purple-100/40 rounded border border-purple-150">Code 266 (SWAT) <br/>→ System Admin</div>
                  <div className="p-1 px-2.5 bg-blue-100/40 rounded border border-blue-150">Others (Bannu, Hazara...) <br/>→ Supervisor</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse divide-y divide-slate-100">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                      <th className="p-3">Team Officer</th>
                      <th className="p-3">PESCO Circle Jurisdiction</th>
                      <th className="p-3">Assigned Role</th>
                      <th className="p-3">Corporate Email</th>
                      <th className="p-3">Authentication PIN/Password</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u, uIdx) => {
                      return (
                        <tr key={`${u.id}-${uIdx}`} className="hover:bg-slate-50/40">
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{u.designation}</span>
                          </td>
                          <td className="p-3">
                            <select
                              value={u.circleCode || ''}
                              onChange={(e) => {
                                const nextCircle = e.target.value;
                                const mapping = getRoleFromCircleCode(nextCircle);
                                if (onUpdateUserProfile) {
                                  onUpdateUserProfile(u.id, {
                                    circleCode: nextCircle || undefined,
                                    role: mapping.role as any,
                                    designation: mapping.designation
                                  });
                                }
                              }}
                              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-650 cursor-pointer"
                            >
                              <option value="">— Unassigned —</option>
                              {localHierarchy.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} — {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-slate-550 font-mono">{u.email}</td>
                          <td className="p-3">
                            <input
                              type="text"
                              defaultValue={u.password || 'password123'}
                              id={`user-pass-input-${u.id}`}
                              placeholder="Enter password..."
                              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono w-44 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const inputEl = document.getElementById(`user-pass-input-${u.id}`) as HTMLInputElement;
                                if (inputEl && onUpdateUserPassword) {
                                  onUpdateUserPassword(u.id, inputEl.value.trim());
                                  alert(`Security PIN password for ${u.name} successfully updated to "${inputEl.value.trim()}".`);
                                }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] px-3 py-1 rounded transition flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Password
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                    <td className="p-4 text-slate-400 font-mono text-[10px]">{formatPKTDateTime(l.timestamp)}</td>
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

      {activePane === 'org' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Permission simulation bar */}
          {currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager' && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="font-bold">Simulation Mode: Read-Only Jurisdiction</strong>
                  <p className="text-[10px] text-amber-700 mt-0.5">You are currently logged in as a simulated <span className="font-bold uppercase text-indigo-900">{currentUser.role.replace('_', ' ')}</span>. Modify your active role simulation to <strong>Administrator</strong> or <strong>Lab Manager</strong> to create, edit, or delete codes.</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateRole('administrator')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[9px] rounded-lg tracking-wider transition shrink-0"
              >
                Simulate Administrator Access
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Hand: Tree browser */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">PESCO Hierarchy Tree</h3>
                  <p className="text-[10px] text-slate-400">Expand and tap nodes to view details or add child offices.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCircle(null);
                    setSelectedDivision(null);
                    setSelectedSubdivision(null);
                    setSelectedLevel(null);
                    setIsEditingNode(false);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold text-indigo-650 hover:bg-indigo-50 rounded"
                >
                  Clear Selection
                </button>
              </div>

              {/* Search query field */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter name or office code..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Collapsed/Expanded controller triggers */}
              <div className="flex gap-2 text-[10px] font-bold text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    const allExp: Record<string, boolean> = {};
                    localHierarchy.forEach(c => { allExp[c.code] = true; });
                    setExpandedCircles(allExp);
                  }}
                  className="hover:text-indigo-600"
                >
                  Expand All
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCircles({});
                    setExpandedDivisions({});
                  }}
                  className="hover:text-indigo-600"
                >
                  Collapse All
                </button>
              </div>

              {/* Hierarchical Tree Body */}
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
                {localHierarchy
                  .filter(circle => {
                    if (!orgSearch) return true;
                    const query = orgSearch.toUpperCase();
                    const matchesCircle = circle.name.includes(query) || circle.code.includes(query);
                    const matchesDiv = circle.divisions.some(d => 
                      d.name.includes(query) || d.code.includes(query) ||
                      d.subdivisions.some(s => s.name.includes(query) || s.code.includes(query))
                    );
                    return matchesCircle || matchesDiv;
                  })
                  .map(circle => {
                    const isCircleExpanded = expandedCircles[circle.code] || !!orgSearch;
                    const isCircleSelected = selectedLevel === 'circle' && selectedCircle?.code === circle.code;

                    return (
                      <div key={circle.code} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        {/* Circle Header */}
                        <div 
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            isCircleSelected 
                              ? 'bg-indigo-50/70 border-l-4 border-indigo-600' 
                              : 'bg-slate-50/50 hover:bg-slate-100/50'
                          }`}
                          onClick={() => {
                            setSelectedCircle(circle);
                            setSelectedDivision(null);
                            setSelectedSubdivision(null);
                            setSelectedLevel('circle');
                            setIsEditingNode(false);
                            setEditCode(circle.code);
                            setEditName(circle.name);
                            setExpandedCircles(p => ({ ...p, [circle.code]: !p[circle.code] }));
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-200 rounded font-bold text-slate-700">
                              Circle {circle.code}
                            </span>
                            <span className="font-extrabold text-xs text-slate-800 tracking-tight">
                              {circle.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {circle.divisions.length} Divs
                          </span>
                        </div>

                        {/* Divisions List */}
                        {isCircleExpanded && (
                          <div className="p-2 bg-white border-t border-slate-50 space-y-1.5 pl-4">
                            {circle.divisions
                              .filter(div => {
                                if (!orgSearch) return true;
                                const query = orgSearch.toUpperCase();
                                const matchesDiv = div.name.includes(query) || div.code.includes(query);
                                const matchesSub = div.subdivisions.some(s => s.name.includes(query) || s.code.includes(query));
                                return matchesDiv || matchesSub;
                              })
                              .map(div => {
                                const isDivExpanded = expandedDivisions[div.code] || !!orgSearch;
                                const isDivSelected = selectedLevel === 'division' && selectedDivision?.code === div.code;

                                return (
                                  <div key={div.code} className="border-l border-slate-200 pl-2">
                                    {/* Division row */}
                                    <div 
                                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                        isDivSelected 
                                          ? 'bg-sky-50 text-sky-950 font-bold border-l-2 border-sky-500' 
                                          : 'hover:bg-slate-50 text-slate-700'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCircle(circle);
                                        setSelectedDivision(div);
                                        setSelectedSubdivision(null);
                                        setSelectedLevel('division');
                                        setIsEditingNode(false);
                                        setEditCode(div.code);
                                        setEditName(div.name);
                                        setExpandedDivisions(p => ({ ...p, [div.code]: !p[div.code] }));
                                      }}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <span className="text-[8.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                                          {div.code}
                                        </span>
                                        <span className="text-xs font-semibold">{div.name}</span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-bold">
                                        {div.subdivisions.length} Subs
                                      </span>
                                    </div>

                                    {/* Subdivisions List */}
                                    {isDivExpanded && (
                                      <div className="pl-6 pt-1 space-y-1 pb-1">
                                        {div.subdivisions
                                          .filter(sub => {
                                            if (!orgSearch) return true;
                                            const query = orgSearch.toUpperCase();
                                            return sub.name.includes(query) || sub.code.includes(query);
                                          })
                                          .map(sub => {
                                            const isSubSelected = selectedLevel === 'subdivision' && selectedSubdivision?.code === sub.code;

                                            return (
                                              <div 
                                                key={sub.code}
                                                className={`flex items-center justify-between p-1.5 pl-2 rounded-md cursor-pointer text-slate-600 transition-colors ${
                                                  isSubSelected 
                                                    ? 'bg-emerald-50 text-emerald-950 font-extrabold border-l border-emerald-500' 
                                                    : 'hover:bg-slate-50'
                                                }`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedCircle(circle);
                                                  setSelectedDivision(div);
                                                  setSelectedSubdivision(sub);
                                                  setSelectedLevel('subdivision');
                                                  setIsEditingNode(false);
                                                  setEditCode(sub.code);
                                                  setEditName(sub.name);
                                                }}
                                              >
                                                <div className="flex items-center gap-1.5">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                  <span className="text-[8px] font-mono text-slate-400">
                                                    {sub.code}
                                                  </span>
                                                  <span className="text-[11px] font-medium">{sub.name}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Hand Column: Management Actions */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col space-y-5 justify-start">
              
              {/* Context Selected Node Display */}
              {selectedLevel ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full inline-block mb-1.5">
                        Selected: {selectedLevel}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {selectedLevel === 'circle' && selectedCircle?.name}
                        {selectedLevel === 'division' && selectedDivision?.name}
                        {selectedLevel === 'subdivision' && selectedSubdivision?.name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-slate-500 mt-1">
                        Global ID Code: {selectedLevel === 'circle' && selectedCircle?.code}
                        {selectedLevel === 'division' && selectedDivision?.code}
                        {selectedLevel === 'subdivision' && selectedSubdivision?.code}
                      </p>
                      
                      {selectedLevel === 'circle' && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Parent company code: 26000 (PESCO). Holds {selectedCircle?.divisions.length || 0} testing divisions.
                        </p>
                      )}
                      {selectedLevel === 'division' && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Belongs to Circle: <strong className="font-bold text-indigo-950">{selectedCircle?.name} ({selectedCircle?.code})</strong>. Holds {selectedDivision?.subdivisions.length || 0} sub-offices.
                        </p>
                      )}
                      {selectedLevel === 'subdivision' && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Root Path: <strong className="font-bold text-indigo-950">{selectedCircle?.name} › {selectedDivision?.name}</strong>. Parent Division Code: {selectedDivision?.code}.
                        </p>
                      )}
                    </div>

                    {/* Delete and Edit trigger toggles */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingNode(!isEditingNode);
                          if (!isEditingNode) {
                            if (selectedLevel === 'circle' && selectedCircle) {
                              setEditCode(selectedCircle.code);
                              setEditName(selectedCircle.name);
                            } else if (selectedLevel === 'division' && selectedDivision) {
                              setEditCode(selectedDivision.code);
                              setEditName(selectedDivision.name);
                            } else if (selectedLevel === 'subdivision' && selectedSubdivision) {
                              setEditCode(selectedSubdivision.code);
                              setEditName(selectedSubdivision.name);
                            }
                          }
                        }}
                        disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                        className="p-2 text-indigo-650 hover:bg-indigo-50 border border-slate-200 rounded-lg transition disabled:text-slate-350 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        title="Edit Name/Code"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedLevel === 'circle') handleDeleteNode('circle', selectedCircle);
                          if (selectedLevel === 'division') handleDeleteNode('division', selectedDivision);
                          if (selectedLevel === 'subdivision') handleDeleteNode('subdivision', selectedSubdivision);
                        }}
                        disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                        className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg transition disabled:text-slate-350 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        title="Delete office code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditingNode && (
                    <form onSubmit={handleEditNode} className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4 font-semibold text-xs">
                      <div className="flex gap-1 items-center font-extrabold text-[#111] uppercase tracking-wide">
                        <Edit2 className="w-4 h-4 text-indigo-600" />
                        Modify {selectedLevel} record
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 mb-1">Office Name (Uppercase)</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-slate-800 font-bold"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Office Code Identifier</label>
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg font-mono font-bold text-slate-800"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setIsEditingNode(false)}
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Sub-node Addition forms */}
                  {selectedLevel === 'circle' && selectedCircle && (
                    <form 
                      onSubmit={(e) => handleAddDivision(selectedCircle.code, e)}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 font-semibold text-xs text-slate-650"
                    >
                      <div className="flex gap-1.5 items-center font-extrabold text-[#111] uppercase border-b border-slate-100 pb-2.5">
                        <FolderPlus className="w-4 h-4 text-indigo-600" />
                        Create New Division under {selectedCircle.name}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 mb-1">Division Local Name</label>
                          <input
                            type="text"
                            placeholder="e.g. CITY DIVISION"
                            value={addDivisionName}
                            onChange={(e) => setAddDivisionName(e.target.value)}
                            disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:cursor-not-allowed"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Division Unique Code (Recommend {selectedCircle.code}X)</label>
                          <input
                            type="text"
                            placeholder={`e.g. ${selectedCircle.code}9`}
                            value={addDivisionCode}
                            onChange={(e) => setAddDivisionCode(e.target.value)}
                            disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono font-bold disabled:cursor-not-allowed text-slate-800"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:bg-slate-150 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        Register New Division Under Circle {selectedCircle.code}
                      </button>
                    </form>
                  )}

                  {selectedLevel === 'division' && selectedCircle && selectedDivision && (
                    <form 
                      onSubmit={(e) => handleAddSubdivision(selectedCircle.code, selectedDivision.code, e)}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 font-semibold text-xs text-slate-650"
                    >
                      <div className="flex gap-1.5 items-center font-extrabold text-[#111] uppercase border-b border-slate-100 pb-2.5">
                        <FolderPlus className="w-4 h-4 text-indigo-600" />
                        Create New Subdivision under {selectedDivision.name}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-600 mb-1">Subdivision Name</label>
                          <input
                            type="text"
                            placeholder="e.g. CHOWK ADRIAN"
                            value={addSubdivisionName}
                            onChange={(e) => setAddSubdivisionName(e.target.value)}
                            disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:cursor-not-allowed"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1">Subdivision Code (Recommend {selectedDivision.code}X)</label>
                          <input
                            type="text"
                            placeholder={`e.g. ${selectedDivision.code}3`}
                            value={addSubdivisionCode}
                            onChange={(e) => setAddSubdivisionCode(e.target.value)}
                            disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono font-bold disabled:cursor-not-allowed text-slate-800"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:bg-slate-150 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        Register Subdivision in Division {selectedDivision.code}
                      </button>
                    </form>
                  )}

                </div>
              ) : (
                /* Static state summary & Add Circle Form */
                <div className="space-y-6">
                  
                  {/* General Stats summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-150">
                      <span className="text-[9px] font-bold text-indigo-650 block uppercase tracking-wider">Circles</span>
                      <strong className="text-xl font-extrabold text-indigo-950 mt-1 block font-mono">
                        {localHierarchy.length}
                      </strong>
                    </div>

                    <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-150">
                      <span className="text-[9px] font-bold text-sky-650 block uppercase tracking-wider">Divisions</span>
                      <strong className="text-xl font-extrabold text-sky-950 mt-1 block font-mono">
                        {localHierarchy.flatMap(c => c.divisions).length}
                      </strong>
                    </div>

                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-150">
                      <span className="text-[9px] font-bold text-emerald-650 block uppercase tracking-wider">Subdivisions</span>
                      <strong className="text-xl font-extrabold text-emerald-950 mt-1 block font-mono">
                        {localHierarchy.flatMap(c => c.divisions).flatMap(d => d.subdivisions).length}
                      </strong>
                    </div>
                  </div>

                  {/* Add Circle Form container */}
                  <form 
                    onSubmit={handleAddCircle}
                    className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 font-semibold text-xs text-slate-650"
                  >
                    <div className="flex gap-1.5 items-center font-extrabold text-[#111] uppercase border-b border-slate-100 pb-2.5">
                      <Plus className="w-4 h-4 text-indigo-650 shrink-0" />
                      Add New PESCO Circle Division
                    </div>
                    
                    <p className="text-[10px] text-slate-450 leading-relaxed -mt-1 font-medium">
                      Adding a high-level circle establishes a regional workspace boundaries. Divisions can then be attached under the new circle.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-slate-650 mb-1">Circle Name (Uppercase)</label>
                        <input
                          type="text"
                          placeholder="e.g. SWAT NEW CIRCLE"
                          value={addCircleName}
                          onChange={(e) => setAddCircleName(e.target.value)}
                          disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-650 mb-1">Company Circle Code (typically 3 digits starting with 26)</label>
                        <input
                          type="text"
                          placeholder="e.g. 264"
                          value={addCircleCode}
                          onChange={(e) => setAddCircleCode(e.target.value)}
                          disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                          className="w-full text-xs p-2.5 bg-slate-55 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold disabled:cursor-not-allowed text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={currentUser.role !== 'administrator' && currentUser.role !== 'lab_manager'}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition disabled:bg-slate-150 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm"
                    >
                      Establish New PESCO Circle
                    </button>
                  </form>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-400 space-y-1.5 font-medium leading-relaxed">
                    <strong className="font-extrabold uppercase text-slate-705 block">Organizational mapping protocol note:</strong>
                    <p>
                      Meters are logged using a 14-digit Account Code. The testing system decodes Regional Circles based on the 5th digit (sub-circle digit, corresponding to code suffixes after "26" i.e. 261, 262, 263... etc) to route cases, and validates subdivision jurisdictions instantly. Creating or changing these codes must align with consumer meter distribution protocols.
                    </p>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
