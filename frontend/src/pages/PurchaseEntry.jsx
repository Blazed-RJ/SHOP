
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { ArrowLeft, Plus, Trash2, Save, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '../utils/currency';
import { debounce } from '../utils/debounce';

const PurchaseEntry = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const supplierIdParam = searchParams.get('supplierId');

    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [billNo, setBillNo] = useState('');
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Items State
    const [items, setItems] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Current editing item (for search selection)
    const [currentItemIndex, setCurrentItemIndex] = useState(null);

    // Load Suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const { data } = await api.get('/suppliers');
                setSuppliers(data);
                if (supplierIdParam) setSelectedSupplier(supplierIdParam);
            } catch (error) {
                console.error('Failed to load suppliers', error);
            }
        };
        fetchSuppliers();
    }, [supplierIdParam]);

    // Product Search
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const searchProducts = useCallback(
        debounce(async (query) => {
            if (!query) {
                setSearchResults([]);
                return;
            }
            try {
                const { data } = await api.get(`/products?search=${encodeURIComponent(query)}&limit=10`);
                setSearchResults(data.products || []);
            } catch (error) {
                console.error(error);
            }
        }, 500),
        []
    );

    useEffect(() => {
        searchProducts(productSearch);
    }, [productSearch, searchProducts]);

    const addItem = () => {
        setItems([...items, {
            productId: '',
            productName: '',
            isBatchTracked: false,
            batchNumber: '',
            expiryDate: '',
            quantity: 1,
            costPrice: 0,
            sellingPrice: 0,
            mrp: 0,
            total: 0
        }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Recalculate total if qty or cost changes
        if (field === 'quantity' || field === 'costPrice') {
            item.total = (parseFloat(item.quantity) || 0) * (parseFloat(item.costPrice) || 0);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleProductSelect = (product, index) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productId: product._id,
            productName: product.name,
            isBatchTracked: product.isBatchTracked,
            costPrice: product.costPrice || 0,
            sellingPrice: product.sellingPrice || 0,
            mrp: product.mrp || 0,
            // Reset batch info if product changes
            batchNumber: '',
            expiryDate: ''
        };
        setItems(newItems);
        setProductSearch('');
        setSearchResults([]);
        setCurrentItemIndex(null);
    };

    const calculateGrandTotal = () => {
        return items.reduce((sum, item) => sum + (item.total || 0), 0);
    };

    const handleSubmit = async () => {
        if (!selectedSupplier) return toast.error('Select a Supplier');
        if (items.length === 0) return toast.error('Add at least one item');

        // Validate Batches
        for (const item of items) {
            if (item.isBatchTracked && (!item.batchNumber || !item.expiryDate)) {
                return toast.error(`Batch & Expiry required for ${item.productName}`);
            }
        }

        try {
            const payload = {
                supplierId: selectedSupplier,
                billNo,
                billDate,
                items,
                totalAmount: calculateGrandTotal(),
                notes
            };

            await api.post('/purchases', payload);
            toast.success('Purchase Recorded Successfully');
            navigate('/suppliers/' + selectedSupplier);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record purchase');
        }
    };

    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            <ArrowLeft className="w-6 h-6 dark:text-gray-200" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold dark:text-white">New Stock Inward</h1>
                            <p className="text-gray-500 text-sm">Record items, batches, and prices</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all"
                    >
                        <Save className="w-5 h-5" />
                        Save Purchase
                    </button>
                </div>

                {/* Header Inputs */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Supplier</label>
                        <select
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Bill No</label>
                        <input
                            type="text"
                            value={billNo}
                            onChange={(e) => setBillNo(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. INV-001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Bill Date</label>
                        <input
                            type="date"
                            value={billDate}
                            onChange={(e) => setBillDate(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Notes</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Optional remarks"
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4 w-1/4">Product</th>
                                <th className="p-4">Batch Info</th>
                                <th className="p-4 w-24">Qty</th>
                                <th className="p-4 w-24">Cost</th>
                                <th className="p-4 w-24">Selling</th>
                                <th className="p-4 w-24">Total</th>
                                <th className="p-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 relative">
                                        {/* Product Search Input */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={item.productId ? item.productName : (currentItemIndex === index ? productSearch : '')}
                                                onFocus={() => {
                                                    setCurrentItemIndex(index);
                                                    setProductSearch('');
                                                }}
                                                onChange={(e) => {
                                                    setProductSearch(e.target.value);
                                                    if (item.productId) updateItem(index, 'productId', ''); // Clear selection on edit
                                                }}
                                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-emerald-500"
                                                placeholder="Search Product..."
                                            />
                                            {item.isBatchTracked && (
                                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded absolute right-2 top-2.5">BATCH</span>
                                            )}

                                            {/* Dropdown Results */}
                                            {currentItemIndex === index && searchResults.length > 0 && (
                                                <div className="absolute z-50 top-full left-0 w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg border mt-1 max-h-48 overflow-y-auto">
                                                    {searchResults.map(p => (
                                                        <div
                                                            key={p._id}
                                                            onClick={() => handleProductSelect(p, index)}
                                                            className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer border-b last:border-0 dark:border-gray-700"
                                                        >
                                                            <div className="font-bold dark:text-white">{p.name}</div>
                                                            <div className="text-xs text-gray-500">Stock: {p.stock} | SKU: {p.sku}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {item.isBatchTracked ? (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={item.batchNumber}
                                                    onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                                                    placeholder="Batch No"
                                                    className="w-full p-2 text-sm rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                                <input
                                                    type="date"
                                                    value={item.expiryDate ? item.expiryDate.split('T')[0] : ''}
                                                    onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                                                    className="w-full p-2 text-sm rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            className="w-20 p-2 text-right rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            min="1"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            value={item.costPrice}
                                            onChange={(e) => updateItem(index, 'costPrice', e.target.value)}
                                            className="w-24 p-2 text-right rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            value={item.sellingPrice}
                                            onChange={(e) => updateItem(index, 'sellingPrice', e.target.value)}
                                            className="w-24 p-2 text-right rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="p-4 font-bold text-right dark:text-white">
                                        {formatINR(item.total)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                            <tr>
                                <td colSpan="7" className="p-4">
                                    <button
                                        onClick={addItem}
                                        className="flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Item
                                    </button>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex justify-end mt-8">
                    <div className="text-right p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-full md:w-1/3">
                        <p className="text-gray-500 text-sm uppercase font-bold tracking-widest mb-1">Grand Total</p>
                        <p className="text-4xl font-black text-gray-900 dark:text-white">{formatINR(calculateGrandTotal())}</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseEntry;
