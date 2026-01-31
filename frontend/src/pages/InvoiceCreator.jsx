import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { formatINR } from '../utils/currency';
import { calculateLineTotal, calculateInvoiceSummary } from '../utils/gstCalculator';
import { useSettings } from '../context/SettingsContext';
import {
    Search,
    Plus,
    Trash2,
    Calendar,
    User,
    ChevronDown,
    ChevronUp,
    Store,
    Save,
    Printer,
    Share2,
    FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { InvoiceRenderer } from '../components/Invoice/InvoiceTemplates';

const InvoiceCreator = () => {
    const navigate = useNavigate();
    const { settings, loading: settingsLoading } = useSettings();
    console.log('InvoiceCreator Render/Settings:', { settings, loading: settingsLoading });
    const [loading, setLoading] = useState(false);





    // Data Sources
    const [customers, setCustomers] = useState([]);

    // Fetch Data on Mount (Fix for Search)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersRes] = await Promise.all([
                    api.get('/customers')
                ]);
                setCustomers(customersRes.data.customers || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to load products or customers');
            }
        };
        fetchData();
    }, []);

    // UI State
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showCompanyDetails, setShowCompanyDetails] = useState(true);
    const [sellerDetails, setSellerDetails] = useState({
        storeName: '',
        tagline: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        bankDetails: '',
        upiId: '',
        website: '',
        termsAndConditions: '',
        authSignLabel: '',
        footerFontSize: 12,
        footerFontFamily: 'sans-serif',
        footerAlignment: 'center'
    });

    const [items, setItems] = useState([]);
    const [invoiceSettings, setInvoiceSettings] = useState({
        title: 'Tax Invoice',
        invoiceNo: 'New',
        date: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    });
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        notes: ''
    });
    const [newItemConfig, setNewItemConfig] = useState({
        selectedProduct: null,
        qty: 1
    });
    const [payment, setPayment] = useState({
        cash: '',
        upi: '',
        card: '',
        bank: ''
    });

    // Initialize Seller Details from Settings
    useEffect(() => {
        if (settings) {
            setSellerDetails({
                storeName: settings.storeName || settings.shopName || '',
                tagline: '', // Manually entered
                address: settings.address || '',
                phone: settings.phone || '',
                email: settings.email || '',
                gstin: settings.gstin || settings.gstNumber || '',
                bankDetails: (settings.bankName && settings.accountNumber)
                    ? `${settings.bankName}, A/c: ${settings.accountNumber}, IFSC: ${settings.ifscCode}`
                    : '',
                upiId: settings.upi || settings.upiId || '',
                website: settings.website || '',
                termsAndConditions: settings.termsAndConditions || '',
                invoiceFooterText: settings.invoiceFooterText || '',
                authSignLabel: settings.authSignLabel || 'Authorized Signatory',
                footerFontSize: settings.footerFontSize || 12,
                footerFontFamily: settings.footerFontFamily || 'sans-serif',
                footerAlignment: settings.footerAlignment || 'center'
            });
        }
    }, [settings]);

    // Product Search Logic (Debounced Server-side)
    useEffect(() => {
        const fetchProducts = async () => {
            if (!searchQuery) {
                setFilteredProducts([]);
                setShowProductSearch(false);
                return;
            }

            try {
                const res = await api.get(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=10`);
                // Backend returns { products, total, ... }
                setFilteredProducts(res.data.products || []);
                setShowProductSearch(true);
            } catch (error) {
                console.error('Product search error:', error);
            }
        };

        const timeoutId = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Customer Selection
    const handleCustomerSelect = (customerId) => {
        if (!customerId) return;
        const customer = customers.find(c => c._id === customerId);
        if (customer) {
            setCustomerInfo({
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                gstin: customer.gstin || '',
                address: customer.address || ''
            });
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        // Search for exact match by phone
        const found = customers.find(c => c.phone && c.phone.trim() === value.trim());

        if (found) {
            setCustomerInfo({
                _id: found._id,
                name: found.name,
                phone: found.phone, // Use stored phone to ensure consistency
                email: found.email || '',
                gstin: found.gstin || '',
                address: found.address || '',
                notes: found.notes || ''
            });
            toast.success('Existing customer details loaded');
        } else {
            // Just update the phone number if no match
            setCustomerInfo(prev => ({ ...prev, phone: value }));
        }
    };

    if (settingsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-gray-500">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading invoice settings...
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-red-500 p-8 bg-red-50 rounded-lg">
                    <p className="font-semibold mb-2">Failed to load invoice settings</p>
                    <p className="text-sm mb-4">Please check your connection and try again.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Add Item Logic
    const addItem = (product = null, isCustom = false) => {
        const qty = parseInt(newItemConfig.qty) || 1;

        let newItem;
        if (isCustom) {
            newItem = {
                productId: null,
                name: '',
                isCustom: true,
                showImei: true, // Show fields by default for custom items
                quantity: 1,
                pricePerUnit: 0,
                gstPercent: 0,
                taxableValue: 0,
                gstAmount: 0,
                totalAmount: 0
            };
        } else if (product) {
            // Check if exists
            const existingIndex = items.findIndex(i => i.productId === product._id);
            if (existingIndex >= 0) {
                toast.success('Product already added. Adjusted quantity.');
                updateItem(existingIndex, 'quantity', items[existingIndex].quantity + qty);
                setSearchQuery('');
                return;
            }

            newItem = {
                productId: product._id,
                name: product.name,
                category: product.category, // Store category for IMEI check
                showImei: false, // Default to hidden for inventory unless auto-detected
                imei: '', // Init IMEI 1
                imei2: '', // Init IMEI 2
                serialNumber: '', // Init Serial
                isCustom: false,
                quantity: qty,
                pricePerUnit: product.sellingPrice,
                gstPercent: product.gstPercent,
                ...calculateLineTotal(qty, product.sellingPrice, product.gstPercent, true)
            };
        }

        if (newItem) {
            setItems([...items, newItem]);
            setSearchQuery('');
            setNewItemConfig({ selectedProduct: null, qty: 1 });
            if (!isCustom) setShowProductSearch(false);
        }
    };

    // Update Item
    const updateItem = (index, field, value) => {
        const updatedItems = [...items];
        const item = { ...updatedItems[index] };

        if (field === 'quantity') item.quantity = parseFloat(value) || 0;
        if (field === 'pricePerUnit') item.pricePerUnit = parseFloat(value) || 0;
        if (field === 'gstPercent') item.gstPercent = parseFloat(value) || 0;
        if (field === 'name') item.name = value;
        if (field === 'imei') item.imei = value;
        if (field === 'imei2') item.imei2 = value;
        if (field === 'serialNumber') item.serialNumber = value;
        if (field === 'showImei') item.showImei = value;

        // Recalculate
        const totals = calculateLineTotal(
            item.quantity,
            item.pricePerUnit,
            item.gstPercent,
            true // Inclusive tax calculation preferred for retail
        );

        updatedItems[index] = { ...item, ...totals };
        setItems(updatedItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Calculations
    const summary = calculateInvoiceSummary(items);
    const totalPaid = Object.values(payment).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const balanceDue = summary.grandTotal - totalPaid;
    const isFullyPaid = balanceDue <= 0.5; // Tolerance for float

    // Submit
    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error('Add items to invoice first');
            return;
        }

        if (!customerInfo.name) {
            toast.error('Customer name is required');
            return;
        }

        try {
            setLoading(true);
            const invoicePayload = {
                customerId: customerInfo._id || undefined, // FIXED: was 'customer', backend expects 'customerId'
                invoiceType: invoiceSettings.title,
                invoiceDate: invoiceSettings.date,
                items: items.map(item => ({
                    productId: item.productId, // FIXED: was 'product', backend expects 'productId'
                    itemName: item.name,
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    gstPercent: item.gstPercent,
                    isTaxInclusive: true, // All items are tax-inclusive in this UI
                    imei: item.imei, // Include IMEI 1
                    imei2: item.imei2, // Include IMEI 2
                    serialNumber: item.serialNumber // Include Serial
                })),
                payments: Object.entries(payment)
                    .filter(([_, amount]) => amount > 0)
                    .map(([mode, amount]) => ({
                        method: mode.charAt(0).toUpperCase() + mode.slice(1),
                        amount
                    })),
                customerName: customerInfo.name,
                customerPhone: customerInfo.phone,
                customerAddress: customerInfo.address,
                customerGstin: customerInfo.gstin,
                sellerDetails,
                notes: customerInfo.notes || ''
            };

            const { data } = await api.post('/invoices', invoicePayload);
            toast.success('Invoice Created Successfully!');
            navigate('/invoices');

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Evolution Header */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-rose-500/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-rose-500" />
                                </div>
                                <span className="text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-[0.3em]">Transaction Forge</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                Create New <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500">Invoice</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Generate a fully customizable invoice
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`flex items-center space-x-2 px-8 py-4 ${loading ? 'bg-gray-400' : 'bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 shadow-rose-500/25'} text-white rounded-2xl shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group`}
                            >
                                <Save className={`${loading ? 'animate-pulse' : 'group-hover:scale-110'} w-6 h-6 transition-transform`} />
                                <span className="font-black tracking-tight text-lg">{loading ? 'Finalizing...' : 'Save Invoice'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                    {/* LEFT SIDEBAR (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Invoice Settings */}
                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[28px] border border-white dark:border-white/5 shadow-2xl p-6">
                            <h3 className="font-black text-xs uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-6 flex items-center gap-3">
                                <Printer className="w-4 h-4" />
                                Invoice Settings
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Invoice Title</label>
                                    <select
                                        value={invoiceSettings.title}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, title: e.target.value })}
                                        className="w-full px-5 py-3.5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none"
                                    >
                                        <option value="Tax Invoice">TAX INVOICE</option>
                                        <option value="Bill of Supply">BILL OF SUPPLY</option>
                                        <option value="Estimate">ESTIMATE / QUOTATION</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Invoice Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={invoiceSettings.date}
                                            onChange={(e) => setInvoiceSettings({ ...invoiceSettings, date: e.target.value })}
                                            className="w-full px-5 py-3.5 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                        />
                                        <Calendar className="w-4 h-4 text-rose-500 absolute right-4 top-4 pointer-events-none" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">Supports backdating</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[28px] border border-white dark:border-white/5 shadow-2xl p-6">
                            <h3 className="font-black text-xs uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-6 flex items-center gap-3">
                                <User className="w-4 h-4" />
                                Customer Information
                            </h3>

                            {/* Intelligent Search */}
                            <div className="mb-6 relative group">
                                <input
                                    type="text"
                                    placeholder="Search existing customer..."
                                    className="w-full pl-12 pr-6 py-4 border border-rose-100 dark:border-white/5 bg-rose-50/50 dark:bg-rose-500/5 rounded-[22px] text-sm font-medium focus:ring-4 focus:ring-rose-500/10 focus:bg-white dark:focus:bg-black tertiary-input transition-all placeholder-rose-300 dark:placeholder-rose-800"
                                    onChange={(e) => {
                                        const found = customers.find(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()) || c.phone.includes(e.target.value));
                                        if (found) handleCustomerSelect(found._id);
                                    }}
                                />
                                <Search className="w-5 h-5 text-rose-400 absolute left-4 top-4 group-focus-within:rotate-90 transition-transform" />
                            </div>

                            <div className="space-y-5">
                                {[
                                    { label: 'Customer Name *', value: 'name', type: 'text', placeholder: 'Enter customer name', icon: User },
                                    { label: 'Mobile Number', value: 'phone', type: 'text', placeholder: '+91 98765 43210', onChange: handlePhoneChange },
                                    { label: 'Email', value: 'email', type: 'email', placeholder: 'customer@email.com' },
                                    { label: 'GSTIN', value: 'gstin', type: 'text', placeholder: 'GSTIN (Optional)' }
                                ].map((field) => (
                                    <div key={field.value}>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={customerInfo[field.value]}
                                            onChange={field.onChange || ((e) => setCustomerInfo({ ...customerInfo, [field.value]: e.target.value }))}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            placeholder={field.placeholder}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Company Details */}
                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[28px] border border-white dark:border-white/5 shadow-2xl overflow-hidden">
                            <button
                                onClick={() => setShowCompanyDetails(!showCompanyDetails)}
                                className="w-full p-6 flex items-center justify-between hover:bg-rose-50/50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="font-black text-xs uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-3">
                                    <Store className="w-4 h-4" />
                                    Company Details
                                </span>
                                {showCompanyDetails ?
                                    <ChevronUp className="w-4 h-4 text-rose-400" /> :
                                    <ChevronDown className="w-4 h-4 text-rose-400" />
                                }
                            </button>

                            {showCompanyDetails && (
                                <div className="px-6 pb-6 pt-0 flex flex-col gap-5">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 italic font-medium ml-1">
                                        These details are pre-filled from Store Settings. Edit here for this invoice only.
                                    </p>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.storeName}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, storeName: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            placeholder="Your Business Name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Tagline</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.tagline}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, tagline: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            placeholder="e.g., Best Deals In Tech"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Address</label>
                                        <textarea
                                            value={sellerDetails.address}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, address: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            rows="2"
                                            placeholder="Shop address..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Mobile</label>
                                            <input
                                                type="text"
                                                value={sellerDetails.phone}
                                                onChange={(e) => setSellerDetails({ ...sellerDetails, phone: e.target.value })}
                                                className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                                placeholder="+91..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email</label>
                                            <input
                                                type="text"
                                                value={sellerDetails.email}
                                                onChange={(e) => setSellerDetails({ ...sellerDetails, email: e.target.value })}
                                                className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                                placeholder="contact@..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">GSTIN</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.gstin}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, gstin: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            placeholder="GSTIN"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Bank Details</label>
                                        <textarea
                                            value={sellerDetails.bankDetails}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, bankDetails: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            rows="2"
                                            placeholder="Bank Name, A/c No, IFSC..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Terms & Conditions</label>
                                        <textarea
                                            value={sellerDetails.termsAndConditions}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, termsAndConditions: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            rows="3"
                                            placeholder="Terms..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Footer Note</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.invoiceFooterText}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, invoiceFooterText: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            placeholder="Thank you..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Signatory Label</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.authSignLabel}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, authSignLabel: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            placeholder="Authorized Signatory"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">UPI ID (for QR Code)</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.upiId}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, upiId: e.target.value })}
                                            className="w-full px-5 py-3 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            placeholder="yourshop@upi"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* CENTER CONTENT (6 cols) */}
                    <div className="lg:col-span-6 space-y-6">

                        {/* Document Asset Selection */}
                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 shadow-2xl p-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-6 flex items-center gap-3">
                                <Store className="w-4 h-4" />
                                Add Products
                            </h3>

                            <div className="flex flex-col md:flex-row gap-4 items-end mb-8">
                                <div className="flex-1 relative">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Select from Inventory</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Choose a product..."
                                            className="w-full px-6 py-4 border border-rose-100 dark:border-white/10 rounded-[22px] focus:ring-4 focus:ring-rose-500/10 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all font-bold"
                                        />
                                        <Search className="w-5 h-5 text-rose-400 absolute right-6 top-4 group-focus-within:scale-110 transition-transform" />

                                        {showProductSearch && searchQuery && filteredProducts.length > 0 && (
                                            <div className="absolute z-50 w-full mt-3 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/5 rounded-[28px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.5)] max-h-[400px] overflow-y-auto overflow-x-hidden p-2 no-scrollbar">
                                                {filteredProducts.map(p => (
                                                    <div
                                                        key={p._id}
                                                        onClick={() => addItem(p)}
                                                        className="p-4 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 cursor-pointer rounded-[20px] transition-all duration-300 flex justify-between items-center group/item mb-1 last:mb-0 border border-transparent hover:border-rose-500/20"
                                                    >
                                                        <div>
                                                            <div className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight group-hover/item:translate-x-1 transition-transform">{p.name}</div>
                                                            <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">AVAILABILITY: {p.stock} units | SIGNATURE: {p.sku}</div>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <div className="font-black text-lg text-rose-600 dark:text-rose-400">{formatINR(p.sellingPrice)}</div>
                                                            <Plus className="w-4 h-4 text-rose-400 opacity-0 group-hover/item:opacity-100 -translate-x-4 group-hover/item:translate-x-0 transition-all" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-32">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Scale</label>
                                    <input
                                        type="number"
                                        value={newItemConfig.qty}
                                        onChange={(e) => setNewItemConfig({ ...newItemConfig, qty: e.target.value })}
                                        className="w-full px-4 py-4 border border-rose-100 dark:border-white/10 rounded-[22px] text-center text-gray-900 dark:text-white font-black text-xl bg-white/50 dark:bg-black/20 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500"
                                        min="1"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (filteredProducts.length > 0) addItem(filteredProducts[0]);
                                    }}
                                    className="px-10 py-4 bg-rose-600 dark:bg-rose-500 text-white rounded-[22px] font-black uppercase tracking-widest text-xs hover:bg-rose-700 shadow-xl shadow-rose-600/20 transition-all transform hover:-translate-y-1 active:scale-95"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                <button
                                    onClick={() => addItem(null, true)}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 hover:rose-800 flex items-center gap-3 px-6 py-4 border border-dashed border-rose-200 dark:border-rose-900/50 rounded-[22px] hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all w-full justify-center group"
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                                    add Custom Item (Service, Repair, etc)
                                </button>
                            </div>

                            {/* Items Table - High Fidelity */}
                            <div className="mt-8 overflow-x-auto rounded-[32px] border border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3 w-10">#</th>
                                            <th className="px-4 py-3 min-w-[250px]">ITEM NAME</th>
                                            <th className="px-4 py-3 w-28 text-center">Qty</th>
                                            <th className="px-4 py-3 w-36 text-right">RATE (₹)</th>
                                            <th className="px-4 py-3 w-20 text-center">GST %</th>
                                            <th className="px-4 py-3 w-32 text-right">TAX AMT</th>
                                            <th className="px-4 py-3 w-36 text-right">TOTAL</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-gray-400 dark:text-gray-600 font-medium italic text-xs">
                                                    Nexus currently empty. Initialize assets to populate document.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item, index) => (
                                                <tr key={index} className="hover:bg-rose-500/[0.02] dark:hover:bg-rose-500/[0.05] group/row transition-all duration-300">
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
                                                        {(item.showImei || (item.category && ['smartphone', 'keypad phone', 'mobile', 'phone', 'stub', 'cell', 'mi', 'vivo', 'oppo', 'samsung', 'iphone', 'apple', 'android', 'electronics', 'watch', 'laptop', 'buds', 'audio', 'speaker', 'serial', 'macbook', 'ipad', 'tablet'].some(c => item.category.toLowerCase().includes(c)))) && (
                                                            <div className="mt-2 grid grid-cols-1 gap-2 bg-rose-500/5 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-500/10">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={item.imei || ''}
                                                                        onChange={(e) => updateItem(index, 'imei', e.target.value)}
                                                                        className="w-full bg-white/50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 placeholder-rose-200 dark:placeholder-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                                                        placeholder="IMEI 1"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={item.imei2 || ''}
                                                                        onChange={(e) => updateItem(index, 'imei2', e.target.value)}
                                                                        className="w-full bg-white/50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 placeholder-rose-200 dark:placeholder-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
                                                            className="w-full bg-transparent border-none focus:ring-0 text-center text-xs font-black text-rose-600 dark:text-rose-400 cursor-pointer"
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
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (3 cols) - Financial Intelligence & Preview */}
                    <div className="lg:col-span-3 space-y-8 sticky top-8 self-start h-fit">
                        {/* Summary Card */}
                        <div className="bg-slate-900 dark:bg-black rounded-[32px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.4)] overflow-hidden border border-white/10 p-8">
                            <div className="mb-10">
                                <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Payment Breakdown</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">total</span>
                                        <span className="text-white font-black text-xl">{formatINR(summary.totalTaxable)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Gst%</span>
                                        <span className="text-rose-400 font-black text-xl">{formatINR(summary.totalGST)}</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-6"></div>
                                    <div className="flex flex-col">
                                        <span className="text-rose-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1">grand total</span>
                                        <span className="text-white font-black text-4xl tracking-tighter">{formatINR(summary.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Payment by</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'CASH', value: 'cash' },
                                        { label: 'UPI / DIGITAL', value: 'upi' },
                                        { label: 'CARD', value: 'card' },
                                        { label: 'BANK TRANSFER', value: 'bank' }
                                    ].map(mode => (
                                        <div key={mode.value} className="bg-white/5 rounded-2xl p-4 border border-white/5 focus-within:border-rose-500 transition-all">
                                            <label className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">{mode.label}</label>
                                            <input
                                                type="number"
                                                value={payment[mode.value]}
                                                onChange={(e) => setPayment({ ...payment, [mode.value]: e.target.value })}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-white font-black text-lg"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`p-6 rounded-2xl ${balanceDue > 0.5 ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'} transition-all`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${balanceDue > 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {balanceDue > 0.5 ? 'Balance Due (Udhaar)' : 'Obligation Neutralized'}
                                    </span>
                                    <span className={`font-black text-xl ${balanceDue > 0.5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {formatINR(balanceDue > 0 ? balanceDue : 0)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full mt-8 py-5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-rose-500/40 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group"
                            >
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                {loading ? 'PROTOCOL SYNCING...' : 'save TAX INVOICE'}
                            </button>
                        </div>

                        {/* Live Preview - Premium Edition */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
                                    <Printer className="w-3 h-3 text-rose-500" />
                                    Live Invoice Preview
                                </h3>
                                <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">
                                    {settings?.invoiceTemplate?.templateId || 'MODERN'} LAYOUT
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-[28px] p-2 shadow-2xl border-4 border-gray-700 backdrop-blur-md print:shadow-none print:border-none print:bg-transparent print:p-0">
                                <div className="bg-gray-900 rounded-[24px] overflow-hidden aspect-[1/1.414] relative print:overflow-visible print:aspect-auto print:bg-transparent print:rounded-none">
                                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar print:relative print:inset-auto print:overflow-visible">
                                        <InvoiceRenderer
                                            templateId={settings?.invoiceTemplate?.templateId || 'modern'}
                                            data={{
                                                invoiceNo: invoiceSettings.invoiceNo,
                                                date: invoiceSettings.date,
                                                customerName: customerInfo.name,
                                                customerPhone: customerInfo.phone,
                                                customerAddress: customerInfo.address,
                                                customerGstin: customerInfo.gstin,
                                                items: items.map(i => ({ ...i, price: i.pricePerUnit, total: i.totalAmount })),
                                                subtotal: summary.totalTaxable,
                                                tax: summary.totalGST,
                                                total: summary.grandTotal,
                                                terms: sellerDetails.termsAndConditions,
                                                upiId: sellerDetails.upiId,
                                                digitalSignature: settings?.digitalSignature,
                                                authSignLabel: sellerDetails.authSignLabel
                                            }}
                                            settings={{
                                                ...settings,
                                                shopName: sellerDetails.storeName,
                                                address: sellerDetails.address,
                                                phone: sellerDetails.phone,
                                                email: sellerDetails.email,
                                                gstin: sellerDetails.gstin,
                                                invoiceFooterText: sellerDetails.invoiceFooterText,
                                                bankDetails: sellerDetails.bankDetails,
                                                brandColor: settings?.brandColor,
                                                primaryTextColor: settings?.primaryTextColor,
                                                logo: settings?.logo,
                                                fieldVisibility: settings?.invoiceTemplate?.fieldVisibility || {
                                                    shippingAddress: false,
                                                    taxBreakdown: true,
                                                    signature: true,
                                                    footer: true,
                                                    bankDetails: true,
                                                    qrCode: true,
                                                    terms: true
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const InvoiceCreatorWithErrorBoundary = () => (
    <ErrorBoundary>
        <InvoiceCreator />
    </ErrorBoundary>
);

export default InvoiceCreatorWithErrorBoundary;
