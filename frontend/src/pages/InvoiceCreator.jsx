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
    Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const InvoiceCreator = () => {
    const navigate = useNavigate();
    const { settings, loading: settingsLoading } = useSettings();
    console.log('InvoiceCreator Render/Settings:', { settings, loading: settingsLoading });
    const [loading, setLoading] = useState(false);





    // Data Sources
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Fetch Data on Mount (Fix for Search)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, customersRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/customers')
                ]);
                setProducts(productsRes.data);
                setCustomers(customersRes.data);
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

    // Product Search Logic
    useEffect(() => {
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.category.toLowerCase().includes(lower) ||
                p.sku?.toLowerCase().includes(lower)
            );
            setFilteredProducts(filtered);
            setShowProductSearch(true);
        } else {
            setFilteredProducts([]);
            setShowProductSearch(false);
        }
    }, [searchQuery, products]);

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
            <div className="p-6 max-w-[1600px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Invoice</h1>
                    <p className="text-gray-600 dark:text-gray-400">Generate a fully customizable invoice</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT SIDEBAR (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Invoice Settings */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                Invoice Settings
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Invoice Title</label>
                                    <select
                                        value={invoiceSettings.title}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="Tax Invoice">TAX INVOICE</option>
                                        <option value="Bill of Supply">BILL OF SUPPLY</option>
                                        <option value="Estimate">ESTIMATE / QUOTATION</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Invoice Date</label>
                                    <input
                                        type="date"
                                        value={invoiceSettings.date}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Supports backdating</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                Customer Information
                            </h3>

                            {/* Search Existing */}
                            <div className="mb-4 relative">
                                <input
                                    type="text"
                                    placeholder="Search existing customer..."
                                    className="w-full pl-9 pr-3 py-2 border border-blue-100 dark:border-gray-600 bg-blue-50 dark:bg-gray-700 rounded-lg text-sm focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors placeholder-gray-500 hover:bg-white dark:hover:bg-gray-600"
                                    onChange={(e) => {
                                        const found = customers.find(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()) || c.phone.includes(e.target.value));
                                        if (found) handleCustomerSelect(found._id);
                                    }}
                                />
                                <Search className="w-4 h-4 text-blue-400 absolute left-3 top-2.5" />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="Enter customer name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">Mobile Number</label>
                                    <input
                                        type="text"
                                        value={customerInfo.phone}
                                        onChange={handlePhoneChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={customerInfo.email}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="customer@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        value={customerInfo.gstin}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, gstin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="GSTIN (Optional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Company Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <button
                                onClick={() => setShowCompanyDetails(!showCompanyDetails)}
                                className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <Store className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    Company Details
                                </span>
                                {showCompanyDetails ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                            </button>

                            {showCompanyDetails && (
                                <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                                    <p className="text-[10px] text-gray-500 italic">These details are pre-filled from Store Settings. Edit here for this invoice only.</p>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.storeName}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, storeName: e.target.value })}
                                            className="w-full text-sm font-bold text-gray-900 dark:text-white border-none border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-0 px-0 py-1 bg-transparent placeholder-gray-400"
                                            placeholder="Your Business Name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Tagline</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.tagline}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, tagline: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-gray-300 border-none border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-0 px-0 py-1 bg-transparent placeholder-gray-400"
                                            placeholder="e.g., Best Deals In Tech"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Address</label>
                                        <textarea
                                            value={sellerDetails.address}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, address: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 placeholder-gray-400"
                                            rows="2"
                                            placeholder="Shop address..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-300 mb-1">Mobile</label>
                                            <input
                                                type="text"
                                                value={sellerDetails.phone}
                                                onChange={(e) => setSellerDetails({ ...sellerDetails, phone: e.target.value })}
                                                className="w-full text-xs text-gray-600 dark:text-white border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 placeholder-gray-400"
                                                placeholder="+91..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-300 mb-1">Email</label>
                                            <input
                                                type="text"
                                                value={sellerDetails.email}
                                                onChange={(e) => setSellerDetails({ ...sellerDetails, email: e.target.value })}
                                                className="w-full text-xs text-gray-600 dark:text-white border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 placeholder-gray-400"
                                                placeholder="contact@..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-300 mb-1">GSTIN</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.gstin}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, gstin: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-white border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 placeholder-gray-400"
                                            placeholder="GSTIN"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Bank Details</label>
                                        <textarea
                                            value={sellerDetails.bankDetails}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, bankDetails: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 placeholder-gray-400"
                                            rows="2"
                                            placeholder="Bank Name, A/c No, IFSC..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Terms & Conditions</label>
                                        <textarea
                                            value={sellerDetails.termsAndConditions}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, termsAndConditions: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 placeholder-gray-400"
                                            rows="3"
                                            placeholder="Terms..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Footer Note</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.invoiceFooterText}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, invoiceFooterText: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 placeholder-gray-400"
                                            placeholder="Thank you..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Signatory Label</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.authSignLabel}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, authSignLabel: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 placeholder-gray-400"
                                            placeholder="Authorized Signatory"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">UPI ID (for QR Code)</label>
                                        <input
                                            type="text"
                                            value={sellerDetails.upiId}
                                            onChange={(e) => setSellerDetails({ ...sellerDetails, upiId: e.target.value })}
                                            className="w-full text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 placeholder-gray-400"
                                            placeholder="yourshop@upi"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* CENTER CONTENT (6 cols) */}
                    <div className="lg:col-span-6 space-y-6">

                        {/* Add Products */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Add Products</h3>

                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 relative">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Select from Inventory</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Choose a product..."
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                        />
                                        {showProductSearch && searchQuery && filteredProducts.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {filteredProducts.map(p => (
                                                    <div
                                                        key={p._id}
                                                        onClick={() => addItem(p)}
                                                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-0 border-gray-100 dark:border-gray-700 flex justify-between items-center"
                                                    >
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Stock: {p.stock} | SKU: {p.sku}</div>
                                                        </div>
                                                        <div className="font-semibold text-blue-600 dark:text-blue-400">{formatINR(p.sellingPrice)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        value={newItemConfig.qty}
                                        onChange={(e) => setNewItemConfig({ ...newItemConfig, qty: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-gray-900 dark:text-white font-semibold bg-white dark:bg-gray-700"
                                        min="1"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (filteredProducts.length > 0) addItem(filteredProducts[0]);
                                    }}
                                    className="px-6 py-2.5 bg-gray-900 dark:bg-blue-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => addItem(null, true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2 font-medium px-3 py-2 border border-dashed border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full md:w-auto justify-center"
                                >
                                    <Plus className="w-4 h-4" /> Add Custom Item (Service, Repair, etc.)
                                </button>
                            </div>

                            {/* Items Table */}
                            <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium">
                                        <tr>
                                            <th className="px-4 py-3 w-10">#</th>
                                            <th className="px-4 py-3 min-w-[200px]">ITEM NAME</th>
                                            <th className="px-4 py-3 w-28 text-center">QTY</th>
                                            <th className="px-4 py-3 w-40 text-right">RATE (₹)</th>
                                            <th className="px-4 py-3 w-20 text-center">GST %</th>
                                            <th className="px-4 py-3 w-28 text-right">TAX AMT</th>
                                            <th className="px-4 py-3 w-32 text-right">TOTAL</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                                                    No items added yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group transition-colors">
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{index + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 py-2 px-1 focus:ring-0 text-base font-semibold text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
                                                            placeholder="Item Name"
                                                        />
                                                        {item.isCustom && <span className="text-[10px] text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded ml-2">Custom</span>}

                                                        {/* Toggle for IMEI/Serial */}
                                                        {!item.showImei && (
                                                            <button
                                                                onClick={() => updateItem(index, 'showImei', true)}
                                                                className="ml-2 text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
                                                            >
                                                                + Add IMEI/Serial
                                                            </button>
                                                        )}

                                                        {/* Conditional IMEI Inputs */}
                                                        {(item.showImei || (item.category && ['smartphone', 'keypad phone', 'mobile', 'phone', 'stub', 'cell', 'mi', 'vivo', 'oppo', 'samsung', 'iphone', 'apple', 'android', 'electronics'].some(c => item.category.toLowerCase().includes(c)))) && (
                                                            <div className="mt-2 grid grid-cols-2 gap-2 bg-orange-50 dark:bg-gray-700/50 p-2 rounded-lg border border-orange-100 dark:border-gray-600">
                                                                <div>
                                                                    <input
                                                                        type="text"
                                                                        value={item.imei || ''}
                                                                        onChange={(e) => updateItem(index, 'imei', e.target.value)}
                                                                        className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-xs text-center text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                                                        placeholder="IMEI 1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <input
                                                                        type="text"
                                                                        value={item.imei2 || ''}
                                                                        onChange={(e) => updateItem(index, 'imei2', e.target.value)}
                                                                        className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-xs text-center text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                                                        placeholder="IMEI 2"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Conditional Serial Number Input */}
                                                        {(item.showImei || (item.category && ['watch', 'laptop', 'buds', 'audio', 'speaker', 'serial', 'macbook', 'ipad', 'tablet', 'electronics'].some(c => item.category.toLowerCase().includes(c)))) && (
                                                            <div className="mt-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.serialNumber || ''}
                                                                    onChange={(e) => updateItem(index, 'serialNumber', e.target.value)}
                                                                    className="w-full bg-blue-50 dark:bg-gray-700/50 border border-blue-100 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                                                                    placeholder="Serial Number (Optional)"
                                                                />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-center text-sm font-semibold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={item.pricePerUnit}
                                                                onChange={(e) => updateItem(index, 'pricePerUnit', e.target.value)}
                                                                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded pl-2 pr-1 py-2 text-right text-base font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={item.gstPercent}
                                                            onChange={(e) => updateItem(index, 'gstPercent', e.target.value)}
                                                            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 py-1 text-center text-sm font-semibold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                                                        >
                                                            <option value="0">0%</option>
                                                            <option value="5">5%</option>
                                                            <option value="12">12%</option>
                                                            <option value="18">18%</option>
                                                            <option value="28">28%</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                                        {formatINR(item.gstAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                        {formatINR(item.totalAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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

                            {/* Totals Summary */}
                            {items.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <div className="w-64 space-y-2 text-sm">
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>Taxable Value:</span>
                                            <span>{formatINR(summary.totalTaxable)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>Total GST:</span>
                                            <span>{formatINR(summary.totalGST)}</span>
                                        </div>
                                        <div className="flex justify-between text-blue-600 dark:text-blue-400 font-bold text-lg pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span>Grand Total:</span>
                                            <span>{formatINR(summary.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Breakdown (Inline) */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded text-green-600 dark:text-green-400">
                                    <div className="w-3 h-3 rounded-full border-2 border-current" />
                                </div>
                                Payment Breakdown
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cash</label>
                                    <input
                                        type="number"
                                        value={payment.cash || ''}
                                        onChange={(e) => setPayment({ ...payment, cash: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">UPI (GPay/PhonePe)</label>
                                    <input
                                        type="number"
                                        value={payment.upi || ''}
                                        onChange={(e) => setPayment({ ...payment, upi: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Card</label>
                                    <input
                                        type="number"
                                        value={payment.card || ''}
                                        onChange={(e) => setPayment({ ...payment, card: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bank Transfer</label>
                                    <input
                                        type="number"
                                        value={payment.bank || ''}
                                        onChange={(e) => setPayment({ ...payment, bank: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="space-y-1 mb-4 md:mb-0">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Paid: <span className="font-semibold text-green-600 dark:text-green-400">{formatINR(totalPaid)}</span>
                                    </div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        Balance Due (Udhaar):
                                        <span className={`text-xl ${balanceDue > 0 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {formatINR(balanceDue > 0 ? balanceDue : 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                                        {isFullyPaid ? (
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">Paid</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full flex items-center gap-1">
                                                Credit / Udhaar
                                                <span className="font-normal opacity-75 text-[10px]">(Added to customer ledger)</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all flex items-center gap-2"
                                    >
                                        {loading ? 'Saving...' : 'Save TAX INVOICE'}
                                        {!loading && <Save className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT PREVIEW PANEL (3 cols) */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <Printer className="w-4 h-4" />
                                Live Invoice Preview
                            </h3>

                            {/* Invoice Preview Card */}
                            <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 text-xs text-gray-900">
                                {/* Header - Simplified Design */}
                                {/* Header - Modern Clean Design */}
                                {false ? (
                                    <div className="w-full">
                                        <img
                                            src={settings.letterhead?.startsWith?.('http') ? settings.letterhead : `http://localhost:5000${settings.letterhead}`}
                                            alt="Letterhead"
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            {/* Left: Branding */}
                                            <div className="flex items-center gap-3">
                                                {settings?.logo && (
                                                    <img
                                                        src={settings.logo?.startsWith?.('http') ? settings.logo : `http://localhost:5000${settings.logo}`}
                                                        className="h-10 w-auto object-contain"
                                                        alt="Logo"
                                                    />
                                                )}
                                                <div>
                                                    <h1 className="text-sm font-bold uppercase tracking-wider text-gray-800 leading-tight">
                                                        {sellerDetails.storeName || ''}
                                                    </h1>
                                                    <p className="text-[9px] text-gray-500 tracking-[0.2em]">
                                                        {sellerDetails.tagline || ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Contact & Invoice Meta */}
                                            <div className="text-right">
                                                <div className="mb-2">
                                                    <div className="font-bold text-[10px] uppercase tracking-wide text-gray-900">{invoiceSettings.title}</div>
                                                    <div className="text-[9px] text-gray-500">{invoiceSettings.invoiceNo}</div>
                                                    <div className="text-[9px] text-gray-500">{invoiceSettings.date}</div>
                                                </div>

                                                <div className="text-[9px] text-gray-600 space-y-0.5 font-medium">
                                                    {sellerDetails.address ? (
                                                        <>
                                                            <p>{sellerDetails.address.split(',')[0]}</p>
                                                            <p>{sellerDetails.address.split(',')[1]}</p>
                                                        </>
                                                    ) : null}
                                                    {sellerDetails.phone && (
                                                        <div className="flex items-center justify-end gap-1.5 mt-1">
                                                            <span>{sellerDetails.phone}</span>
                                                            <span className="text-[8px]" style={{ color: settings?.brandColor || '#EF4444' }}>📞</span>
                                                        </div>
                                                    )}
                                                    {sellerDetails.email && (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <span>{sellerDetails.email}</span>
                                                            <span className="text-[8px]" style={{ color: settings?.brandColor || '#EF4444' }}>✉️</span>
                                                        </div>
                                                    )}
                                                    {sellerDetails.website && (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <span>{sellerDetails.website}</span>
                                                            <span className="text-[8px]" style={{ color: settings?.brandColor || '#EF4444' }}>🌐</span>
                                                        </div>
                                                    )}
                                                    {sellerDetails.gstin && (
                                                        <div className="flex items-center justify-end gap-1.5 mt-1 font-semibold">
                                                            <span>GSTIN: {sellerDetails.gstin}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custom Divider Line */}
                                        <div className="flex items-center mt-2 mb-1">
                                            <div className="h-1.5 rounded-l-full w-1/3" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                                            <div className="h-0.5 bg-gray-800 w-2/3 rounded-r-full"></div>
                                        </div>
                                    </div>
                                )}

                                {/* From/To Section */}
                                <div className="p-3 grid grid-cols-2 gap-3 border-b">
                                    <div>
                                        <div className="text-[8px] font-semibold text-gray-600 mb-0.5">From:</div>
                                        <p className="text-[10px] font-semibold text-gray-900">{sellerDetails.storeName || ''}</p>
                                        <p className="text-[9px] text-gray-700">{sellerDetails.address || ''}</p>
                                        <p className="text-[9px] text-gray-700">{sellerDetails.phone}</p>
                                    </div>
                                    <div>
                                        <div className="text-[8px] font-semibold text-gray-600 mb-0.5">To:</div>
                                        <p className="text-[10px] font-semibold text-gray-900">{customerInfo.name || ''}</p>
                                        <p className="text-[9px] text-gray-700">{customerInfo.phone || ''}</p>
                                        {customerInfo.email && <p className="text-[9px] text-gray-700">{customerInfo.email}</p>}
                                        {customerInfo.gstin && <p className="text-[9px] text-gray-700 font-semibold">GSTIN: {customerInfo.gstin}</p>}
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="p-4">
                                    <table className="w-full text-[9px]">
                                        <thead>
                                            <tr className="text-white" style={{ backgroundColor: settings?.brandColor || '#1e3a8a' }}>
                                                <th className="py-1.5 px-2 text-left w-10">#</th>
                                                <th className="py-1.5 px-2 text-left">Item</th>
                                                <th className="py-1.5 px-2 text-center w-16">Qty</th>
                                                <th className="py-1.5 px-2 text-right w-24">Rate</th>
                                                <th className="py-1.5 px-2 text-center w-20">GST %</th>
                                                <th className="py-1.5 px-2 text-right w-24">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-4 text-center text-gray-400 text-[10px]">
                                                        No items added
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                                                        <td className="py-2 px-2 text-gray-500 align-top">{index + 1}</td>
                                                        <td className="py-2 px-2 align-top">
                                                            <div className="font-medium text-gray-900">{item.name}</div>
                                                            {/* Render IMEI/Serial in Preview */}
                                                            {(item.imei || item.imei2 || item.serialNumber) && (
                                                                <div className="text-[7px] text-gray-500 mt-0.5 space-y-0.5">
                                                                    {item.imei && <span>IMEI 1: {item.imei} </span>}
                                                                    {item.imei2 && <span>IMEI 2: {item.imei2} </span>}
                                                                    {item.serialNumber && <span>SN: {item.serialNumber}</span>}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-2 text-center align-top">{item.quantity}</td>
                                                        <td className="py-2 px-2 text-right align-top">{formatINR(item.pricePerUnit)}</td>
                                                        <td className="py-2 px-2 text-center text-gray-500 align-top">
                                                            {item.gstPercent > 0 ? `${item.gstPercent}%` : '-'}
                                                        </td>
                                                        <td className="py-2 px-2 text-right align-top">{formatINR(item.totalAmount)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Totals Section - Right Aligned */}
                                <div className="p-3 flex justify-end border-t">
                                    <div className="w-48 space-y-0.5">
                                        <div className="flex justify-between text-[9px]">
                                            <span>Subtotal:</span>
                                            <span>{formatINR(summary.totalTaxable)}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px]">
                                            <span>Total GST:</span>
                                            <span>{formatINR(summary.totalGST)}</span>
                                        </div>
                                        {/* GRAND TOTAL with Blue Badge */}
                                        <div className="flex justify-between font-bold text-white p-1.5 rounded mt-1 text-[10px]"
                                            style={{ backgroundColor: settings?.brandColor || '#1e3a8a' }}>
                                            <span className="uppercase">GRAND TOTAL:</span>
                                            <span>{formatINR(summary.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Section - Footer */}
                                <div className="p-3 border-t">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Left: QR Code, Notes, Bank Details */}
                                        <div className="space-y-2">
                                            {/* QR Code */}
                                            {sellerDetails.upiId && (
                                                <div>
                                                    <QRCodeSVG
                                                        value={`upi://pay?pa=${sellerDetails.upiId}&pn=${encodeURIComponent(sellerDetails.storeName || 'Store')}`}
                                                        size={60}
                                                        level="M"
                                                        includeMargin={false}
                                                    />
                                                    <div className="text-[7px] text-gray-500 mt-0.5">
                                                        {settings?.digitalSignature ? 'Scan to Pay' : 'ghfghfghfghf'}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            <div className="text-[8px] text-gray-600 whitespace-pre-line">
                                                {sellerDetails.termsAndConditions || '• Goods once sold will not be taken back\n• Payment due within 30 days'}
                                            </div>
                                            {sellerDetails.invoiceFooterText && (
                                                <div
                                                    className={`mt-1 ${sellerDetails.footerFontFamily === 'handwritten' ? 'font-handwritten' : 'font-medium italic'} ${sellerDetails.footerAlignment === 'center' ? 'text-center' : sellerDetails.footerAlignment === 'right' ? 'text-right' : 'text-left'} text-gray-500`}
                                                    style={{ fontSize: `${sellerDetails.footerFontSize * 0.7}px` }}
                                                >
                                                    {sellerDetails.invoiceFooterText}
                                                </div>
                                            )}

                                            {/* Bank Details */}
                                            {sellerDetails.bankDetails && (
                                                <div className="mt-2 whitespace-pre-line">
                                                    <div className="font-semibold text-[8px] mb-0.5 text-gray-700">Bank Details:</div>
                                                    <div className="text-[7px] text-gray-700">
                                                        {sellerDetails.bankDetails}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Authorized Sign */}
                                        <div className="flex flex-col items-end justify-end">
                                            {settings?.digitalSignature ? (
                                                <img
                                                    src={settings.digitalSignature?.startsWith?.('http') ? settings.digitalSignature : `http://localhost:5000${settings.digitalSignature}`}
                                                    alt="Signature"
                                                    className="w-24 h-12 object-contain mb-1"
                                                />
                                            ) : (
                                                <div className="w-20 h-10 flex items-center justify-center border border-dashed border-gray-300 rounded mb-1 bg-gray-50 opacity-50">
                                                    <span className="font-serif italic text-[10px] text-gray-400">Signed</span>
                                                </div>
                                            )}
                                            <div className="text-[8px] font-medium text-gray-800">{sellerDetails.authSignLabel}</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative Footer Bar */}
                                <div className="flex h-8 border-t border-white">
                                    <div className="w-1/4 h-full" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                                    <div className="w-1/4 h-full opacity-80" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                                    <div className="w-1/4 h-full opacity-60" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                                    <div className="w-1/4 h-full opacity-40" style={{ backgroundColor: settings?.brandColor || '#EF4444' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    );
};

const InvoiceCreatorWithErrorBoundary = () => (
    <ErrorBoundary>
        <InvoiceCreator />
    </ErrorBoundary>
);

export default InvoiceCreatorWithErrorBoundary;
