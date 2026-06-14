/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getPKTDateString } from '../utils';
import { 
  Building, 
  Search, 
  PlusCircle, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  Sliders,
  Cpu
} from 'lucide-react';
import { CTRecord, PTRecord } from '../types';

interface TransformersViewProps {
  cts: CTRecord[];
  pts: PTRecord[];
  onAddCT: (record: CTRecord) => void;
  onAddPT: (record: PTRecord) => void;
  onTestCT: (id: string, testResult: 'passed' | 'failed', remarks: string) => void;
  onTestPT: (id: string, testResult: 'passed' | 'failed', remarks: string) => void;
}

export default function TransformersView({ 
  cts, 
  pts, 
  onAddCT, 
  onAddPT,
  onTestCT,
  onTestPT
}: TransformersViewProps) {
  
  const [activeTab, setActiveTab] = useState<'ct' | 'pt'>('ct');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [deviceNumber, setDeviceNumber] = useState('');
  const [make, setMake] = useState('');
  const [ratio, setRatio] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('0.2S');
  const [remarks, setRemarks] = useState('');

  // Testing Trigger Slate State
  const [testingRecordId, setTestingRecordId] = useState<string | null>(null);
  const [benchVerdict, setBenchVerdict] = useState<'passed' | 'failed'>('passed');
  const [benchRemarks, setBenchRemarks] = useState('');

  // Auto layout prefixes
  const prefillDefaults = () => {
    const randCode = Math.floor(100 + Math.random() * 900);
    if (activeTab === 'ct') {
      setDeviceNumber(`CT-2026-${randCode}`);
      setRatio('200/5 A');
    } else {
      setDeviceNumber(`PT-2026-${randCode}`);
      setRatio('11000/110 V');
    }
  };

  const handleDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceNumber || !make || !ratio) {
      alert('Please fill out all required transformer parameters.');
      return;
    }

    const today = getPKTDateString();

    if (activeTab === 'ct') {
      const newCT: CTRecord = {
        id: `ct-gen-${Date.now()}`,
        ctNumber: deviceNumber,
        make,
        ratio,
        accuracyClass,
        dateReceived: today,
        testResult: 'pending',
        remarks: remarks || undefined
      };
      onAddCT(newCT);
    } else {
      const newPT: PTRecord = {
        id: `pt-gen-${Date.now()}`,
        ptNumber: deviceNumber,
        make,
        ratio,
        accuracyClass,
        dateReceived: today,
        testResult: 'pending',
        remarks: remarks || undefined
      };
      onAddPT(newPT);
    }

    // Reset Form
    setDeviceNumber('');
    setMake('');
    setRatio('');
    setRemarks('');
    setAccuracyClass('0.2S');
    setShowAddForm(false);
  };

  const executeTestResult = (id: string) => {
    if (activeTab === 'ct') {
      onTestCT(id, benchVerdict, benchRemarks);
    } else {
      onTestPT(id, benchVerdict, benchRemarks);
    }
    setTestingRecordId(null);
    setBenchRemarks('');
  };

  // Filter lists
  const filteredCTs = cts.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.ctNumber.toLowerCase().includes(q) ||
      c.make.toLowerCase().includes(q) ||
      c.ratio.toLowerCase().includes(q)
    );
  });

  const filteredPTs = pts.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.ptNumber.toLowerCase().includes(q) ||
      p.make.toLowerCase().includes(q) ||
      p.ratio.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Tab toggle control block with header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            Substation Instrument Transformer Tests
          </h2>
          <p className="text-xs text-slate-500">Record verification ratios and insulation testing classes for Current (CT) and Potential (PT) coils.</p>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => {
              setActiveTab('ct');
              setShowAddForm(false);
              setTestingRecordId(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ct' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Current Transformers (CT)
          </button>
          <button
            onClick={() => {
              setActiveTab('pt');
              setShowAddForm(false);
              setTestingRecordId(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Potential Transformers (PT)
          </button>
        </div>
      </div>

      {showAddForm ? (
        /* Intake Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-950 p-5 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Log New {activeTab.toUpperCase()} Coil
                </h3>
                <p className="text-[10px] text-slate-300">Creates an inward inventory tracking queue for standard testing.</p>
              </div>
            </div>
            <button
              onClick={() => prefillDefaults()}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/20 text-[10px] font-bold rounded-lg text-white"
            >
              Prefill Default Parameters
            </button>
          </div>

          <form onSubmit={handleDeviceSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{activeTab.toUpperCase()} Target ID *</label>
                <input
                  type="text"
                  placeholder="e.g. CT-2026-004"
                  value={deviceNumber}
                  onChange={(e) => setDeviceNumber(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-950 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coil OEM Make / brand *</label>
                <input
                  type="text"
                  placeholder="e.g. ABB Substation division"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transformers Ratio *</label>
                <input
                  type="text"
                  placeholder={activeTab === 'ct' ? 'e.g. 200/5 A' : 'e.g. 11000/110 V'}
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accuracy Index</label>
                <select
                  value={accuracyClass}
                  onChange={(e) => setAccuracyClass(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer font-bold"
                >
                  <option value="0.2S">Class 0.2S (Premium Substation)</option>
                  <option value="0.2">Class 0.2 (General Feeder Class)</option>
                  <option value="0.5">Class 0.5 (Commercial Distribution)</option>
                  <option value="1.0">Class 1.0 (Domestic Line level)</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Observed Terminal Defects / Marks</label>
                <textarea
                  placeholder="Describe secondary terminal box cover rust or other physical findings."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg"
              >
                Log Entry & Queue
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Main Dual Panel tables */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Search bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toUpperCase()} Code or Ratio...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Log {activeTab.toUpperCase()} Intake
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            {activeTab === 'ct' ? (
              /* CT Table */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[9px] tracking-wider">
                    <th className="p-4">CT Number</th>
                    <th className="p-4">Make / OEM Brand</th>
                    <th className="p-4">Transformer Ratio</th>
                    <th className="p-4">Accuracy Class</th>
                    <th className="p-4">Inward Date</th>
                    <th className="p-4">Calibration Verdict</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredCTs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">No Current Transformers listed.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCTs.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-950">{c.ctNumber}</td>
                        <td className="p-4 font-medium">{c.make}</td>
                        <td className="p-4 font-bold font-mono">{c.ratio}</td>
                        <td className="p-4 font-mono text-slate-600">{c.accuracyClass}</td>
                        <td className="p-4 text-slate-400 font-mono">{c.dateReceived}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.testResult === 'passed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            c.testResult === 'failed' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                            'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}>
                            {c.testResult}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {c.testResult === 'pending' ? (
                            testingRecordId === c.id ? (
                              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-indigo-200 text-left max-w-xs ml-auto shadow-sm">
                                <span className="font-bold text-[10px] uppercase text-indigo-800">Assign Bench Verdict</span>
                                <div className="flex gap-2">
                                  <label className="text-[10px] font-bold"><input type="radio" name="ctv" checked={benchVerdict === 'passed'} onChange={() => setBenchVerdict('passed')} /> Pass</label>
                                  <label className="text-[10px] font-bold text-rose-700"><input type="radio" name="ctv" checked={benchVerdict === 'failed'} onChange={() => setBenchVerdict('failed')} /> Reject</label>
                                </div>
                                <input placeholder="Error margin check..." value={benchRemarks} onChange={(e) => setBenchRemarks(e.target.value)} className="p-1 border text-[10px] focus:outline-none" />
                                <div className="flex justify-end gap-1.5 pt-1.5">
                                  <button onClick={() => setTestingRecordId(null)} className="text-[10px] font-bold text-slate-400">Cancel</button>
                                  <button onClick={() => executeTestResult(c.id)} className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Submit</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setTestingRecordId(c.id);
                                  setBenchVerdict('passed');
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded"
                              >
                                Certify error ratio
                              </button>
                            )
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400">Archived: {c.testDate}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* PT Table */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[9px] tracking-wider">
                    <th className="p-4">PT Number</th>
                    <th className="p-4">Make / OEM Brand</th>
                    <th className="p-4">Transformer Ratio</th>
                    <th className="p-4">Accuracy Class</th>
                    <th className="p-4">Inward Date</th>
                    <th className="p-4">Calibration Verdict</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredPTs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">No Potential Transformers listed.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPTs.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-950">{p.ptNumber}</td>
                        <td className="p-4 font-medium">{p.make}</td>
                        <td className="p-4 font-bold font-mono">{p.ratio}</td>
                        <td className="p-4 font-mono text-slate-600">{p.accuracyClass}</td>
                        <td className="p-4 text-slate-400 font-mono">{p.dateReceived}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.testResult === 'passed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            p.testResult === 'failed' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                            'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}>
                            {p.testResult}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {p.testResult === 'pending' ? (
                            testingRecordId === p.id ? (
                              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-indigo-200 text-left max-w-xs ml-auto shadow-sm">
                                <span className="font-bold text-[10px] uppercase text-indigo-800">Assign Bench Verdict</span>
                                <div className="flex gap-2">
                                  <label className="text-[10px] font-bold"><input type="radio" name="ptv" checked={benchVerdict === 'passed'} onChange={() => setBenchVerdict('passed')} /> Pass</label>
                                  <label className="text-[10px] font-bold text-rose-700"><input type="radio" name="ptv" checked={benchVerdict === 'failed'} onChange={() => setBenchVerdict('failed')} /> Reject</label>
                                </div>
                                <input placeholder="Insulation threshold..." value={benchRemarks} onChange={(e) => setBenchRemarks(e.target.value)} className="p-1 border text-[10px] focus:outline-none" />
                                <div className="flex justify-end gap-1.5 pt-1.5">
                                  <button onClick={() => setTestingRecordId(null)} className="text-[10px] font-bold text-slate-400">Cancel</button>
                                  <button onClick={() => executeTestResult(p.id)} className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Submit</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setTestingRecordId(p.id);
                                  setBenchVerdict('passed');
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded"
                              >
                                Certify ratio error
                              </button>
                            )
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400">Archived: {p.testDate}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
