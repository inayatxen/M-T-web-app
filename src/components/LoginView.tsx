/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  Mail, 
  Lock, 
  ArrowRight, 
  Zap, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Shield,
  User,
  Check
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { SEED_USERS } from '../data/seedData';
import { PESCO_HIERARCHY } from '../utils';
import pescoLogo from '../assets/images/pesco_logo.jpg';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  isDarkMode: boolean;
  users?: UserType[];
}

export default function LoginView({ onLoginSuccess, isDarkMode, users = SEED_USERS }: LoginViewProps) {
  // Currently selected active role
  const [activeRole, setActiveRole] = useState<UserRole>('lab_manager');
  
  // Custom configuration states for Circle Supervisor
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [circleCode, setCircleCode] = useState('261');
  
  // Custom or standard passcode field
  const [password, setPassword] = useState('');

  // Authentication loading state
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showCredsGuide, setShowCredsGuide] = useState(false);

  // Parse Pesco Circles for display
  const PESCO_CIRCLES = PESCO_HIERARCHY.map(c => {
    const formattedName = c.name.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return {
      code: c.code,
      name: `${formattedName} Circle`
    };
  });

  // Dynamic role properties for rendering the selector options
  const roleOptions = [
    {
      role: 'lab_manager' as UserRole,
      title: 'Laboratory Manager',
      badge: 'Executive Approver',
      seedId: 'u-1',
      description: 'Review logs, authorize dispute cases, countersign calibration certificates & release final reports.',
      colorClass: 'border-indigo-500/20 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20',
      activeColorClass: 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-55/80 dark:bg-indigo-950/40 text-indigo-805 dark:text-indigo-300'
    },
    {
      role: 'testing_engineer' as UserRole,
      title: 'Testing Engineer',
      badge: 'Field Calibrator',
      seedId: 'u-2',
      description: 'Review CT/PT credentials, perform accuracy phase checks, apply physical seals & update test logs.',
      colorClass: 'border-amber-500/20 hover:border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/20',
      activeColorClass: 'ring-2 ring-amber-500 border-amber-500 bg-amber-55/80 dark:bg-amber-950/40 text-amber-805 dark:text-amber-300'
    },
    {
      role: 'data_entry_operator' as UserRole,
      title: 'Intake Operator',
      badge: 'Intake custodian',
      seedId: 'u-4',
      description: 'Receive incoming damaged or utility meters, log consumer profiles & issue custodian receipts.',
      colorClass: 'border-emerald-500/20 hover:border-emerald-500 text-emerald-650 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20',
      activeColorClass: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-55/80 dark:bg-emerald-950/40 text-emerald-805 dark:text-emerald-300'
    },
    {
      role: 'administrator' as UserRole,
      title: 'System Admin',
      badge: 'Root Security',
      seedId: 'u-3',
      description: 'Manage regional workspace hierarchies, manage system logs, perform backups & root configurations.',
      colorClass: 'border-rose-500/20 hover:border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/20',
      activeColorClass: 'ring-2 ring-rose-500 border-rose-500 bg-rose-55/80 dark:bg-rose-950/40 text-rose-805 dark:text-rose-300'
    },
    {
      role: 'circle_supervisor' as UserRole,
      title: 'Circle Supervisor',
      badge: 'Regional Auditor',
      seedId: '',
      description: 'Audit registered consumer cases, review regional meter statuses & monitor assigned circle jurisdictions.',
      colorClass: 'border-blue-500/20 hover:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/20',
      activeColorClass: 'ring-2 ring-blue-500 border-blue-500 bg-blue-55/80 dark:bg-blue-950/40 text-blue-805 dark:text-blue-300'
    }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsAuthenticating(true);

    // Dynamic SSO Handshake timing simulation
    setTimeout(() => {
      try {
        if (activeRole === 'circle_supervisor') {
          // Email syntax validation
          const trimmedEmail = supervisorEmail.trim();
          if (!trimmedEmail || !trimmedEmail.includes('@') || trimmedEmail.length < 5) {
            setErrorMsg('Please enter a valid PESCO corporate email address.');
            setIsAuthenticating(false);
            return;
          }

          const matchedCircle = PESCO_CIRCLES.find(c => c.code === circleCode);
          if (!matchedCircle) {
            setErrorMsg('Invalid circle jurisdiction code selected.');
            setIsAuthenticating(false);
            return;
          }

          if (password !== 'supervisor123') {
            setErrorMsg('Invalid security passcode PIN for Circle Supervisor (default: supervisor123).');
            setIsAuthenticating(false);
            return;
          }

          const resolvedName = supervisorName.trim() || `Circle Supervisor (${matchedCircle.name})`;

          const loggedInUser: UserType = {
            id: `usr-sup-${circleCode}-${Date.now()}`,
            name: resolvedName,
            email: trimmedEmail.toLowerCase(),
            role: 'circle_supervisor',
            designation: `PESCO Circle Officer (${matchedCircle.code})`,
            circleCode: matchedCircle.code,
            password: 'supervisor123'
          };

          onLoginSuccess(loggedInUser);
        } else {
          // Find standard seed laboratory profile representing this exact role
          const option = roleOptions.find(o => o.role === activeRole);
          if (!option || !option.seedId) {
            setErrorMsg('Matched platform role configuration cannot be resolved.');
            setIsAuthenticating(false);
            return;
          }

          const matchedStaff = users.find(u => u.id === option.seedId) || SEED_USERS.find(u => u.id === option.seedId);
          if (matchedStaff) {
            const expectedPassword = matchedStaff.password || 'password123';
            if (password !== expectedPassword) {
              setErrorMsg(`Invalid security password entered for ${matchedStaff.name}.`);
              setIsAuthenticating(false);
              return;
            }
            onLoginSuccess(matchedStaff);
          } else {
            setErrorMsg('Standard laboratory staff seed profile not found.');
          }
        }
      } catch (err) {
        setErrorMsg('Authentication protocol failed. Please verify security parameters.');
      } finally {
        setIsAuthenticating(false);
      }
    }, 650);
  };

  const currentRoleConfig = roleOptions.find(o => o.role === activeRole);
  const currentSeedUser = currentRoleConfig?.seedId 
    ? (users.find(u => u.id === currentRoleConfig.seedId) || SEED_USERS.find(u => u.id === currentRoleConfig.seedId)) 
    : null;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all relative overflow-hidden ${
      isDarkMode 
        ? 'dark bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Absolute floating technical glow lines */}
      <div className="absolute inset-0 bg-radial-at-t from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Banner Top Brand */}
        <div className="bg-slate-900 p-6 text-white border-b border-slate-800/85 relative">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center">
            {/* Centered PESCO Logo */}
            <div className="w-16 h-16 bg-white rounded-full overflow-hidden flex items-center justify-center border border-slate-700 shadow-xl mb-3 p-1.5 transition-transform hover:scale-105 duration-300">
              <img 
                src={pescoLogo} 
                alt="PESCO Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>

            <h1 className="text-[14px] font-black tracking-widest text-blue-400 uppercase leading-none">
              PESCO MTLMS PORTAL
            </h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold mt-1.5">
              METERS TESTING LABORATORY & GRID COMPLIANCE SYSTEM
            </p>
            <div className="mt-2 text-[10px] text-slate-400 max-w-sm font-semibold leading-relaxed">
              Meters Operations, Terminal Auditing and Central Security Clearance
            </div>
          </div>
        </div>

        {/* Global Notifications Panel */}
        {errorMsg && (
          <div className="m-5 mb-0 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-bounce">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}



        <div className="p-6 space-y-6">
          
          {/* SECURE TERMINAL ROLE SELECTOR */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Select Authorized System Access Role
            </h3>
            
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {roleOptions.map((opt) => {
                const isActive = activeRole === opt.role;
                return (
                  <div
                    key={opt.role}
                    id={`role-opt-${opt.role}`}
                    onClick={() => {
                      setActiveRole(opt.role);
                      setErrorMsg('');
                      setPassword('');
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex items-start gap-3 relative ${
                      isActive 
                        ? opt.activeColorClass 
                        : 'border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isActive ? (
                        <div className="w-4 h-4 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center animate-in scale-in duration-150">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center bg-white dark:bg-slate-900" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold tracking-tight ${
                          isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {opt.title}
                        </span>
                        <span className="text-[8.5px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-4">
            
            {activeRole === 'circle_supervisor' ? (
              <div className="space-y-4">
                {/* Informational Clearance Gating Block */}
                <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/15 text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-405 uppercase tracking-wide mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Clearance Jurisdiction Active
                  </div>
                  Only designated regional circle supervisors from Peshawar, Khyber, Mardan and other PESCO circles are cleared to proceed with custom workspaces.
                </div>

                {/* Corporate Supervisor Email */}
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Supervisor Corporate Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. supervisor.khyber@pesco.com.pk"
                      value={supervisorEmail}
                      onChange={(e) => setSupervisorEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Officer Designation / Name */}
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Officer Identity Name (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Engr. Muhammad Jan (Auth Officer)"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* PESCO Circle Code Selection */}
                <div className="space-y-2">
                  <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex justify-between">
                    <span>Circle Jurisdiction Workspace</span>
                    <span className="text-[8.5px] text-blue-500 font-bold uppercase">Assigned Circle Code</span>
                  </label>
                  <select
                    value={circleCode}
                    onChange={(e) => setCircleCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800 dark:text-slate-200"
                  >
                    {PESCO_CIRCLES.map((circle) => (
                      <option key={circle.code} value={circle.code}>
                        Code {circle.code} — {circle.name}
                      </option>
                    ))}
                  </select>

                  {/* Quick-select circle code badges */}
                  <div className="grid grid-cols-4 gap-1 pt-0.5">
                    {PESCO_CIRCLES.map((c) => (
                      <div 
                        key={c.code}
                        id={`quick-circle-${c.code}`}
                        onClick={() => setCircleCode(c.code)}
                        className={`p-1 text-center text-[9px] rounded border cursor-pointer transition-all ${
                          circleCode === c.code 
                            ? 'bg-blue-600 border-blue-600 text-white font-black shadow-sm scale-102' 
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-350 dark:hover:bg-slate-800'
                        }`}
                      >
                        {c.code}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Security Passcode PIN
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Laboratory staff selection view */}
                <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-500/15 text-[10.5px] text-slate-600 dark:text-slate-300">
                  <p className="font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wide mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Assigned Officer Identity
                  </p>
                  Selected profile is fully mapped and cleared to view, calibrate, and release corporate certificates:
                </div>

                {/* Profile card view */}
                {currentSeedUser && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {currentSeedUser.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold truncate uppercase">
                          {currentSeedUser.designation}
                        </p>
                      </div>
                    </div>

                    <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono grid grid-cols-1 gap-1 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <div><strong className="text-slate-400">CORP EMAIL:</strong> {currentSeedUser.email}</div>
                    </div>
                  </div>
                )}

                {/* Secure password input */}
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Enter Personal Security Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit terminal button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-855 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md mt-6 cursor-pointer"
            >
              {isAuthenticating ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Establishing Secure Session Handshake...
                </span>
              ) : (
                <>
                  Decrypt & Enter Secure Terminal
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footnote */}
        <div className="py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-850 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Sec-256 Gated Identity Provider • PES-MTLMS</span>
        </div>

      </div>
    </div>
  );
}
