import React, { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatINR } from '../../utils/currency';

const IMEI_CATEGORIES = [
    'smartphone', 'keypad phone', 'mobile', 'phone', 'stub', 'cell', 'mi', 'vivo',
    'oppo', 'samsung', 'iphone', 'apple', 'android', 'electronics', 'watch',
    'laptop', 'buds', 'audio', 'speaker', 'serial', 'macbook', 'ipad', 'tablet'
];

const InvoiceItemRow = memo(({
    item,
    index,
    updateItem,
    removeItem
}) => {
    const shouldShowIdentityFields = item.showImei || (
        item.category && IMEI_CATEGORIES.some(c => item.category.toLowerCase().includes(c))
    );

    return (
        <tr className="hover:bg-rose-500/[0.02] dark:hover:bg-rose-500/[0.05] group/row transition-all duration-300">
            <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-bold text-xs">{index + 1}</td>
            <td className="px-4 py-3">
                <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 uppercase tracking-tight"
                    placeholder="Entity Designation"
                />
                {item.isCustom && <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full ml-2">Custom</span>}

                {/* Toggle for IMEI/Serial */}
                {!item.showImei && (
                    <button
                        onClick={() => updateItem(index, 'showImei', true)}
                        className="mt-1 text-[9px] font-black uppercase tracking-widest text-rose-400 opacity-0 group-hover/row:opacity-100 hover:text-rose-600 transition-all flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add IMEI / Serial
                    </button>
                )}

                {/* Conditional Identity Inputs */}
                {shouldShowIdentityFields && (
                    <div className="mt-2 grid grid-cols-1 gap-2 bg-rose-500/5 dark:bg-rose-500/10 p-3 rounded-xl border border-brand-500/80 dark:border-brand-500/70">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={item.imei || ''}
                                onChange={(e) => updateItem(index, 'imei', e.target.value)}
                                className="w-full bg-white/50 dark:bg-black/40 border border-brand-500/20 dark:border-brand-500/10 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 placeholder-rose-200 dark:placeholder-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                placeholder="IMEI 1"
                            />
                            <input
                                type="text"
                                value={item.imei2 || ''}
                                onChange={(e) => updateItem(index, 'imei2', e.target.value)}
                                className="w-full bg-white/50 dark:bg-black/40 border border-brand-500/20 dark:border-brand-500/10 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 placeholder-rose-200 dark:placeholder-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                placeholder="IMEI 2"
                            />
                        </div>
                        <input
                            type="text"
                            value={item.serialNumber || ''}
                            onChange={(e) => updateItem(index, 'serialNumber', e.target.value)}
                            className="w-full bg-white/50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 placeholder-rose-200 dark:placeholder-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            placeholder="Serial"
                        />
                    </div>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col items-center">
                    <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-16 bg-rose-500/5 dark:bg-rose-500/10 border border-transparent rounded-lg px-1 py-1 text-center text-base font-black text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/10"
                        min="1"
                    />
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col items-end">
                    <input
                        type="number"
                        value={item.pricePerUnit}
                        onChange={(e) => updateItem(index, 'pricePerUnit', e.target.value)}
                        className="w-28 bg-transparent border-none focus:ring-0 p-0 text-right text-base font-black text-gray-900 dark:text-white"
                    />
                    <span className="text-[9px] font-black text-gray-400 tracking-widest">UNIT INR</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <select
                    value={item.gstPercent}
                    onChange={(e) => updateItem(index, 'gstPercent', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-center text-xs font-black text-rose-600 dark:text-rose-400 cursor-pointer appearance-none"
                >
                    {[0, 5, 12, 18, 28].map(v => <option key={v} value={v} className="text-gray-900">{v}%</option>)}
                </select>
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-500 dark:text-gray-400 text-sm">
                {formatINR(item.gstAmount)}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="font-black text-base text-gray-900 dark:text-white">{formatINR(item.totalAmount)}</div>
                <div className="text-[8px] font-black text-rose-500/50 uppercase tracking-tighter italic">Secured</div>
            </td>
            <td className="px-4 py-3 text-center">
                <button
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
});

export default InvoiceItemRow;
