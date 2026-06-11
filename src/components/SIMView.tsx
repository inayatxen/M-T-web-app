/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  HelpCircle, 
  CheckCircle,
  Wifi, 
  AlertTriangle, 
  Cpu, 
  User, 
  Zap,
  CheckCircle2,
  Play
} from 'lucide-react';
import { Meter } from '../types';

interface SIMViewProps {
  meters: Meter[];
  onUpdateSIMDetails: (meterId: string, updatedFields: Partial<Meter>) => void;
  currentUser: any;
}

export default function SIMView({ meters, onUpdateSIMDetails, currentUser }: SIMViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Form Field State
  const [imei, setImei] = useState('');
  const [iccid, setIccid] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [networkProvider, setNetworkProvider] = useState('Verizon Wireless');
  const [simInstallStatus, setSimInstallStatus] = useState<'Pending' | 'Installed' | 'Communication Verified'>('Installed');
  const [signalStrength, setSignalStrength] = useState(4);
  const [remarks, setRemarks] = useState('');

  // Filter list to only Smart meters
  const smartMeters = meters.filter(m => m.category === 'smart');

  const filteredSmartMeters = smartMeters.filter(m => {
    return (
      m.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.simNumber && m.simNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.imei && m.imei.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const selectMeterForSIMEdit = (m: Meter) => {
    setSelectedMeterId(m.id);
    setImei(m.imei || '');
    setIccid(m.iccid || '');
    setSimNumber(m.simNumber || '');
    setNetworkProvider(m.networkProvider || 'Verizon Wireless');
    setSimInstallStatus(m.simInstallStatus || 'Installed');
    setSignalStrength(m.signalStrength || 3);
    setRemarks(m.remarks || '');
  };

  const handleSIMFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeterId) return;

    const today = new Date().toISOString().split('T')[0];

    onUpdateSIMDetails(selectedMeterId, {
      imei,
      iccid,
      simNumber,
      networkProvider,
      simInstallStatus,
      communicationStatus: simInstallStatus === 'Communication Verified' ? 'Online' : 'Offline',
      signalStrength,
      simInstalledBy: currentUser.name,
      simInstallDate: today,
      remarks: remarks || undefined
    });

    setSelectedMeterId(null);
  };

  const handlesTestConnection = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setSimInstallStatus('Communication Verified');
      if (selectedMeterId) {
        onUpdateSIMDetails(selectedMeterId, {
          simInstallStatus: 'Communication Verified',
          communicationStatus: 'Online',
          signalStrength: 5,
          remarks: 'Ping audit responsive. Handshake latency 44ms.'
        });
      }
    }, 2000);
  };

  const renderSignalBars = (level: number) => {
    return (
      <div className="flex gap-0.5 items-end h-3.5 w-6" title={`Signal strength: ${level}/5`}>
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            style={{ height: `${bar * 20}%` }}
            className={`w-1 rounded-t-sm transition-all ${
              bar <= level 
              ? level >= 4 
                ? 'bg-emerald-500' 
                : level >= 2 
                  ? 'bg-amber-400' 
                  : 'bg-rose-500'
              : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
            Smart Grid Cellular SIM Provisioning
          </h2>
          <p className="text-xs text-slate-500">Configure IMEI IDs, ICCID serial parameters, and register carrier network handshakes for high-voltage telemetry heads.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Grid Sidebar: Smart Meters */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cellular Meter Registry ({smartMeters.length})
              </span>
              <div className="relative max-w-xs w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter IMEI / SIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSmartMeters.length === 0 ? (
                <div className="p-8 text-center text-slate-400 col-span-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-xs">No Smart Meters Provisioned</p>
                </div>
              ) : (
                filteredSmartMeters.map(sm => {
                  let statusColor = 'bg-rose-50 text-rose-700 border-rose-100';
                  if (sm.simInstallStatus === 'Installed') {
                    statusColor = 'bg-amber-50 text-amber-700 border-amber-100';
                  } else if (sm.simInstallStatus === 'Communication Verified') {
                    statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  }

                  return (
                    <div
                      key={sm.id}
                      onClick={() => selectMeterForSIMEdit(sm)}
                      className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3.5 ${
                        selectedMeterId === sm.id 
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500' 
                        : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-extrabold font-mono text-indigo-950 text-xs">{sm.meterNumber}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{sm.manufacturer}</span>
                        </div>
                        {renderSignalBars(sm.signalStrength || 0)}
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span>IMEI:</span>
                          <strong className="font-mono text-slate-800">{sm.imei || 'Not Assumed'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>SIM Num:</span>
                          <strong className="font-mono text-slate-800">{sm.simNumber || 'Not Provisions'}</strong>
                        </div>
                      </div>

                      <div className="flex justify-between border-t border-slate-100 pt-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${statusColor}`}>
                          {sm.simInstallStatus || 'Pending SIM'}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {sm.communicationStatus === 'Online' ? '🟢 Online' : '🔴 Offline'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right side Provision Form */}
        <div className="lg:col-span-1">
          {selectedMeterId ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-950">
                    SIM Provisioning Drawer
                  </h3>
                  <p className="text-[10px] text-indigo-600 font-semibold">Editing: {meters.find(m => m.id === selectedMeterId)?.meterNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedMeterId(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSIMFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-705 mb-1 uppercase">IMEI Number (15 Digits)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 86209100123910"
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-705 mb-1 uppercase">ICCID Number (19 Digits)</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={iccid}
                    onChange={(e) => setIccid(e.target.value.replace(/\D/g, ''))}
                    placeholder="899100128312019..."
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-705 mb-1 uppercase">SIM Serial Phone Number</label>
                  <input
                    type="text"
                    value={simNumber}
                    onChange={(e) => setSimNumber(e.target.value)}
                    placeholder="Active sim phone contact"
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-705 mb-1 uppercase">Network Carrier Provider</label>
                  <select
                    value={networkProvider}
                    onChange={(e) => setNetworkProvider(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Verizon Wireless">Verizon Industrial Wireless</option>
                    <option value="AT&T M2M">AT&T M2M Cloud</option>
                    <option value="T-Mobile IOT">T-Mobile IOT Grid</option>
                    <option value="Vodafone Global">Vodafone Global Net</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-705 mb-1 uppercase">Status Profile</label>
                    <select
                      value={simInstallStatus}
                      onChange={(e) => setSimInstallStatus(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    >
                      <option value="Pending">Pending Installation</option>
                      <option value="Installed">SIM Installed</option>
                      <option value="Communication Verified">Link Verified</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-705 mb-1 uppercase text-slate-400">Signal (0-5)</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={signalStrength}
                      onChange={(e) => setSignalStrength(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                </div>

                {/* Simulated Handshake Pinger */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span>Carrier Link Handshake</span>
                    {simInstallStatus === 'Communication Verified' ? (
                      <span className="text-emerald-600 font-black">Verified Link ✓</span>
                    ) : (
                      <span className="text-amber-600">Pending verified</span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handlesTestConnection}
                    disabled={isPinging}
                    className="w-full py-2 bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isPinging ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        Pinging Cell Tower...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                        Trigger Handshake Handshaking
                      </>
                    )}
                  </button>
                </div>

                <div className="md:col-span-1 text-[11px] text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Assigned Installer: {currentUser.name}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Commit Provisioning Seal
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 space-y-2">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-xs text-slate-700 uppercase">Select Target Telemetry</p>
              <p className="text-[10px]">Click a smart cellular meter on the left registry panel to pull up IMEI and ICCID provisioning controls.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
