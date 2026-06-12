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
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
  LogIn,
  KeyRound,
  Shield,
  User,
  HeartCrack,
  Check,
  Sparkles
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { SEED_USERS } from '../data/seedData';
import pescoLogo from '../assets/images/pesco_logo.jpg';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  isDarkMode: boolean;
}

export default function LoginView({ onLoginSuccess, isDarkMode }: LoginViewProps) {
  // Navigation mode transitions between 'signin' and 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Role toggles inside Sign In screen
  const [roleType, setRoleType] = useState<'circle_supervisor' | 'staff'>('circle_supervisor');
  
  // General Form Input States
  const [email, setEmail] = useState('');
  const [circleCode, setCircleCode] = useState('261');
  const [password, setPassword] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  
  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('circle_supervisor');
  const [signUpCircleCode, setSignUpCircleCode] = useState('261');
  const [signUpDesignation, setSignUpDesignation] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Demo select state for seed users
  const [selectedStaffUserId, setSelectedStaffUserId] = useState(SEED_USERS[0].id);

  // Error/Success feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Local Accounts Database stored in LocalStorage for dynamic authentication simulation
  const [registeredUsers, setRegisteredUsers] = useState<UserType[]>(() => {
    try {
      const stored = localStorage.getItem('mtlms_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const PESCO_CIRCLES = [
    { code: '261', name: 'Peshawar Circle' },
    { code: '262', name: 'Khyber Circle' },
    { code: '263', name: 'Mardan Circle' },
    { code: '265', name: 'Swat Circle' },
    { code: '266', name: 'Bannu Circle' },
    { code: '268', name: 'Swabi Circle' },
    { code: '269', name: 'DI Khan Circle' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsAuthenticating(true);

    // Dynamic SSO Handshake timing simulation
    setTimeout(() => {
      try {
        if (roleType === 'circle_supervisor') {
          // Email syntax validation
          if (!email || !email.includes('@') || email.length < 5) {
            setErrorMsg('Please enter a valid PESCO corporate email address.');
            setIsAuthenticating(false);
            return;
          }

          // Search in registered users first to match custom signed up accounts
          const registeredMatch = registeredUsers.find(
            u => u.email.toLowerCase().trim() === email.toLowerCase().trim() && u.role === 'circle_supervisor'
          );

          if (registeredMatch) {
            onLoginSuccess(registeredMatch);
            setIsAuthenticating(false);
            return;
          }

          // Fallback to auto-simulated login for smooth instant onboarding
          const matchedCircle = PESCO_CIRCLES.find(c => c.code === circleCode);
          if (!matchedCircle) {
            setErrorMsg('Invalid circle jurisdiction code selected.');
            setIsAuthenticating(false);
            return;
          }

          const resolvedName = supervisorName.trim() || `Circle Supervisor (${matchedCircle.name})`;

          const loggedInUser: UserType = {
            id: `usr-sup-${circleCode}-${Date.now()}`,
            name: resolvedName,
            email: email.toLowerCase().trim(),
            role: 'circle_supervisor',
            designation: `PESCO Circle Officer (${matchedCircle.code})`,
            circleCode: matchedCircle.code
          };

          onLoginSuccess(loggedInUser);
        } else {
          // Check if there is a custom registered staff user matching this email
          const registeredStaffMatch = registeredUsers.find(
            u => u.email.toLowerCase().trim() === email.toLowerCase().trim() && u.role !== 'circle_supervisor'
          );

          if (registeredStaffMatch) {
            onLoginSuccess(registeredStaffMatch);
            setIsAuthenticating(false);
            return;
          }

          // Fallback to predefined seed corporate laboratory profiles
          const matchedStaff = SEED_USERS.find(u => u.id === selectedStaffUserId);
          if (matchedStaff) {
            onLoginSuccess(matchedStaff);
          } else {
            setErrorMsg('Selected laboratory staff profile cannot be found.');
          }
        }
      } catch (err) {
        setErrorMsg('Authentication protocol failed. Please verify security parameters.');
      } finally {
        setIsAuthenticating(false);
      }
    }, 700);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Form Assertions
    if (!signUpName.trim()) {
      setErrorMsg('Full name and official credentialing identity is required.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMsg('Please provide a valid corporate email address.');
      return;
    }
    if (signUpPassword.length < 4) {
      setErrorMsg('PIN passcode should contain at least 4 alphanumeric digits.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg('Password confirmation mismatch. Please sync credentials.');
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      try {
        // Enforce unique emails
        const emailDuplicated = registeredUsers.some(
          u => u.email.toLowerCase().trim() === signUpEmail.toLowerCase().trim()
        ) || SEED_USERS.some(
          u => u.email.toLowerCase().trim() === signUpEmail.toLowerCase().trim()
        );

        if (emailDuplicated) {
          setErrorMsg('An application account is already mapped to this corporate email.');
          setIsAuthenticating(false);
          return;
        }

        // Establish the designation title
        let computedDesignation = signUpDesignation.trim();
        if (!computedDesignation) {
          if (signUpRole === 'circle_supervisor') {
            const matchedCircle = PESCO_CIRCLES.find(c => c.code === signUpCircleCode);
            computedDesignation = `PESCO Circle Officer (${matchedCircle?.name || signUpCircleCode})`;
          } else if (signUpRole === 'lab_manager') {
            computedDesignation = 'Laboratory Executive & Manager';
          } else if (signUpRole === 'testing_engineer') {
            computedDesignation = 'Senior Testing Field Engineer';
          } else if (signUpRole === 'administrator') {
            computedDesignation = 'System Administrator';
          } else {
            computedDesignation = 'Laboratory Intake Officer';
          }
        }

        const newUser: UserType = {
          id: `usr-reg-${Math.floor(1000 + Math.random() * 9000)}`,
          name: signUpName.trim(),
          email: signUpEmail.toLowerCase().trim(),
          role: signUpRole,
          designation: computedDesignation,
          circleCode: signUpRole === 'circle_supervisor' ? signUpCircleCode : undefined
        };

        // Persist to register database
        const updatedList = [...registeredUsers, newUser];
        setRegisteredUsers(updatedList);
        localStorage.setItem('mtlms_registered_users', JSON.stringify(updatedList));

        // Update standard login email state to permit quick log in
        setEmail(newUser.email);
        if (newUser.circleCode) {
          setCircleCode(newUser.circleCode);
          setRoleType('circle_supervisor');
        } else {
          setRoleType('staff');
        }

        setSuccessMsg(`Registration success! Corporate profile issued for ${newUser.name}. Please sign-in above.`);
        setAuthMode('signin');
      } catch (err) {
        setErrorMsg('Failed to process and seal cryptographical profile on server.');
      } finally {
        setIsAuthenticating(false);
      }
    }, 850);
  };

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

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Banner Top Brand */}
        <div className="bg-slate-900 p-6 text-white border-b border-slate-800/85 relative">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center">
            {/* Centered PESCO Logo */}
            <div className="w-20 h-20 bg-white rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-700 shadow-xl mb-3 p-1.5 transition-transform hover:scale-105 duration-300">
              <img 
                src={pescoLogo} 
                alt="PESCO Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>

            <h1 className="text-[15px] font-black tracking-widest text-blue-400 uppercase leading-none">
              PESCO MTLMS PORTAL
            </h1>
            <p className="text-[9.5px] text-slate-400 uppercase tracking-widest font-extrabold mt-1.5">
              METERS TESTING LABORATORY & GRID COMPLIANCE SYSTEM
            </p>
            <div className="mt-2 text-[10.5px] text-slate-400 max-w-xs font-semibold leading-relaxed">
              Meters Operations, Terminal Auditing and Central Security Clearance
            </div>
          </div>
        </div>

        {/* Auth Mode Toggle Switch */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wide transition-all inline-flex items-center justify-center gap-1.5 border cursor-pointer ${
              authMode === 'signin'
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-750 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In Access
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wide transition-all inline-flex items-center justify-center gap-1.5 border cursor-pointer ${
              authMode === 'signup'
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-750 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up Register
          </button>
        </div>

        {/* Global Notifications Panel */}
        {errorMsg && (
          <div className="m-5 mb-0 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-450 animate-bounce">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="m-5 mb-0 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs text-emerald-650 dark:text-emerald-450 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 font-bold" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* MODE 1: SIGN IN VIEW */}
        {authMode === 'signin' ? (
          <div className="animate-fadeIn duration-200">
            {/* Circle vs Lab Staff Sub-Tab Selection (Preserved Exactly) */}
            <div className="flex border-b border-slate-200/70 dark:border-slate-800/80 mx-6 pt-4">
              <button
                type="button"
                onClick={() => { setRoleType('circle_supervisor'); setErrorMsg(''); }}
                className={`flex-1 pb-2.5 text-[10.5px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  roleType === 'circle_supervisor' 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                1. Circle Supervisor
              </button>
              <button
                type="button"
                onClick={() => { setRoleType('staff'); setErrorMsg(''); }}
                className={`flex-1 pb-2.5 text-[10.5px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  roleType === 'staff' 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                2. Laboratory Staff
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {roleType === 'circle_supervisor' ? (
                <div className="space-y-4">
                  {/* Informational Clearance Gating Block */}
                  <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/15 text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Clearance Jurisdiction Active
                    </div>
                    Only designated regional circle supervisors from Peshawar, Khyber, Mardan and other PESCO circles are cleared to proceed.
                  </div>

                  {/* Corporate Supervisor Email */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-5 w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Officer Designation (Optional default) */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                      Officer Identity Name (Optional Bypass)
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
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-55 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* PESCO Circle Code Selection */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider flex justify-between">
                      <span>Circle Jursidiction Workspace</span>
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

                    {/* Quick circle badges */}
                    <div className="grid grid-cols-4 gap-1 pt-1.5">
                      {PESCO_CIRCLES.map((c) => (
                        <div 
                          key={c.code}
                          onClick={() => setCircleCode(c.code)}
                          className={`p-1 text-center text-[9px] rounded border cursor-pointer transition-all ${
                            circleCode === c.code 
                              ? 'bg-blue-600 border-blue-600 text-white font-black shadow-xs scale-102' 
                              : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-350 dark:hover:bg-slate-800'
                          }`}
                        >
                          {c.code}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password Lock Key */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                      Security Passcode Alphanumeric Pin
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
                  {/* Laboratory staff selector bypass */}
                  <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/15 text-[10.5px] text-slate-600 dark:text-slate-300">
                    <p className="font-bold uppercase text-amber-500 tracking-wide mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Bypass Quick Simulation Keys
                    </p>
                    Choose any pre-existing staff profile with full verification clearance to view, calibrate, and issuing reports:
                  </div>

                  {/* Select seed profiles */}
                  <div className="space-y-1.5">
                    <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                      Pre-Seeded Laboratory Profile Selection
                    </label>
                    <select
                      value={selectedStaffUserId}
                      onChange={(e) => setSelectedStaffUserId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800 dark:text-slate-200"
                    >
                      {SEED_USERS.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Simulated security token */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                      Auto Passcode Bypass Authorization
                    </label>
                    <input
                      type="text"
                      disabled
                      value="BYPASS_SEC_HANDSHAKE_GRANTED_OK"
                      className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-600 font-mono text-center tracking-wide font-black"
                    />
                  </div>
                </div>
              )}

              {/* Submit terminal button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md mt-6 cursor-pointer"
              >
                {isAuthenticating ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying Access Credentials...
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
        ) : (
          /* MODE 2: SIGN UP VIEW (DYNAMIC Corporate Account Creation) */
          <div className="animate-fadeIn duration-200">
            <form onSubmit={handleSignUp} className="p-6 space-y-4">
              
              <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/15 text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed leading-snug">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wide mb-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  Request Regional Workspace Credentials
                </div>
                Create a dynamic profile to authenticate custom logs, actions, and regional parameters representing your direct testing jurisdiction.
              </div>

              {/* Input Full Name */}
              <div className="space-y-1">
                <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                  Full Name & Designation
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engr. Arshad Mahmood"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-505 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Input Email Address */}
              <div className="space-y-1">
                <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="username@pesco.com.pk"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* select Role Type */}
              <div className="space-y-1">
                <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider flex justify-between">
                  <span>Assigned System Security Clearance Group</span>
                </label>
                <select
                  value={signUpRole}
                  onChange={(e) => setSignUpRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="circle_supervisor">Circle Supervisor (View Jurisdiction Only)</option>
                  <option value="lab_manager">Laboratory Manager (Full Authorizing Signatory)</option>
                  <option value="testing_engineer">Testing Engineer (Register, Calibrate, Seals)</option>
                  <option value="data_entry_operator">Intake Operator (Registration & Receipts)</option>
                  <option value="administrator">System Administrator (Root Controls)</option>
                </select>
              </div>

              {/* Conditional Circle Selection if Circle Supervisor */}
              {signUpRole === 'circle_supervisor' && (
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 animate-in slide-in-from-top-1">
                  <label className="block text-[9.5px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    Select Your Specific Circle Jurisdiction
                  </label>
                  <select
                    value={signUpCircleCode}
                    onChange={(e) => setSignUpCircleCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800 dark:text-slate-200"
                  >
                    {PESCO_CIRCLES.map((circle) => (
                      <option key={circle.code} value={circle.code}>
                        Circle {circle.code} — {circle.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customize Designation title (Optional) */}
              <div className="space-y-1">
                <label className="block text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider flex justify-between">
                  <span>Custom Corporate Designation Title</span>
                  <span className="text-[8.5px] text-slate-400 italic">Optional</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Building className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Deputy Manager (QA/QC Circle)"
                    value={signUpDesignation}
                    onChange={(e) => setSignUpDesignation(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Set Password / Passcode */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                    Security Password PIN
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. 1234"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">
                    Confirm PIN Code
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. 1234"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Register Active Account Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md mt-6 cursor-pointer"
              >
                {isAuthenticating ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fusing Cryptographic Identity...
                  </span>
                ) : (
                  <>
                    Seal Identity & Issue Profile
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300/20" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Security Footnote */}
        <div className="py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-850 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Sec-256 Gated Identity Provider • PES-MTLMS</span>
        </div>

      </div>
    </div>
  );
}
