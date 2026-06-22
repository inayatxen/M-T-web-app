import React, { useState } from 'react';
import { UserType, EquipmentReceipt, User } from '../types';
import LoginView from './LoginView';
import RegisterView from './RegisterView';
import { Smartphone, Building, Menu, LogOut, Search, Plus, User as UserIcon, Signal, Wifi, Battery } from 'lucide-react';

interface AndroidMeterAppProps {
  currentUser: UserType | null;
  users: UserType[];
  receipts: EquipmentReceipt[];
  onAddReceipt: (record: EquipmentReceipt) => void;
  onAddBulkReceipts: (records: EquipmentReceipt[]) => void;
  onLoginSuccess: (user: UserType) => void;
  onSignOut: () => void;
  onExitAndroidMode: () => void;
}

export default function AndroidMeterApp({
  currentUser,
  users,
  receipts,
  onAddReceipt,
  onAddBulkReceipts,
  onLoginSuccess,
  onSignOut,
  onExitAndroidMode
}: AndroidMeterAppProps) {
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col font-sans">
        {/* Android Status Bar Simulation */}
        <div className="h-6 bg-slate-950 flex items-center justify-between px-3 text-[10px] text-slate-300 font-medium z-50 relative shrink-0">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5 opacity-80">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-4 h-4 ml-0.5" />
          </div>
        </div>

        {/* Auth Screen */}
        <div className="flex-1 overflow-auto">
          {/* We reuse the generic LoginView but it occupies full space */}
          <LoginView
            onLoginSuccess={onLoginSuccess}
            isDarkMode={true}
            users={users}
            syncStatus="synced"
          />
        </div>
        
        {/* Exit Button */}
        <div className="absolute top-8 right-4 z-[60]">
          <button 
            onClick={onExitAndroidMode}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-full shadow border border-slate-700"
          >
            Exit Android App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col font-sans sm:max-w-md sm:mx-auto sm:shadow-2xl sm:border-x sm:border-slate-800 overflow-hidden">
      {/* Android Status Bar Simulation Component */}
      <div className="h-6 bg-indigo-700 dark:bg-slate-950 flex items-center justify-between px-3 text-[10px] text-white/90 font-medium shrink-0 z-50 relative">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-1.5 opacity-90">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <Battery className="w-4 h-4 ml-0.5" />
        </div>
      </div>

      {/* Material App Bar */}
      <header className="h-14 bg-indigo-600 dark:bg-slate-900 shadow-md flex items-center justify-between px-4 text-white shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <Menu className="w-5 h-5 text-white/80" />
          <h1 className="text-lg font-medium tracking-tight">Inward Register</h1>
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-white/80" />
          <button onClick={onSignOut} className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition">
            <LogOut className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </header>

      {/* Android Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 pb-20">
        {/* We reuse RegisterView but customized implicitly by passing context if needed. Since RegisterView is responsive, it will adapt gracefully, but we wrap it to ensure it feels native */}
        <div className="p-2">
          <RegisterView 
            receipts={receipts}
            onAddReceipt={onAddReceipt}
            onAddBulkReceipts={onAddBulkReceipts}
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Android Floating Action Button (Simulated Visual element as an aesthetic enhancement) */}
      <button 
        className="absolute bottom-20 right-4 w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform z-20 pointer-events-none opacity-0"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Material Bottom Navigation */}
      <nav className="h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around shrink-0 pb-1 px-2 z-10">
        <button className="flex flex-col items-center gap-1 text-indigo-600 dark:text-indigo-400 p-2 cursor-pointer">
          <Building className="w-5 h-5" />
          <span className="text-[10px] font-medium">Inward</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 p-2 cursor-pointer">
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 p-2 cursor-pointer">
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
        <button 
          onClick={onExitAndroidMode}
          className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 p-2 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </nav>
    </div>
  );
}
