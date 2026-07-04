/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Flame, Info, CheckCircle, AlertTriangle, Cpu, Radio, Hash } from 'lucide-react';
import { Meter, CTRecord, PTRecord } from '../types';

interface NotificationsProps {
  meters: Meter[];
  cts: CTRecord[];
  pts: PTRecord[];
  onNavigateToPage: (pageId: string) => void;
}

export default function Notifications({ meters, cts, pts, onNavigateToPage }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Dynamic notification checks
  const pendingMeters = meters.filter(m => m.status === 'pending_testing');
  const pendingReports = meters.filter(m => m.status === 'passed' || m.status === 'failed');
  const pendingSIMMeters = meters.filter(m => m.category === 'smart' && m.simInstallStatus === 'Pending');
  const pendingCTRatio = cts.filter(c => c.testResult === 'pending');
  const pendingPTRatio = pts.filter(p => p.testResult === 'pending');

  const notificationsList = [
    ...pendingMeters.map(m => ({
      id: `m-test-${m.id}`,
      type: 'pending_test',
      title: 'Meter Testing Pending',
      message: `${m.meterNumber} (${m.manufacturer}) is waiting for lab entry.`,
      severity: 'warning',
      page: m.category === 'single_phase' ? 'single_phase_testing' : 
            (m.category === 'three_phase_whole' || m.category === 'bi_directional_three_phase_whole') ? 'three_phase_whole_testing' :
            m.category === 'three_phase_ct' ? 'three_phase_ct_testing' : 'three_phase_ct_pt_testing',
      icon: Cpu,
    })),
    ...pendingReports.map(m => ({
      id: `m-report-${m.id}`,
      type: 'report_approval',
      title: 'Test Approved / Awaiting PDF Signatures',
      message: `${m.meterNumber} has completed accuracy tests. Approval pending.`,
      severity: 'info',
      page: 'report_generation',
      icon: CheckCircle,
    })),
    ...pendingSIMMeters.map(m => ({
      id: `sim-pending-${m.id}`,
      type: 'sim_pending',
      title: 'Smart Meter SIM Installation Needed',
      message: `${m.meterNumber} does not have an active cellular SIM installed.`,
      severity: 'error',
      page: 'smart_sim',
      icon: Radio,
    })),
    ...pendingCTRatio.map(c => ({
      id: `ct-pending-${c.id}`,
      type: 'transformer_due',
      title: 'Current Transformer Testing Due',
      message: `Transformer ${c.ctNumber} (Ratio: ${c.ratio}) is queued for inspection.`,
      severity: 'warning',
      page: 'ct_testing',
      icon: Hash,
    })),
    ...pendingPTRatio.map(p => ({
      id: `pt-pending-${p.id}`,
      type: 'transformer_due',
      title: 'Potential Transformer Testing Due',
      message: `Transformer ${p.ptNumber} (Ratio: ${p.ratio}) check layout is empty.`,
      severity: 'warning',
      page: 'pt_testing',
      icon: Hash,
    })),
  ];

  const totalCount = notificationsList.length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Lab Notifications Center"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {totalCount > 0 && (
          <span 
            id="notification-badge"
            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse"
          >
            {totalCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2.5 w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-50 px-4 py-3.5 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              Laboratory Alerts ({totalCount})
            </h3>
            {totalCount > 0 && (
              <span className="text-xs bg-rose-100 text-rose-800 font-medium px-2 py-0.5 rounded-full">
                Action Required
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
            {notificationsList.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800">All Clear!</p>
                <p className="text-xs text-slate-400 mt-1">No pending notifications found in the lab.</p>
              </div>
            ) : (
              notificationsList.map(n => {
                const IconComponent = n.icon;
                return (
                  <div
                    key={n.id}
                    className="p-3.5 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer"
                    onClick={() => {
                      onNavigateToPage(n.page);
                      setIsOpen(false);
                    }}
                  >
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                      n.severity === 'error' ? 'bg-rose-50 text-rose-600' :
                      n.severity === 'warning' ? 'bg-amber-50 text-amber-600' :
                      'bg-sky-50 text-sky-600'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium capitalize ${
                          n.severity === 'error' ? 'bg-rose-100 text-rose-800' :
                          n.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {n.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                      <span className="inline-block text-[10px] font-semibold text-indigo-600 hover:underline mt-2">
                        View Testing Console &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-4 py-2 text-center border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            Power Distribution Lab Status Telemetry • Active
          </div>
        </div>
      )}
    </div>
  );
}
