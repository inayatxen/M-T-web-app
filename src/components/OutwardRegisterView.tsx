import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Calendar, Hash, ArrowUpRight, Truck, UserCircle, MapPin, Check, Square, CheckSquare, Layers, Printer
} from 'lucide-react';
import { OutwardRecord, Meter, CTRecord, PTRecord } from '../types';
import { getPKTDateString, PESCO_HIERARCHY } from '../utils';
import OutwardReportPDF from './OutwardReportPDF';

interface OutwardRegisterViewProps {
  outwardRecords: OutwardRecord[];
  onAddOutwardRecord: (newRecord: OutwardRecord, selectedItemIds: string[]) => void;
  currentUser: any;
  meters: Meter[];
  cts: CTRecord[];
  pts: PTRecord[];
}

type EquipmentCategory = 'single_phase' | 'three_phase_whole' | 'three_phase_ct' | 'three_phase_ct_pt' | 'net_metering' | 'ct' | 'pt';

export default function OutwardRegisterView({ 
  outwardRecords, 
  onAddOutwardRecord, 
  currentUser,
  meters,
  cts,
  pts
}: OutwardRegisterViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find Mardan circle as default, otherwise first available circle
  const initialCircle = PESCO_HIERARCHY.find(c => c.code === '263') || PESCO_HIERARCHY[0];
  const initialDivision = initialCircle?.divisions[0];
  const initialSubdivision = initialDivision?.subdivisions[0];

  // Form State
  const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategory>('single_phase');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  
  const [issuedTo, setIssuedTo] = useState('');
  const [designation, setDesignation] = useState('SDO');
  const [selectedCircleId, setSelectedCircleId] = useState(initialCircle?.code || '');
  const [division, setDivision] = useState(initialDivision?.name || '');
  const [subdivision, setSubdivision] = useState(initialSubdivision?.name || '');
  const [purpose, setPurpose] = useState('Returned after Testing');
  const [remarks, setRemarks] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedRecordForPDF, setSelectedRecordForPDF] = useState<OutwardRecord | null>(null);
  const [showLedgerPDF, setShowLedgerPDF] = useState(false);

  const currentCircle = PESCO_HIERARCHY.find(c => c.code === selectedCircleId);
  const divisionsList = currentCircle ? currentCircle.divisions : [];
  const currentDivisionObj = divisionsList.find(d => d.name === division);
  const subdivisionsList = currentDivisionObj ? currentDivisionObj.subdivisions : [];

  const handleCircleChange = (circleCode: string) => {
    setSelectedCircleId(circleCode);
    const circle = PESCO_HIERARCHY.find(c => c.code === circleCode);
    if (circle && circle.divisions.length > 0) {
      const firstDiv = circle.divisions[0];
      setDivision(firstDiv.name);
      if (firstDiv.subdivisions.length > 0) {
        setSubdivision(firstDiv.subdivisions[0].name);
      } else {
        setSubdivision('');
      }
    } else {
      setDivision('');
      setSubdivision('');
    }
  };

  const handleDivisionChange = (divName: string) => {
    setDivision(divName);
    const div = divisionsList.find(d => d.name === divName);
    if (div && div.subdivisions.length > 0) {
      setSubdivision(div.subdivisions[0].name);
    } else {
      setSubdivision('');
    }
  };

  // Get list of available items to dispatch based on equipment category
  const getAvailableItems = () => {
    switch (equipmentCategory) {
      case 'single_phase':
        return meters
          .filter(m => m.category === 'single_phase' && m.stockStatus !== 'Installed' && m.stockStatus !== 'Scrapped')
          .map(m => ({
            id: m.id,
            number: m.meterNumber,
            serialNumber: m.serialNumber,
            make: m.manufacturer,
            status: m.stockStatus,
            badge: m.status.toUpperCase()
          }));
      case 'three_phase_whole':
        return meters
          .filter(m => m.category === 'three_phase_whole' && m.stockStatus !== 'Installed' && m.stockStatus !== 'Scrapped')
          .map(m => ({
            id: m.id,
            number: m.meterNumber,
            serialNumber: m.serialNumber,
            make: m.manufacturer,
            status: m.stockStatus,
            badge: m.status.toUpperCase()
          }));
      case 'three_phase_ct':
        return meters
          .filter(m => m.category === 'three_phase_ct' && m.stockStatus !== 'Installed' && m.stockStatus !== 'Scrapped')
          .map(m => ({
            id: m.id,
            number: m.meterNumber,
            serialNumber: m.serialNumber,
            make: m.manufacturer,
            status: m.stockStatus,
            badge: m.status.toUpperCase()
          }));
      case 'three_phase_ct_pt':
        return meters
          .filter(m => m.category === 'three_phase_ct_pt' && m.stockStatus !== 'Installed' && m.stockStatus !== 'Scrapped')
          .map(m => ({
            id: m.id,
            number: m.meterNumber,
            serialNumber: m.serialNumber,
            make: m.manufacturer,
            status: m.stockStatus,
            badge: m.status.toUpperCase()
          }));
      case 'net_metering':
        return meters
          .filter(m => (m.category === 'smart' || m.category === 'three_phase_ct' || m.category === 'three_phase_ct_pt') && m.stockStatus !== 'Installed' && m.stockStatus !== 'Scrapped')
          .map(m => ({
            id: m.id,
            number: m.meterNumber,
            serialNumber: m.serialNumber,
            make: m.manufacturer,
            status: m.stockStatus,
            badge: 'NET METER'
          }));
      case 'ct':
        return cts.map(c => ({
          id: c.id,
          number: c.ctNumber,
          serialNumber: `Ratio: ${c.ratio}`,
          make: c.make,
          status: c.testResult.toUpperCase(),
          badge: 'CT'
        }));
      case 'pt':
        return pts.map(p => ({
          id: p.id,
          number: p.ptNumber,
          serialNumber: `Ratio: ${p.ratio}`,
          make: p.make,
          status: p.testResult.toUpperCase(),
          badge: 'PT'
        }));
      default:
        return [];
    }
  };

  const availableItems = getAvailableItems();
  const filteredAvailableItems = availableItems.filter(item => 
    item.number.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.serialNumber.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.make.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredAvailableItems.map(item => item.id);
    setSelectedItemIds(prev => {
      const union = Array.from(new Set([...prev, ...allFilteredIds]));
      return union;
    });
  };

  const handleDeselectAll = () => {
    const allFilteredIds = filteredAvailableItems.map(item => item.id);
    setSelectedItemIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
  };

  const generateOutwardNumber = () => {
    const today = getPKTDateString();
    const count = outwardRecords.filter(r => r.dateIssued === today).length + 1;
    return `OUT-${today.replace(/-/g, '')}-${count.toString().padStart(3, '0')}`;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedItemIds.length === 0) {
      setErrorMsg('At least one item must be selected for dispatch.');
      return;
    }
    if (!issuedTo.trim() || !subdivision.trim()) {
      setErrorMsg('Issued To and Subdivision are required.');
      return;
    }

    // Resolve full detail list of selected items
    const selectedDetails = availableItems.filter(item => selectedItemIds.includes(item.id));
    
    // Create comma-separated lists for backwards compatibility fields
    const meterNumbersStr = selectedDetails.map(d => d.number).join(', ');
    const serialNumbersStr = selectedDetails.map(d => d.serialNumber).join(', ');
    const makesStr = selectedDetails.map(d => d.make).join(', ');

    const newRecord: OutwardRecord = {
      id: `o-gen-${Date.now()}`,
      outwardNumber: generateOutwardNumber(),
      dateIssued: getPKTDateString(),
      meterId: selectedItemIds.join(','),
      meterNumber: meterNumbersStr,
      serialNumber: serialNumbersStr,
      make: makesStr,
      issuedTo,
      designation,
      division,
      subdivision,
      purpose,
      issuedBy: currentUser?.name || 'Authorized Lab Representative',
      remarks,
      equipmentType: equipmentCategory,
      items: selectedDetails.map(d => ({
        id: d.id,
        number: d.number,
        serialNumber: d.serialNumber,
        make: d.make
      }))
    };

    onAddOutwardRecord(newRecord, selectedItemIds);

    setSuccessMsg(`Dispatch record ${newRecord.outwardNumber} containing ${selectedItemIds.length} items filed successfully.`);
    setSelectedItemIds([]);
    setIssuedTo('');
    setRemarks('');
    setItemSearchQuery('');

    setTimeout(() => {
      setSuccessMsg('');
      setShowAddForm(false);
    }, 2000);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'single_phase': return 'Single Phase Meter';
      case 'three_phase_whole': return 'Three Phase Whole Current Meter';
      case 'three_phase_ct': return 'Three Phase CT Meter';
      case 'three_phase_ct_pt': return 'Three Phase CT/PT Meter';
      case 'net_metering': return 'Net Metering';
      case 'ct': return 'Current Transformer (CT)';
      case 'pt': return 'Potential Transformer (PT)';
      default: return category;
    }
  };

  const filteredRecords = outwardRecords.filter(r => 
    r.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.outwardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.issuedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.equipmentType && r.equipmentType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (selectedRecordForPDF) {
    return (
      <OutwardReportPDF 
        record={selectedRecordForPDF} 
        onBack={() => setSelectedRecordForPDF(null)} 
      />
    );
  }

  if (showLedgerPDF) {
    return (
      <OutwardReportPDF 
        records={filteredRecords} 
        onBack={() => setShowLedgerPDF(false)} 
      />
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Meter Outward Register</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track and dispatch tested meters, CTs, and PTs to subdivision offices</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setSelectedItemIds([]);
          }}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
        >
          {showAddForm ? <ArrowUpRight className="w-4 h-4 rotate-180" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Close Dispatch Form' : 'New Dispatch / Outward'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-top-2">
          <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">New Dispatch Outward Registration</h3>
          </div>
          <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-2 bg-rose-50 border-l-2 border-rose-500 text-rose-800 text-xs font-semibold rounded">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="p-2 bg-emerald-50 border-l-2 border-emerald-500 text-emerald-800 text-xs font-semibold rounded">{successMsg}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Equipment Category</label>
                <select
                  value={equipmentCategory}
                  onChange={(e) => {
                    setEquipmentCategory(e.target.value as EquipmentCategory);
                    setSelectedItemIds([]);
                  }}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500 font-bold"
                >
                  <option value="single_phase">Single Phase Meter</option>
                  <option value="three_phase_whole">Three Phase Whole Current Meter</option>
                  <option value="three_phase_ct">Three Phase CT Meter</option>
                  <option value="three_phase_ct_pt">Three Phase CT/PT Meter</option>
                  <option value="net_metering">Net Metering</option>
                  <option value="ct">Current Transformers (CTs)</option>
                  <option value="pt">Potential Transformers (PTs)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Issued To (Name)</label>
                <input
                  type="text"
                  required
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  placeholder="e.g. SDO City subdivision"
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Circle Office</label>
                <select
                  value={selectedCircleId}
                  onChange={(e) => handleCircleChange(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500"
                >
                  {PESCO_HIERARCHY.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Division Office</label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500"
                >
                  {divisionsList.length === 0 ? (
                    <option value="">No Divisions Available</option>
                  ) : (
                    divisionsList.map(d => (
                      <option key={d.code} value={d.name}>{d.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Subdivision Office</label>
                <select
                  value={subdivision}
                  onChange={(e) => setSubdivision(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500"
                >
                  {subdivisionsList.length === 0 ? (
                    <option value="">No Subdivisions Available</option>
                  ) : (
                    subdivisionsList.map(s => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose of Outward</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional notes..."
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Multiple Selection Meter Checklist Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mt-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-rose-500" />
                    Select {getCategoryLabel(equipmentCategory)} Items ({selectedItemIds.length} Selected)
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toggle checkboxes to construct a bulk dispatch manifest</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter items..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] outline-none w-36 sm:w-48"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 rounded font-bold"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[10px] px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded font-bold"
                  >
                    Clear Filtered
                  </button>
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                {filteredAvailableItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No available {getCategoryLabel(equipmentCategory)} items found in active inventory.
                  </div>
                ) : (
                  filteredAvailableItems.map((item) => {
                    const isChecked = selectedItemIds.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleItemSelection(item.id)}
                        className={`p-2.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-rose-50/20 dark:hover:bg-rose-950/5 transition-colors rounded ${isChecked ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-rose-600 dark:text-rose-400 focus:outline-none shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4.5 h-4.5" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-2">
                              {item.number}
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                {item.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {item.serialNumber} | {item.make}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            item.status === 'Approved' || item.status === 'PASSED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                Dispatch {selectedItemIds.length} Checked Equipment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Outward Logs
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold ml-2">
              {filteredRecords.length} dispatches
            </span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowLedgerPDF(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold transition-all shadow-sm border border-rose-200/50 dark:border-rose-900/40 shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Ledger PDF
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search outwards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Ref / Date</th>
                <th className="p-3">Dispatched Items</th>
                <th className="p-3">Recipient Details</th>
                <th className="p-3">Purpose / Category</th>
                <th className="p-3">Issued By</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-medium text-sm">No outward records found</p>
                      <p className="text-xs">Create a dispatch to issue equipment to divisions.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 text-xs">
                        <Hash className="w-3.5 h-3.5" />
                        {record.outwardNumber}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {record.dateIssued}
                      </div>
                    </td>
                    <td className="p-3 align-top max-w-sm">
                      {record.items && record.items.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {record.items.length} {record.items.length === 1 ? 'item' : 'items'} Dispatched:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {record.items.map((item, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex flex-col px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200"
                              >
                                <span className="font-bold font-mono text-[10px]">{item.number}</span>
                                <span className="text-[8px] text-slate-400">{item.serialNumber}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {record.meterNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            SN: {record.serialNumber} | {record.make}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                        <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                        {record.issuedTo}
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase ml-1">
                          {record.designation}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        {record.subdivision}, {record.division}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-[9px] font-extrabold uppercase tracking-wider">
                          {getCategoryLabel(record.equipmentType || 'single_phase')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                          {record.purpose}
                        </span>
                      </div>
                      {record.remarks && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 italic leading-tight line-clamp-2 max-w-[200px]" title={record.remarks}>
                          "{record.remarks}"
                        </p>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase">
                        {record.issuedBy}
                      </span>
                    </td>
                    <td className="p-3 text-right align-top">
                      <button
                        onClick={() => setSelectedRecordForPDF(record)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60 rounded transition-all inline-flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                        title="Print Gate Pass / Challan"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Challan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
