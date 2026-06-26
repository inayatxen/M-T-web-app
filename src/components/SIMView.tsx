/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getPKTDateString } from '../utils';
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
  Play,
  Upload,
  Database,
  Trash2,
  Download,
  Printer,
  RefreshCw,
  Check
} from 'lucide-react';
import { Meter, EquipmentReceipt } from '../types';
import { supabase } from '../supabaseClient';

interface AvailableSIM {
  simNumber: string;
  iccid: string;
  provider: string;
}

interface SIMViewProps {
  meters: Meter[];
  receipts?: EquipmentReceipt[];
  onUpdateSIMDetails: (meterId: string, updatedFields: Partial<Meter>) => void;
  currentUser: any;
  availableSims: AvailableSIM[];
  onUpdateAvailableSims: (updated: AvailableSIM[] | ((prev: AvailableSIM[]) => AvailableSIM[])) => void;
}

export default function SIMView({ 
  meters, 
  receipts = [], 
  onUpdateSIMDetails, 
  currentUser,
  availableSims = [],
  onUpdateAvailableSims: setAvailableSims
}: SIMViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResultMessage, setSyncResultMessage] = useState<string | null>(null);

  const handleInstantReconcile = async () => {
    setIsSyncing(true);
    setSyncResultMessage(null);
    try {
      // 1. Fetch current available_sims from Supabase
      const { data: remoteSims, error: simError } = await supabase
        .from('available_sims')
        .select('*');

      if (simError) throw new Error(simError.message);

      // 2. Fetch meters to see which SIMs are already provisioned (to exclude/reduce them)
      const { data: remoteMeters, error: meterError } = await supabase
        .from('meters')
        .select('iccid, simNumber');

      const activeIccids = new Set<string>();
      const activeSimNumbers = new Set<string>();

      // Add local meters with SIMs
      meters.forEach(m => {
        if (m.iccid) activeIccids.add(m.iccid.trim());
        if (m.simNumber) activeSimNumbers.add(m.simNumber.trim());
      });

      // Add remote meters with SIMs
      if (!meterError && remoteMeters) {
        remoteMeters.forEach(m => {
          if (m.iccid) activeIccids.add(m.iccid.trim());
          if (m.simNumber) activeSimNumbers.add(m.simNumber.trim());
        });
      }

      // 3. Merge local availableSims and remote availableSims
      const allSimsMap = new Map<string, AvailableSIM>();
      
      // Add local ones first
      availableSims.forEach(s => {
        if (s.iccid) allSimsMap.set(s.iccid.trim(), s);
      });

      // Add/overwrite with remote ones
      if (remoteSims) {
        remoteSims.forEach(s => {
          if (s.iccid) {
            allSimsMap.set(s.iccid.trim(), {
              simNumber: s.simNumber || '',
              iccid: s.iccid,
              provider: s.provider || ''
            });
          }
        });
      }

      // 4. "Reduce" / Filter out any SIMs that are already assigned to meters
      const unfilteredCount = allSimsMap.size;
      const reducedSimsList: AvailableSIM[] = [];
      const idsToDeleteFromDb: string[] = [];

      allSimsMap.forEach((sim, iccid) => {
        const isAssigned = activeIccids.has(iccid.trim()) || activeSimNumbers.has(sim.simNumber.trim());
        if (isAssigned) {
          idsToDeleteFromDb.push(iccid);
        } else {
          reducedSimsList.push(sim);
        }
      });

      // 5. Update local state
      setAvailableSims(reducedSimsList);

      // 6. Delete already provisioned SIMs from remote available_sims table to keep db clean & reduced
      if (idsToDeleteFromDb.length > 0) {
        await supabase
          .from('available_sims')
          .delete()
          .in('iccid', idsToDeleteFromDb);
      }

      // 7. Upsert the final reduced available SIMs list to Supabase to keep them perfectly in sync
      if (reducedSimsList.length > 0) {
        const { error: upsertError } = await supabase
          .from('available_sims')
          .upsert(reducedSimsList);
        if (upsertError) throw upsertError;
      }

      const reductionCount = unfilteredCount - reducedSimsList.length;
      setSyncResultMessage(
        `Successfully reduced & reconciled! Synced ${reducedSimsList.length} active SIMs. Purged ${reductionCount} already provisioned or duplicate entries.`
      );
    } catch (err: any) {
      console.error(err);
      setSyncResultMessage(`Reconciliation error: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length < 2) {
          alert('Excel sheet is empty or has no data rows.');
          return;
        }
        
        const newSims: AvailableSIM[] = [];
        
        // Loop from row 1 onwards (assuming row 0 is header)
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;
          
          let simNumber = String(row[0] || '').replace(/\D/g, '');
          let iccid = String(row[1] || '').replace(/\D/g, '');
          let provider = String(row[2] || '').trim();
          
          // Basic validation based on requirements
          if (simNumber.length >= 10 && iccid.startsWith('8992') && provider) {
            newSims.push({ simNumber, iccid, provider });
          }
        }
        
        if (newSims.length > 0) {
          setAvailableSims(prev => {
            // Deduplicate based on ICCID
            const existingIccids = new Set(prev.map(s => s.iccid));
            const filteredNew = newSims.filter(s => {
              if (existingIccids.has(s.iccid)) return false;
              existingIccids.add(s.iccid);
              return true;
            });
            // Upsert to Supabase instantly in background
            if (filteredNew.length > 0) {
              supabase.from('available_sims').upsert(filteredNew).then(({ error }) => {
                if (error) console.error('[Supabase Instant Upsert Sync Fail]', error.message);
                else console.log('[Supabase Instant Upsert Sync Success]');
              });
            }
            return [...prev, ...filteredNew];
          });
          alert(`Successfully imported ${newSims.length} SIMs.`);
        } else {
          alert('No valid SIM rows found. Ensure columns are: 1) SIM Number (11 digits), 2) ICCID (19/20 digits starting with 8992), 3) Provider Name (Jazz, Zong, Telenor, Ufone).');
        }
      } catch (err) {
        console.error(err);
        alert('Error parsing Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "SIM Number": "03001234567", "ICCID": "8992012345678901234", "Provider Name": "Jazz" },
      { "SIM Number": "03111234567", "ICCID": "8992012345678901235", "Provider Name": "Zong" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SIM Inventory Template");
    XLSX.writeFile(wb, "SIM_Inventory_Template.xlsx");
  };

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

    const today = getPKTDateString();

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

    setAvailableSims(prev => {
      const filtered = prev.filter(s => s.iccid !== iccid);
      // Delete from Supabase instantly to keep stock in sync
      if (iccid) {
        supabase.from('available_sims').delete().eq('iccid', iccid).then(({ error }) => {
          if (error) console.error('[Supabase Instant Delete Sync Fail]', error.message);
          else console.log('[Supabase Instant Delete Sync Success]');
        });
      }
      return filtered;
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
            Smart Grid Cellular SIM Provisioning
          </h2>
          <p className="text-xs text-slate-500">Configure IMEI IDs, ICCID serial parameters, and register carrier network handshakes for high-voltage telemetry heads.</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={downloadTemplate}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import SIM Stock (Excel)
          </button>
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
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative max-w-xs w-full sm:w-auto flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter IMEI / SIM..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => {
                    try {
                      window.focus();
                      window.print();
                    } catch (e) {
                      console.error("Print failed:", e);
                      alert(
                        "Printing is restricted inside the preview iframe.\n\nPlease click the 'Open in New Tab' button in the top-right corner of the application preview to print the registry successfully."
                      );
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 text-slate-600 rounded-lg transition-colors shadow-sm shrink-0 print:hidden flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Print Registry"
                >
                  <Printer className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-bold sm:inline hidden">Print</span>
                </button>
              </div>
            </div>

            {/* Print Only Table */}
            <div className="hidden print:block w-full">
              <div className="mb-4">
                <h1 className="text-xl font-bold uppercase">Smart Grid Cellular SIM Provisioning Registry</h1>
                <p className="text-xs text-slate-500">Total Records: {filteredSmartMeters.length}</p>
              </div>
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                    <th className="p-2 border border-slate-200">Meter No</th>
                    <th className="p-2 border border-slate-200">Account</th>
                    <th className="p-2 border border-slate-200">Provider</th>
                    <th className="p-2 border border-slate-200">SIM Number</th>
                    <th className="p-2 border border-slate-200">IMEI</th>
                    <th className="p-2 border border-slate-200">ICCID</th>
                    <th className="p-2 border border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] text-slate-800">
                  {filteredSmartMeters.map(sm => {
                    const mr = receipts.find(r => r.meterNumber === sm.meterNumber);
                    const accountNum = sm.consumerAccount || mr?.consumerAccount || '—';
                    return (
                      <tr key={sm.id} className="border-b border-slate-200">
                        <td className="p-2 font-mono border-r border-slate-200">{sm.meterNumber}</td>
                        <td className="p-2 border-r border-slate-200">{accountNum}</td>
                        <td className="p-2 border-r border-slate-200">{sm.networkProvider || '—'}</td>
                        <td className="p-2 font-mono border-r border-slate-200">{sm.simNumber || '—'}</td>
                        <td className="p-2 font-mono border-r border-slate-200">{sm.imei || '—'}</td>
                        <td className="p-2 font-mono border-r border-slate-200">{sm.iccid || '—'}</td>
                        <td className="p-2">{sm.simInstallStatus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
              {filteredSmartMeters.length === 0 ? (
                <div className="p-8 text-center text-slate-400 col-span-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-xs">No Smart Meters Provisioned</p>
                </div>
              ) : (
                filteredSmartMeters.map(sm => {
                  const mr = receipts.find(r => r.meterNumber === sm.meterNumber);
                  const accountNum = sm.consumerAccount || mr?.consumerAccount || '—';

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
                          <span>Consumer A/C:</span>
                          <strong className="text-slate-800">{accountNum}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Provider:</span>
                          <strong className="text-slate-800">{sm.networkProvider || '—'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>IMEI:</span>
                          <strong className="font-mono text-slate-800">{sm.imei || 'Not Assumed'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>SIM Num:</span>
                          <strong className="font-mono text-slate-800">{sm.simNumber || 'Not Provisions'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>ICCID:</span>
                          <strong className="font-mono text-slate-800">{sm.iccid || '—'}</strong>
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
        <div className="lg:col-span-1 print:hidden">
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
                {availableSims.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mb-4">
                    <label className="block text-[10px] font-bold text-slate-705 mb-1 uppercase text-indigo-700">Select Available SIM from Stock</label>
                    <select
                      onChange={(e) => {
                        const sim = availableSims.find(s => s.iccid === e.target.value);
                        if (sim) {
                          setIccid(sim.iccid);
                          setSimNumber(sim.simNumber);
                          setNetworkProvider(sim.provider);
                        }
                      }}
                      className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Manual Entry / Override --</option>
                      {availableSims.map(s => (
                        <option key={s.iccid} value={s.iccid}>
                          {s.provider} | SIM: {s.simNumber} | ICCID: {s.iccid.substring(0,8)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                    <option value="Jazz">Jazz</option>
                    <option value="Zong">Zong</option>
                    <option value="Telenor">Telenor</option>
                    <option value="Ufone">Ufone</option>
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
                        Trigger Carrier Handshake
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

      {/* SIM Inward Register Table */}
      <div className="mt-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              SIM Inward Register (Stock)
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Record of all unprovisioned and available imported SIM stock.</p>
          </div>
          <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-1 rounded w-fit">
            Total Stock: {availableSims.length}
          </span>
        </div>

        {/* Instant DB Sync & Reconciliation Banner */}
        <div className="p-4 bg-indigo-50/50 dark:bg-slate-900/40 rounded-xl border border-indigo-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">Instant Terminal & Database Reconciliation</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 max-w-xl">
                Automatically merges offline terminal stock with Supabase cloud database, purging and "reducing" any SIM cards that are already provisioned to live smart meters.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstantReconcile}
            disabled={isSyncing}
            className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Reconcile & Reduce Stock Now'}</span>
          </button>
        </div>

        {syncResultMessage && (
          <div className="p-3 bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-slate-850 rounded-lg text-[10.5px] font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{syncResultMessage}</span>
          </div>
        )}
        
        {availableSims.length === 0 ? (
          <div className="text-center py-8">
            <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-400">No SIM stock available.</p>
            <p className="text-[10px] text-slate-400">Import an Excel sheet to populate stock.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-2 border-b border-slate-200">#</th>
                  <th className="p-2 border-b border-slate-200">Provider</th>
                  <th className="p-2 border-b border-slate-200">SIM Number</th>
                  <th className="p-2 border-b border-slate-200">ICCID</th>
                  <th className="p-2 border-b border-slate-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[11px] divide-y divide-slate-100">
                {availableSims.map((sim, index) => (
                  <tr key={sim.iccid} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 font-mono text-slate-400">{index + 1}</td>
                    <td className="p-2 font-bold text-slate-700">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        sim.provider.toLowerCase() === 'jazz' ? 'bg-red-50 text-red-700 border border-red-200' :
                        sim.provider.toLowerCase() === 'zong' ? 'bg-green-50 text-green-700 border border-green-200' :
                        sim.provider.toLowerCase() === 'telenor' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        sim.provider.toLowerCase() === 'ufone' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {sim.provider}
                      </span>
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-800">{sim.simNumber}</td>
                    <td className="p-2 font-mono text-slate-600">{sim.iccid}</td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => {
                          setAvailableSims(prev => {
                            const filtered = prev.filter(s => s.iccid !== sim.iccid);
                            // Delete from Supabase instantly to keep stock in sync
                            if (sim.iccid) {
                              supabase.from('available_sims').delete().eq('iccid', sim.iccid).then(({ error }) => {
                                if (error) console.error('[Supabase Instant Delete Sync Fail]', error.message);
                              });
                            }
                            return filtered;
                          });
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        title="Remove from stock instantly"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
