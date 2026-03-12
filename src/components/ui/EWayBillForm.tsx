'use client';

import { useState } from 'react';

interface EWayBillFormProps {
  invoiceNumber: string;
  grandTotalRupees: number;
  customerName?: string;
  customerGstin?: string;
}

// NIC E-Way Bill fields mapped to the official API format
export default function EWayBillForm({ invoiceNumber, grandTotalRupees, customerName = '', customerGstin = '' }: EWayBillFormProps) {
  const [form, setForm] = useState({
    supplyType: 'O', // Outward
    docType: 'INV',
    docNo: invoiceNumber,
    docDate: new Date().toLocaleDateString('en-IN'),
    fromGstin: process.env.NEXT_PUBLIC_GSTIN || '',
    fromTradeName: '',
    fromAddr1: '', fromAddr2: '', fromPlace: '', fromPincode: '', fromState: '02',
    toGstin: customerGstin,
    toTradeName: customerName,
    toAddr1: '', toAddr2: '', toPlace: '', toPincode: '', toState: '',
    totalValue: grandTotalRupees.toFixed(2),
    hsnCode: '',
    transMode: '1', // Road
    transDistance: '',
    transporterName: '', transporterId: '', transDocNo: '', transDocDate: '',
    vehicleNo: '', vehicleType: 'R',
  });

  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const generateJson = () => {
    const ewb = {
      supplyType: form.supplyType,
      subSupplyType: 1,
      docType: form.docType,
      docNo: form.docNo,
      docDate: form.docDate,
      fromGstin: form.fromGstin,
      fromTrdName: form.fromTradeName,
      fromAddr1: form.fromAddr1,
      fromAddr2: form.fromAddr2,
      fromPlace: form.fromPlace,
      fromPincode: parseInt(form.fromPincode),
      fromStateCode: parseInt(form.fromState),
      actFromStateCode: parseInt(form.fromState),
      toGstin: form.toGstin || 'URP',
      toTrdName: form.toTradeName,
      toAddr1: form.toAddr1,
      toAddr2: form.toAddr2,
      toPlace: form.toPlace,
      toPincode: parseInt(form.toPincode) || 0,
      toStateCode: parseInt(form.toState) || 0,
      actToStateCode: parseInt(form.toState) || 0,
      totInvVal: parseFloat(form.totalValue),
      itemList: [{ productName: 'As per invoice', hsnCode: form.hsnCode || '0000', quantity: 1, qtyUnit: 'NOS', cgstRate: 0, sgstRate: 0, igstRate: 0, taxableAmount: parseFloat(form.totalValue) * 0.85 }],
      transMode: form.transMode,
      transDistance: form.transDistance ? parseInt(form.transDistance) : 0,
      transporterName: form.transporterName,
      transporterId: form.transporterId,
      transDocNo: form.transDocNo,
      transDocDate: form.transDocDate,
      vehicleNo: form.vehicleNo.replace(/\s/g, ''),
      vehicleType: form.vehicleType,
    };
    const blob = new Blob([JSON.stringify(ewb, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `EWayBill_${invoiceNumber}.json`; a.click();
  };

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: keyof typeof form; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-[10px] font-bold text-[#8a8695] uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={form[name]} onChange={e => update(name, e.target.value)} placeholder={placeholder}
        className="w-full bg-black/30 border border-[#2a2836] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#5a5668] focus:outline-none focus:border-amber-500/50" />
    </div>
  );

  const StateSelect = ({ label, name }: { label: string; name: keyof typeof form }) => {
    const states: [string, string][] = [
      ['02', 'Himachal Pradesh'], ['01', 'J&K'], ['03', 'Punjab'], ['06', 'Haryana'],
      ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'UP'], ['20', 'Jharkhand'],
      ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'MP'], ['24', 'Gujarat'],
      ['27', 'Maharashtra'], ['29', 'Karnataka'], ['32', 'Kerala'], ['33', 'Tamil Nadu'],
      ['36', 'Telangana'], ['37', 'Andhra Pradesh'], ['19', 'West Bengal'],
    ];
    return (
      <div>
        <label className="block text-[10px] font-bold text-[#8a8695] uppercase tracking-wider mb-1">{label}</label>
        <select value={form[name]} onChange={e => update(name, e.target.value)}
          className="w-full bg-black/30 border border-[#2a2836] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
          <option value="">Select State</option>
          {states.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
        💡 Fill in the details below and download the JSON. Upload it to <a href="https://ewaybillgst.gov.in" target="_blank" rel="noopener noreferrer" className="underline">ewaybillgst.gov.in</a> to generate the E-Way Bill.
      </div>

      {/* Document Details */}
      <div>
        <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">📄 Document Details</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Doc Number" name="docNo" />
          <Field label="Doc Date" name="docDate" placeholder="DD/MM/YYYY" />
          <Field label="Total Invoice Value (₹)" name="totalValue" type="number" />
          <Field label="Primary HSN Code" name="hsnCode" placeholder="e.g. 4901" />
        </div>
      </div>

      {/* From */}
      <div>
        <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">📍 From (Your Shop)</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your GSTIN" name="fromGstin" placeholder="29ABCDE1234F1Z5" />
          <Field label="Trade Name" name="fromTradeName" />
          <div className="col-span-2"><Field label="Address Line 1" name="fromAddr1" /></div>
          <Field label="City / Town" name="fromPlace" />
          <Field label="PIN Code" name="fromPincode" type="number" />
          <StateSelect label="State" name="fromState" />
        </div>
      </div>

      {/* To */}
      <div>
        <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">📍 To (Customer)</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer GSTIN" name="toGstin" placeholder="Leave blank for URP" />
          <Field label="Trade Name" name="toTradeName" />
          <div className="col-span-2"><Field label="Address Line 1" name="toAddr1" /></div>
          <Field label="City / Town" name="toPlace" />
          <Field label="PIN Code" name="toPincode" type="number" />
          <StateSelect label="State" name="toState" />
        </div>
      </div>

      {/* Transport */}
      <div>
        <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">🚛 Transport Details</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#8a8695] uppercase tracking-wider mb-1">Mode</label>
            <select value={form.transMode} onChange={e => update('transMode', e.target.value)}
              className="w-full bg-black/30 border border-[#2a2836] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
              <option value="1">Road</option><option value="2">Rail</option>
              <option value="3">Air</option><option value="4">Ship</option>
            </select>
          </div>
          <Field label="Distance (km)" name="transDistance" type="number" placeholder="e.g. 50" />
          <Field label="Vehicle Number" name="vehicleNo" placeholder="HP48A1234" />
          <Field label="Transporter Name" name="transporterName" />
        </div>
      </div>

      <button onClick={generateJson}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-black py-3 rounded-xl transition-colors">
        ⬇ Download E-Way Bill JSON
      </button>
    </div>
  );
}
