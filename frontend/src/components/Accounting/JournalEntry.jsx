
import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash, Save, Calculator } from 'lucide-react';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';

const JournalEntry = () => {
    const containerRef = useRef(null);
    useKeyboardNavigation(containerRef);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        narration: '',
        rows: [
            { ledger: '', debit: 0, credit: 0 },
            { ledger: '', debit: 0, credit: 0 }
        ]
    });
    const [ledgers, setLedgers] = useState([]);

    // Derived totals
    const totalDebit = formData.rows.reduce((sum, row) => sum + Number(row.debit), 0);
    const totalCredit = formData.rows.reduce((sum, row) => sum + Number(row.credit), 0);
    const difference = totalDebit - totalCredit;

    useEffect(() => {
        fetchLedgers();
    }, []);

    const fetchLedgers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/accounting/ledgers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLedgers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRowChange = (index, field, value) => {
        const newRows = [...formData.rows];
        newRows[index][field] = value;

        // Auto-clear other side if one is set (Basic logic, optional)
        if (field === 'debit' && value > 0) newRows[index].credit = 0;
        if (field === 'credit' && value > 0) newRows[index].debit = 0;

        setFormData({ ...formData, rows: newRows });
    };

    const addRow = () => {
        setFormData({
            ...formData,
            rows: [...formData.rows, { ledger: '', debit: 0, credit: 0 }]
        });
    };

    const removeRow = (index) => {
        if (formData.rows.length <= 2) return; // Min 2 rows for double entry
        const newRows = formData.rows.filter((_, i) => i !== index);
        setFormData({ ...formData, rows: newRows });
    };

    const handleSubmit = async () => {
        if (Math.abs(difference) > 0.05) {
            toast.error(`Mismatch! Difference: ${difference}`);
            return;
        }
        if (formData.rows.some(r => !r.ledger)) {
            toast.error('Select ledger for all rows');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/accounting/vouchers`, {
                date: formData.date,
                type: 'Journal',
                narration: formData.narration,
                entries: formData.rows
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Journal Voucher Saved!');
            // Reset
            setFormData({
                date: new Date().toISOString().split('T')[0],
                narration: '',
                rows: [
                    { ledger: '', debit: 0, credit: 0 },
                    { ledger: '', debit: 0, credit: 0 }
                ]
            });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save voucher');
        }
    };

    return (
        <div ref={containerRef} className="p-6 bg-gray-50 dark:bg-black min-h-screen">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calculator className="text-brand-500" />
                        Journal Entry (F7)
                    </h1>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2"
                    />
                </div>

                <div className="space-y-4 mb-8">
                    {formData.rows.map((row, index) => (
                        <div key={index} className="flex gap-4 items-center animate-fadeIn">
                            <span className="text-gray-400 w-8 text-center text-sm">{index + 1}</span>

                            <select
                                value={row.ledger}
                                onChange={(e) => handleRowChange(index, 'ledger', e.target.value)}
                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Select Account</option>
                                {/* Group options by group name optional, but flat list for now */}
                                {ledgers.map(l => (
                                    <option key={l._id} value={l._id}>{l.name} ({l.group.name})</option>
                                ))}
                            </select>

                            <div className="w-32 relative">
                                <span className="absolute left-2 top-2 text-gray-400 text-xs">Dr</span>
                                <input
                                    type="number"
                                    value={row.debit || ''}
                                    placeholder="0"
                                    onChange={(e) => handleRowChange(index, 'debit', e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-8 pr-2 py-2 text-sm text-right focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div className="w-32 relative">
                                <span className="absolute left-2 top-2 text-gray-400 text-xs">Cr</span>
                                <input
                                    type="number"
                                    value={row.credit || ''}
                                    placeholder="0"
                                    onChange={(e) => handleRowChange(index, 'credit', e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-8 pr-2 py-2 text-sm text-right focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <button onClick={() => removeRow(index)} className="text-gray-400 hover:text-red-500">
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                    <button
                        onClick={addRow}
                        className="text-brand-600 hover:text-brand-700 text-sm font-bold flex items-center gap-1"
                    >
                        <Plus size={16} /> Add Line
                    </button>

                    <div className="flex gap-8 text-right font-mono text-sm">
                        <div className="text-green-600 font-bold">
                            Total Dr: {totalDebit.toFixed(2)}
                        </div>
                        <div className="text-red-600 font-bold">
                            Total Cr: {totalCredit.toFixed(2)}
                        </div>
                        <div className={difference === 0 ? 'text-gray-400' : 'text-red-600 font-bold'}>
                            Diff: {difference.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Narration</label>
                    <textarea
                        value={formData.narration}
                        onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                        placeholder="Enter transaction details..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm"
                        rows={3}
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={difference !== 0}
                        className={`
                            px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg transition-all
                            ${difference === 0 ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30' : 'bg-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <Save size={18} />
                        Save Voucher
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JournalEntry;
