/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getPKTDateString } from '../utils';
import { 
  UserCheck, 
  Search, 
  PlusCircle, 
  HelpCircle, 
  Calendar, 
  TrendingUp, 
  Sliders, 
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  ClipboardList,
  BookmarkCheck
} from 'lucide-react';
import { CommitteeCase, EquipmentReceipt } from '../types';

interface CommitteeViewProps {
  cases: CommitteeCase[];
  receipts?: EquipmentReceipt[];
  onAddCase: (newCase: CommitteeCase) => void;
  onUpdateCaseStatus: (caseId: string, updatedFields: Partial<CommitteeCase>) => void;
  currentUser: any;
}

export default function CommitteeView({ 
  cases, 
  receipts = [], 
  onAddCase, 
  onUpdateCaseStatus, 
  currentUser 
}: CommitteeViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Case Form States
  const [selectedInwardReceiptId, setSelectedInwardReceiptId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [consumerName, setConsumerName] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [existingMeterDetails, setExistingMeterDetails] = useState('');
  const [newMeterDetails, setNewMeterDetails] = useState('');
  const [reasonForCommitteeCheck, setReasonForCommitteeCheck] = useState('');
  const [committeeMembers, setCommitteeMembers] = useState('');
  const [inspectionDate, setInspectionDate] = useState(getPKTDateString());

  // Case Editing State
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<CommitteeCase['approvalStatus']>('Approved');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !consumerName || !meterNumber) {
      alert('Please fill out the Account Number, Consumer Name, and Meter Number.');
      return;
    }

    const caseNum = `CASE-2026-${Math.floor(100 + Math.random() * 900)}`;
    const membersArray = committeeMembers 
      ? committeeMembers.split(',').map(m => m.trim()) 
      : ['Er. Sarah Rahman (Convener)', `${currentUser.name} (Member)`];

    const newCase: CommitteeCase = {
      id: `cc-gen-${Date.now()}`,
      caseNumber: caseNum,
      accountNumber,
      consumerName,
      meterNumber,
      existingMeterDetails,
      newMeterDetails,
      reasonForCommitteeCheck,
      committeeMembers: membersArray,
      inspectionDate,
      findings: 'Awaiting scheduled inspection.',
      recommendations: 'Pending technical calibration findings.',
      approvalStatus: 'Created'
    };

    onAddCase(newCase);
    setShowAddForm(false);
    
    // Clear Form fields
    setAccountNumber('');
    setConsumerName('');
    setMeterNumber('');
    setExistingMeterDetails('');
    setNewMeterDetails('');
    setReasonForCommitteeCheck('');
    setCommitteeMembers('');
  };

  const saveCaseInspections = (id: string) => {
    onUpdateCaseStatus(id, {
      findings,
      recommendations,
      approvalStatus
    });
    setEditingCaseId(null);
    setFindings('');
    setRecommendations('');
  };

  const getWorkflowBadgeClass = (status: CommitteeCase['approvalStatus']) => {
    switch (status) {
      case 'Created': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Inspected': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Testing': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Report Issued': return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-slate-150';
    }
  };

  const filteredCases = cases.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.caseNumber.toLowerCase().includes(q) ||
      c.accountNumber.toLowerCase().includes(q) ||
      c.consumerName.toLowerCase().includes(q) ||
      c.meterNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            CT/PT Meter Dispute Testing Committee
          </h2>
          <p className="text-xs text-slate-500">Coordinate official compliance and high-value metering replacements based on corporate board inspections.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {showAddForm ? 'View Actives Cases' : 'File Dispute Case'}
        </button>
      </div>

      {showAddForm ? (
        /* Create Case Drawer Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-red-950 to-indigo-950 p-5 text-white flex items-center gap-3">
            <div className="p-2 bg-rose-500/25 rounded-lg text-rose-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">File Dispute Committee Case</h3>
              <p className="text-[10px] text-slate-300 font-bold">Appoints board specialists to verify electrical shunt slowdowns or bypass disputes.</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-800">
              
              <div className="md:col-span-3 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest block">I. Basic Registry & Consumer Details</span>
              </div>

              {receipts.length > 0 && (
                <div className="md:col-span-3 bg-indigo-50/70 p-4 rounded-xl border border-indigo-100/50 space-y-2">
                  <label className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                    Quick Carry-Forward from Inward Intake Register
                  </label>
                  <select
                    value={selectedInwardReceiptId}
                    onChange={(e) => {
                      const rId = e.target.value;
                      setSelectedInwardReceiptId(rId);
                      const match = receipts.find(r => r.id === rId);
                      if (match) {
                        setAccountNumber(match.consumerAccount);
                        setConsumerName(match.consumerName);
                        setMeterNumber(match.meterNumber);
                        setExistingMeterDetails(`${match.make} ${match.meterType.toUpperCase().replace('_', ' ')} (SN: ${match.serialNumber})`);
                        setReasonForCommitteeCheck(match.reasonForTesting || 'Laboratory dispute calibration check appointment.');
                      }
                    }}
                    className="w-full text-xs p-3 bg-white border border-indigo-200 rounded-lg text-slate-800 font-bold cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="">— Select an Inward Intake Record to carry forward details —</option>
                    {receipts.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.consumerName} ({r.meterNumber}) — Receipt {r.receiptNumber}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-indigo-600/80 font-bold">
                    Choosing a registered entry carries forward its account profile, hardware specification, and default testing notes instantly.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consumer Account Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 120938472109"
                  maxLength={14}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consumer Name *</label>
                <input
                  type="text"
                  placeholder="Company / Client Name"
                  value={consumerName}
                  onChange={(e) => setConsumerName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Anomalous Meter Number *</label>
                <input
                  type="text"
                  placeholder="e.g. MTR-102941"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  required
                />
              </div>

              <div className="md:col-span-3 border-b border-slate-100 pt-3 pb-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest block">II. Replacement Logistics & Committee members</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Existing Meter Profile Details</label>
                <input
                  type="text"
                  placeholder="e.g. 200/5A CT Operated Multi-Tariff"
                  value={existingMeterDetails}
                  onChange={(e) => setExistingMeterDetails(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Substitution Meter details</label>
                <input
                  type="text"
                  placeholder="e.g. MTR-982103 Class 0.5S Secure Meters"
                  value={newMeterDetails}
                  onChange={(e) => setNewMeterDetails(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Appointment Date</label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-650"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Appointing Committee</label>
                <input
                  type="text"
                  placeholder="e.g. Severe discrepancy checking on standard phase shift"
                  value={reasonForCommitteeCheck}
                  onChange={(e) => setReasonForCommitteeCheck(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Committee Board Members list (comma separated)</label>
                <input
                  type="text"
                  placeholder="Leave empty for defaults"
                  value={committeeMembers}
                  onChange={(e) => setCommitteeMembers(e.target.value)}
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
                Launch Dispute Process
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Active Board Cases Lists */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Search bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search case, meter, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="text-xs font-semibold text-slate-400 font-mono">
              Operational Level • High-Tariff Feed Verification
            </div>
          </div>

          <div className="divide-y divide-slate-150">
            {filteredCases.length === 0 ? (
              <div className="p-10 text-center text-slate-405">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold">No Dispute Cases Found.</p>
              </div>
            ) : (
              filteredCases.map(c => {
                const isEditing = editingCaseId === c.id;

                return (
                  <div key={c.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 relative">
                    {/* Left: Case ID and Basic Header */}
                    <div className="md:w-1/4 space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black tracking-wider text-indigo-950 uppercase bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {c.caseNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getWorkflowBadgeClass(c.approvalStatus)}`}>
                          {c.approvalStatus}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-black text-slate-900">{c.consumerName}</p>
                        <p className="text-slate-400 font-mono text-[10px]">Acc: {c.accountNumber}</p>
                        <p className="text-indigo-700 font-bold font-mono text-[10px]">Meter: {c.meterNumber}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                        <Calendar className="w-3.5 h-3.5" /> Inspection: {c.inspectionDate}
                      </div>
                    </div>

                    {/* Middle: Findings descriptions */}
                    <div className="md:w-2/4 space-y-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 text-xs">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase">Inspection Findings</label>
                            <textarea
                              value={findings}
                              onChange={(e) => setFindings(e.target.value)}
                              rows={2}
                              className="w-full p-2 bg-slate-50 border border-indigo-200 rounded text-xs focus:ring-1 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase">Board Recommendations</label>
                            <input
                              value={recommendations}
                              onChange={(e) => setRecommendations(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-indigo-200 rounded text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase">Status Shift</label>
                            <select
                              value={approvalStatus}
                              onChange={(e) => setApprovalStatus(e.target.value as any)}
                              className="p-1.5 bg-slate-50 border border-indigo-200 text-xs rounded font-bold"
                            >
                              <option value="Inspected">Case Inspected</option>
                              <option value="Testing">Testing In Progress</option>
                              <option value="Approved">Approved Substitution</option>
                              <option value="Report Issued">Close & Report Issued</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <strong>Observed Findings:</strong>
                            <p className="text-slate-600 mt-1">{c.findings || 'Not logged yet.'}</p>
                          </div>
                          <div className="bg-indigo-50/50 p-2.5 rounded border border-indigo-100">
                            <strong>Corrective Actions & Recommendations:</strong>
                            <p className="text-indigo-950 font-semibold mt-1">{c.recommendations || 'Pending inspection verdict.'}</p>
                          </div>
                        </div>
                      )}

                      {/* Committee Members list */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {c.committeeMembers.map((m, mIdx) => (
                          <span key={mIdx} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-semibold border border-slate-200">
                            👤 {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="md:w-1/4 text-right flex md:flex-col justify-end items-end gap-2 pt-3 md:pt-0">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingCaseId(null)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:underline"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveCaseInspections(c.id)}
                            className="px-3.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                          >
                            Commit Inspections
                          </button>
                        </div>
                      ) : (
                        currentUser.role !== 'data_entry_operator' && (
                          <button
                            onClick={() => {
                              setEditingCaseId(c.id);
                              setFindings(c.findings);
                              setRecommendations(c.recommendations);
                              setApprovalStatus(c.approvalStatus);
                            }}
                            className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition"
                          >
                            Update Findings / Decision
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
}
