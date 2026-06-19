/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Settings, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  Database,
  Trash2,
  RefreshCw,
  Cpu,
  ArrowRightLeft,
  Check,
  X
} from 'lucide-react';
import { Meter, StockStatus, MeterCategory } from '../types';

interface InventoryViewProps {
  meters: Meter[];
  onUpdateStockStatus: (meterId: string, status: StockStatus) => void;
  onUpdateBulkStockStatus?: (meterIds: string[], status: StockStatus) => void;
  currentUser: any;
}

export default function InventoryView({ 
  meters, 
  onUpdateStockStatus, 
  onUpdateBulkStockStatus, 
  currentUser 
}: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingMeterId, setEditingMeterId] = useState<string | null>(null);
  
  // Selection & Bulk State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<StockStatus>('In Store');
  const [bulkSuccess, setBulkSuccess] = useState<string>('');

  useEffect(() => {
    // Clear selection when filters change to avoid accidental out-of-view bulk actions
    setSelectedIds([]);
  }, [searchQuery, selectedCategory, selectedStatus]);
  
  const categoriesList = [
    { value: 'all', label: 'All Categories' },
    { value: 'single_phase', label: 'Single Phase Meters' },
    { value: 'three_phase_whole', label: 'Three Phase Whole Current' },
    { value: 'three_phase_ct', label: 'Three Phase CT Operated' },
    { value: 'three_phase_ct_pt', label: 'Three Phase CT/PT Operated' },
    { value: 'smart', label: 'Smart Meters' }
  ];

  const stockStatuses: StockStatus[] = [
    'In Store',
    'Under Testing',
    'Approved',
    'Rejected',
    'Installed',
    'Scrapped'
  ];

  const isAuthorizedToEdit = currentUser.role === 'administrator' || currentUser.role === 'lab_manager';

  const filteredMeters = meters.filter(m => {
    const matchesSearch = 
      m.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || m.stockStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockBadgeClass = (status: StockStatus) => {
    switch (status) {
      case 'In Store':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Under Testing':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Approved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Installed':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Scrapped':
        return 'bg-zinc-100 text-zinc-800 border-zinc-200 line-through';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  const handlesStatusChange = (meterId: string, status: StockStatus) => {
    onUpdateStockStatus(meterId, status);
    setEditingMeterId(null);
  };

  const handleBulkMove = () => {
    if (selectedIds.length === 0) return;
    if (onUpdateBulkStockStatus) {
      onUpdateBulkStockStatus(selectedIds, bulkStatus);
    } else {
      selectedIds.forEach(id => onUpdateStockStatus(id, bulkStatus));
    }
    setBulkSuccess(`Successfully batch-moved ${selectedIds.length} meters to "${bulkStatus}" stage!`);
    setSelectedIds([]);
    setTimeout(() => {
      setBulkSuccess('');
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            Standard Meter Inventory Status
          </h2>
          <p className="text-xs text-slate-500">Track and dispatch electrical meters inside physical warehousing and calibration cells.</p>
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-800">
          <Database className="w-4 h-4 text-indigo-600" />
          Active Ledger: {meters.length} registered hardware modules
        </div>
      </div>

      {/* Bento Grid Stock Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        {stockStatuses.map(status => {
          const count = meters.filter(m => m.stockStatus === status).length;
          return (
            <div key={status} className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{status}</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-black text-slate-900">{count}</span>
                <span className={`inline-block w-4 h-4 rounded-full border ${
                  status === 'Approved' ? 'bg-emerald-500 border-emerald-400' :
                  status === 'Rejected' ? 'bg-rose-500 border-rose-400' :
                  status === 'Under Testing' ? 'bg-blue-500 border-blue-400' : 'bg-slate-300 border-slate-400'
                }`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Inventory controls and table grids */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filters Panel */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Meter Number / Serial / OEM Make..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Select */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Class:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-700 cursor-pointer text-ellipsis"
              >
                {categoriesList.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">State:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All States</option>
                {stockStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Panel */}
        {selectedIds.length > 0 && isAuthorizedToEdit && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0 shadow-sm">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  Bulk Meter Movement Operator
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {selectedIds.length} Selected
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">Batch reassign the warehouse location or dispatch state for designated hardware assets instantly.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Move To:</span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as StockStatus)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer min-w-[120px]"
                >
                  {stockStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleBulkMove}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] uppercase tracking-wide rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer min-h-[34px]"
              >
                <Check className="w-4 h-4" />
                Dispatch State
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 bg-slate-205 text-slate-600 hover:bg-slate-300 text-xs font-bold uppercase rounded-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1 font-mono hover:text-slate-900"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {bulkSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-100 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span>{bulkSuccess}</span>
          </div>
        )}

        {/* Inventory Register Grid table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                {isAuthorizedToEdit && (
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox"
                      checked={filteredMeters.length > 0 && filteredMeters.every(m => selectedIds.includes(m.id))}
                      onChange={() => {
                        const allSelected = filteredMeters.every(m => selectedIds.includes(m.id));
                        if (allSelected) {
                          const filteredIds = filteredMeters.map(m => m.id);
                          setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
                        } else {
                          const newIds = [...selectedIds];
                          filteredMeters.forEach(m => {
                            if (!newIds.includes(m.id)) {
                              newIds.push(m.id);
                            }
                          });
                          setSelectedIds(newIds);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                  </th>
                )}
                <th className="p-4">Meter ID</th>
                <th className="p-4">Category Class</th>
                <th className="p-4">Hardware Serial Code</th>
                <th className="p-4">Manufacturer</th>
                <th className="p-4">Precision Index</th>
                <th className="p-4">Stock Condition (State)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredMeters.length === 0 ? (
                <tr>
                  <td colSpan={isAuthorizedToEdit ? 8 : 7} className="p-10 text-center text-slate-400">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No Hardware Found matching filters</p>
                    <p className="text-[11px] mt-1">Try resetting category specifications or query search keyword.</p>
                  </td>
                </tr>
              ) : (
                filteredMeters.map(m => (
                  <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(m.id) ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}>
                    {isAuthorizedToEdit && (
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(m.id)}
                          onChange={() => {
                            if (selectedIds.includes(m.id)) {
                              setSelectedIds(prev => prev.filter(id => id !== m.id));
                            } else {
                              setSelectedIds(prev => [...prev, m.id]);
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                        />
                      </td>
                    )}
                    <td className="p-4">
                      <span className="font-extrabold text-slate-900 font-mono text-xs">{m.meterNumber}</span>
                    </td>
                    <td className="p-4 font-semibold text-indigo-900 capitalize">
                      {m.category.replace(/_/g, ' ')}
                    </td>
                    <td className="p-4 font-mono text-slate-500">{m.serialNumber}</td>
                    <td className="p-4 font-bold text-slate-700">{m.manufacturer}</td>
                    <td className="p-4 text-xs font-mono font-medium text-slate-600">{m.accuracyClass}</td>
                    <td className="p-4 relative">
                      {editingMeterId === m.id && isAuthorizedToEdit ? (
                        <select
                          className="text-xs p-1.5 bg-white border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-bold"
                          defaultValue={m.stockStatus}
                          onChange={(e) => handlesStatusChange(m.id, e.target.value as StockStatus)}
                        >
                          {stockStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStockBadgeClass(m.stockStatus)}`}>
                            {m.stockStatus}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isAuthorizedToEdit ? (
                        editingMeterId === m.id ? (
                          <button
                            onClick={() => setEditingMeterId(null)}
                            className="text-[10px] font-semibold text-slate-400 hover:underline px-2"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingMeterId(m.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded font-bold text-[10px] transition-colors"
                          >
                            <Settings className="w-3 h-3" />
                            Dispatch Condition
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400">Read only access</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info block */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-[10px] text-slate-400 font-medium flex justify-between items-center">
          <span>Active Calibration Vault Ledger v2.1</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">🟢 Standard Precision Class Target matched</span>
            <span className="flex items-center gap-1">🔴 Calibration discrepancy reported on Scrapped</span>
          </div>
        </div>

      </div>
    </div>
  );
}
