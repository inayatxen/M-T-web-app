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
  CheckCircle2
} from 'lucide-react';
import { User, UserRole } from '../types';
import { SEED_USERS } from '../data/seedData';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  isDarkMode: boolean;
}

export default function LoginView({ onLoginSuccess, isDarkMode }: LoginViewProps) {
  const [roleType, setRoleType] = useState<'circle_supervisor' | 'staff'>('circle_supervisor');
  const [email, setEmail] = useState('');
  const [circleCode, setCircleCode] = useState('261');
  const [password, setPassword] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  
  // Demo select state for seed users
  const [selectedStaffUserId, setSelectedStaffUserId] = useState(SEED_USERS[0].id);

  // Error/Success state
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
    setIsAuthenticating(true);

    // Simulate network delay for a authentic Enterprise SSO look & feel
    setTimeout(() => {
      try {
        if (roleType === 'circle_supervisor') {
          // Email validation
          if (!email || !email.includes('@') || email.length < 5) {
            setErrorMsg('Please enter a valid PESCO corporate email address.');
            setIsAuthenticating(false);
            return;
          }

          // Validate circle supervisor configuration
          const matchedCircle = PESCO_CIRCLES.find(c => c.code === circleCode);
          if (!matchedCircle) {
            setErrorMsg('Invalid circle code selected.');
            setIsAuthenticating(false);
            return;
          }

          const resolvedName = supervisorName.trim() || `Circle Supervisor (${matchedCircle.name})`;

          const loggedInUser: User = {
            id: `usr-sup-${circleCode}-${Date.now()}`,
            name: resolvedName,
            email: email.toLowerCase().trim(),
            role: 'circle_supervisor',
            designation: `PESCO Circle Officer (${matchedCircle.code})`,
            circleCode: matchedCircle.code
          };

          onLoginSuccess(loggedInUser);
        } else {
          // Staff Account log in
          const matchedStaff = SEED_USERS.find(u => u.id === selectedStaffUserId);
          if (matchedStaff) {
            onLoginSuccess(matchedStaff);
          } else {
            setErrorMsg('Selected laboratory staff profile cannot be found.');
          }
        }
      } catch (err) {
        setErrorMsg('Authentication protocol failed. Please verify credentials.');
      } finally {
        setIsAuthenticating(false);
      }
    }, 800);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Absolute floating background aesthetics */}
      <div className="absolute inset-0 bg-radial-at-t from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Banner Top Brand */}
        <div className="bg-slate-900 p-6 text-white border-b border-slate-800 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center">
            {/* Giant Centered PESCO Logo with absolute bounds fitting the shape */}
            <div className="w-24 h-24 bg-white rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-700 shadow-xl mb-4 p-1">
              <img 
                src="/src/assets/images/pesco_logo.jpg" 
                alt="PESCO Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>

            <h1 className="text-sm font-black tracking-widest text-blue-400 uppercase leading-none">
              PESCO MTLMS SYSTEM
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mt-1">
              WAPDA / Peshawar Electric Supply Company
            </p>
            <p className="text-[11px] text-slate-450 mt-1 max-w-xs font-semibold">
              Meters Testing Laboratory Compliance and Gatekeeper Gateway
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setRoleType('circle_supervisor'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${
              roleType === 'circle_supervisor' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/10' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Circle Supervisor
          </button>
          <button
            type="button"
            onClick={() => { setRoleType('staff'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${
              roleType === 'staff' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/10' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Laboratory Staff
          </button>
        </div>

        {/* Form panel body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-xs text-red-655 dark:text-red-400 animate-bounce">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {roleType === 'circle_supervisor' ? (
            <div className="space-y-4">
              
              {/* Informational Indicator block */}
              <div className="p-3.5 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/15 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  Supervisor Clearance Access Gating
                </div>
                <p>Only designated circle supervisors from PESCO circles are authorized to authenticate and view operational compliance reports under specific jurisdiction codes.</p>
              </div>

              {/* supervisor Full Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Full Name / Officer Designation
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Building className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engr. Muhammad Jan"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <p className="text-[9px] text-slate-400">Specify your designation hierarchy to log digitally signed actions accurately.</p>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Supervisor Corporate Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="username@pesco.com.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* PESCO Circle Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider flex justify-between">
                  <span>PESCO Circle Supervisor Jurisdiction Code</span>
                  <span className="text-[9px] text-blue-500 font-bold select-none uppercase">Permitted Circles Only</span>
                </label>
                <select
                  value={circleCode}
                  onChange={(e) => setCircleCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold tracking-wide"
                >
                  {PESCO_CIRCLES.map((circle) => (
                    <option key={circle.code} value={circle.code}>
                      Circle Code {circle.code} — {circle.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-1 pt-1.5">
                  {PESCO_CIRCLES.map((c) => (
                    <div 
                      key={c.code}
                      onClick={() => setCircleCode(c.code)}
                      className={`p-1.5 text-center text-[10px] rounded border cursor-pointer transition ${
                        circleCode === c.code 
                          ? 'bg-blue-600 border-blue-600 text-white font-black shadow-xs' 
                          : 'bg-slate-55 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {c.code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo PIN code */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Official Supervisor Pin Code / Credentials
                  </label>
                  <span className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold italic">Optional</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              
              <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/15 text-[11px] text-amber-850 dark:text-amber-200 space-y-1">
                <p className="font-bold uppercase tracking-wide flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  Laboratory Engineering Bypass Console
                </p>
                <p>Select any pre-seeded laboratory credentials to login and conduct calibration measurements and database adjustments.</p>
              </div>

              {/* Select seed staff user */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Operational Duty Profile
                </label>
                <select
                  value={selectedStaffUserId}
                  onChange={(e) => setSelectedStaffUserId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  {SEED_USERS.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Password simulation */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Supervisor Passcode Verification
                </label>
                <input
                  type="password"
                  disabled
                  value="DEMO_ACCOUNT_BYPASS_AUTHORIZED"
                  className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 font-mono"
                />
              </div>

            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md mt-6"
          >
            {isAuthenticating ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Decrypting Signature Keys...
              </span>
            ) : (
              <>
                Confirm Credentials & Enter Terminal
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-[10px] text-slate-400">
            System Identity Provider: Sec-256 Gated Authority
          </div>
        </form>

      </div>
    </div>
  );
}
