import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Layout from '../components/Layout/Layout';
import api, { BACKEND_URL } from '../utils/api';
import {
    Store, CreditCard, FileText, Smartphone,
    Save, Upload, Info, X, Image, Layout as LayoutIcon, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import SettingsInvoicePreview from '../components/Settings/SettingsInvoicePreview';
import LiquidBackground from '../components/UI/LiquidBackground';

const Settings = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { settings: currentSettings, refreshSettings, updateSettings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [staffList, setStaffList] = useState([]);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', username: '', password: '' });
    const [previewScale, setPreviewScale] = useState(0.55); // Default scale for A4 preview

    const [formData, setFormData] = useState({
        shopName: '',
        tagline: '',
        address: '',
        phone: '',
        email: '',
        gstNumber: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        bankBranch: '',
        upiId: '',
        termsAndConditions: '',
        brandColor: '#2563EB',
        primaryTextColor: '#2563EB',
        themeColor: '#2563EB',
        loginCardTextColor: '#FFFFFF',
        roleBadge: 'ADMIN',
        footerFontSize: 12,
        footerFontFamily: 'sans-serif',
        footerAlignment: 'center',
        invoiceFooterText: '',
        invoiceTemplate: {
            templateId: 'modern',
            fieldVisibility: {
                shippingAddress: false,
                taxBreakdown: true,
                signature: true,
                footer: true,
                bankDetails: true,
                qrCode: true,
                terms: true
            },
            fieldOrder: ['header', 'billTo', 'items', 'payment', 'signature', 'footer']
        }
    });

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/dashboard');
            toast.error('Access denied. Admin only.');
            return;
        }
        if (currentSettings) {
            setFormData({
                shopName: currentSettings.shopName || '',
                tagline: currentSettings.tagline || '',
                address: currentSettings.address || '',
                phone: currentSettings.phone || '',
                email: currentSettings.email || '',
                gstNumber: currentSettings.gstNumber || '',
                bankName: currentSettings.bankName || '',
                accountNumber: currentSettings.accountNumber || '',
                ifscCode: currentSettings.ifscCode || '',
                bankBranch: currentSettings.bankBranch || '',
                upiId: currentSettings.upiId || '',
                termsAndConditions: currentSettings.termsAndConditions || '',
                brandColor: currentSettings.brandColor || '#2563EB',
                primaryTextColor: currentSettings.primaryTextColor || '#2563EB',
                themeColor: currentSettings.themeColor || '#2563EB',
                loginCardTextColor: currentSettings.loginCardTextColor || '#FFFFFF',
                roleBadge: currentSettings.roleBadge || 'ADMIN',
                footerFontSize: currentSettings.footerFontSize || 12,
                footerFontFamily: currentSettings.footerFontFamily || 'sans-serif',
                footerAlignment: currentSettings.footerAlignment || 'center',
                invoiceFooterText: currentSettings.invoiceFooterText || '',
                invoiceTemplate: currentSettings.invoiceTemplate || {
                    templateId: 'modern',
                    fieldVisibility: {
                        shippingAddress: false,
                        taxBreakdown: true,
                        signature: true,
                        footer: true,
                        bankDetails: true,
                        qrCode: true,
                        qrText: true,
                        terms: true
                    },
                    fieldOrder: ['header', 'billTo', 'items', 'payment', 'signature', 'footer']
                }
            });
        }
    }, [currentSettings]);

    // Fetch Staff when tab is active
    useEffect(() => {
        if (activeTab === 'team') {
            fetchStaff();
        }
    }, [activeTab]);

    const fetchStaff = async () => {
        try {
            const { data } = await api.get('/auth/staff');
            setStaffList(data);
        } catch (error) {
            toast.error('Failed to load staff');
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/staff', newStaff);
            toast.success('Staff created successfully');
            setNewStaff({ name: '', email: '', username: '', password: '' });
            fetchStaff();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create staff');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updateSettings(formData);
            if (result.success) {
                toast.success('Settings updated successfully');
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append(field, file);

        try {
            await api.put('/settings', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(`${field} uploaded successfully`);
            refreshSettings();
        } catch (error) {
            toast.error(`Failed to upload ${field}`);
        }
    };

    const handleRemoveFile = async (field, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!window.confirm('Are you sure you want to remove this image?')) return;

        try {
            // Update via Context (handles API and Context State)
            const result = await updateSettings({ [field]: null });

            if (result.success) {
                toast.success('Image removed successfully');
                // Update local form state immediately to reflect change in UI
                setFormData(prev => ({ ...prev, [field]: null }));
            } else {
                toast.error(result.error || 'Failed to remove image');
            }
        } catch (error) {
            console.error('Error removing image:', error);
            toast.error('Failed to remove image');
        }
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Store },
        { id: 'banking', name: 'Banking & QR', icon: CreditCard },
        { id: 'invoice', name: 'Invoice Design', icon: FileText },
        { id: 'appearance', name: 'App Appearance', icon: Smartphone },
        { id: 'letterheadTemplate', name: 'Letterhead Design', icon: LayoutIcon },
        { id: 'team', name: 'Team Management', icon: Users },
    ];

    const colorPresets = [
        '#2563EB', '#10B981', '#EF4444', '#8B5CF6',
        '#F59E0B', '#06B6D4', '#F97316', '#EC4899'
    ];

    const darkColorPresets = [
        '#1F2937', '#374151', '#4B5563', '#6B7280',
        '#1E40AF', '#047857', '#B91C1C', '#5B21B6'
    ];

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen relative z-0 bg-white dark:bg-gray-900">
                {/* <LiquidBackground /> Removed for white background preference */}
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-slate-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-slate-500/10 rounded-lg">
                                    <Store className="w-5 h-5 text-slate-500" />
                                </div>
                                <span className="text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-[0.3em]">System Core</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                Workspace <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-gray-500">Control</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Define your business identity and orchestrate operational parameters.
                            </p>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`flex items-center space-x-2 px-8 py-4 ${loading ? 'bg-gray-400' : 'bg-slate-800 dark:bg-slate-700'} hover:bg-slate-900 text-white rounded-2xl shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group`}
                        >
                            <Save className={`${loading ? 'animate-pulse' : 'group-hover:scale-110'} w-6 h-6 transition-transform`} />
                            <span className="font-black tracking-tight text-lg">{loading ? 'Syncing...' : 'Save All Changes'}</span>
                        </button>
                    </div>
                </div>

                {/* Intelligence Navigation */}
                <div className="mb-8 relative z-10">
                    <div className="bg-white/80 dark:bg-white/2 backdrop-blur-2xl p-2 rounded-[28px] border border-white dark:border-white/5 shadow-2xl shadow-slate-500/5">
                        <nav className="flex space-x-1 px-2 overflow-x-auto scrollbar-hide no-scrollbar" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-3 py-4 px-6 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-y-0 opacity-100'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-slate-500/10 hover:text-slate-900 dark:hover:text-white opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                                        <span>{tab.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    {/* Left Side - Forms - Adjusted for wider invoice tab */}
                    <div className={activeTab === 'letterheadTemplate' ? "lg:col-span-3" : "lg:col-span-2"}>
                        <form onSubmit={handleSubmit}>
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white dark:border-white/5 shadow-2xl">
                                {/* General Tab */}
                                {activeTab === 'general' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Store Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.shopName}
                                                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tagline (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.tagline}
                                                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                                className="w-full px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                placeholder="e.g., Best Deals in Tech"
                                            />
                                        </div>

                                        {/* Logo Upload Section */}
                                        <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                                Shop Logo
                                            </label>
                                            <div className="flex items-center space-x-4">
                                                <div className="h-24 w-24 bg-white dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden relative group">
                                                    {currentSettings?.logo ? (
                                                        <>
                                                            <img
                                                                src={currentSettings.logo.startsWith('http') ? currentSettings.logo : `${BACKEND_URL}${currentSettings.logo}`}
                                                                alt="Logo"
                                                                className="h-full w-full object-contain p-2"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleRemoveFile('logo', e)}
                                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                                                            >
                                                                Remove
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs text-center p-2">No Logo</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="cursor-pointer bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition shadow-lg flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, 'logo')}
                                                        />
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                        Upload Logo
                                                    </label>
                                                    <p className="text-[10px] text-gray-500 mt-2 max-w-[200px]">
                                                        Recommended: PNG/JPG, square format, max 500KB.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Address
                                            </label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                rows={3}
                                                placeholder="Shop No. 12, Ground Floor&#10;Tech Plaza, MG Road&#10;Indore - 452001, MP"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Mobile Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                    placeholder="contact@yourbusiness.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    GSTIN (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.gstNumber}
                                                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                                    className="w-full px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                    placeholder="e.g., 22AAAAA0000A1Z5"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Website (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.website || ''}
                                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                    className="w-full px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                    placeholder="www.yourbusiness.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Banking & QR Tab */}
                                {activeTab === 'banking' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Bank Details (Multi-line)
                                            </label>
                                            <textarea
                                                defaultValue={`Bank Name: ${formData.bankName}\nAccount No.: ${formData.accountNumber}\nIFSC Code: ${formData.ifscCode}\nBranch: ${formData.bankBranch}`}
                                                onBlur={(e) => {
                                                    const lines = e.target.value.split('\n');
                                                    setFormData({
                                                        ...formData,
                                                        bankName: lines[0]?.replace(/^Bank Name:\s*/, '').trim() || '',
                                                        accountNumber: lines[1]?.replace(/^Account No\.?:\s*/, '').trim() || '',
                                                        ifscCode: lines[2]?.replace(/^IFSC Code:\s*/, '').trim() || '',
                                                        bankBranch: lines[3]?.replace(/^Branch:\s*/, '').trim() || ''
                                                    });
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                rows={4}
                                                placeholder="Bank Name: HDFC Bank&#10;Account No.: 1234567890&#10;IFSC Code: HDFC0001234&#10;Branch: MG Road, Indore"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                This will appear at the bottom of your invoices. Edit freely and click outside to save changes.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                UPI ID (for QR Code)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.upiId}
                                                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                placeholder="yourstore@okicici"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                QR code will be automatically generated on invoices
                                            </p>
                                        </div>

                                        {/* QR Code Preview */}
                                        {formData.upiId && (
                                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                    UPI QR Code Preview
                                                </label>
                                                <div className="flex items-start space-x-4">
                                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                                        <QRCodeSVG
                                                            value={`upi://pay?pa=${formData.upiId}&pn=${encodeURIComponent(formData.shopName || 'Store')}`}
                                                            size={128}
                                                            level="M"
                                                            includeMargin={true}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">
                                                            Scan to Pay: {formData.shopName || 'Your Store'}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                            UPI ID: <span className="font-mono">{formData.upiId}</span>
                                                        </p>
                                                        <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                                                            ✓ This QR code will appear on all invoices
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Invoice Design Tab */}
                                {activeTab === 'invoice' && (
                                    <div className="space-y-6">
                                        {/* Template Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Choose Template
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['modern', 'classic', 'minimal', 'custom'].map((tpl) => (
                                                    <button
                                                        key={tpl}
                                                        type="button"
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            invoiceTemplate: { ...formData.invoiceTemplate, templateId: tpl }
                                                        })}
                                                        className={`p-3 rounded-xl border-2 text-left transition-all ${formData.invoiceTemplate?.templateId === tpl
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                                            }`}
                                                    >
                                                        <div className="font-bold text-sm capitalize text-gray-900 dark:text-white mb-1">{tpl}</div>
                                                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                            {tpl === 'modern' && 'Clean, colorful, detailed'}
                                                            {tpl === 'classic' && 'Serif fonts, traditional'}
                                                            {tpl === 'minimal' && 'Monospace, ink-saver'}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>


                                            {/* Custom Template Editor */}
                                            {formData.invoiceTemplate?.templateId === 'custom' && (
                                                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                                                            Custom HTML Content
                                                        </label>
                                                        <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                            Upload HTML File
                                                            <input
                                                                type="file"
                                                                accept=".html,.txt"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            invoiceTemplate: {
                                                                                ...formData.invoiceTemplate,
                                                                                customTemplateContent: event.target.result
                                                                            }
                                                                        });
                                                                        toast.success('Template loaded from file');
                                                                    };
                                                                    reader.readAsText(file);
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                                        Enter your HTML code. Use placeholders: <code className="bg-white px-1 rounded border">{'{{shopName}}'}</code>,
                                                        <code className="bg-white px-1 rounded border">{'{{invoiceNo}}'}</code>,
                                                        <code className="bg-white px-1 rounded border">{'{{itemsRows}}'}</code>, etc.
                                                    </p>
                                                    <textarea
                                                        value={formData.invoiceTemplate?.customTemplateContent || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            invoiceTemplate: {
                                                                ...formData.invoiceTemplate,
                                                                customTemplateContent: e.target.value
                                                            }
                                                        })}
                                                        rows={12}
                                                        className="w-full font-mono text-xs border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                                        placeholder="<html><body><h1>{{shopName}}</h1>...</body></html>"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4"></div>

                                        {/* Field Visibility Toggles */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Section Visibility
                                            </label>
                                            <div className="space-y-2">
                                                {[
                                                    { key: 'taxBreakdown', label: 'Show Tax Breakdown Table' },
                                                    { key: 'terms', label: 'Show Terms & Conditions' },
                                                    { key: 'footer', label: 'Show Footer Note' },
                                                    { key: 'bankDetails', label: 'Show Bank Details' },
                                                    { key: 'qrCode', label: 'Show UPI QR Code' },
                                                    { key: 'qrText', label: 'Show QR Code Text' },
                                                    { key: 'signature', label: 'Show Authorized Signatory' },
                                                ].map((field) => (
                                                    <label key={field.key} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.invoiceTemplate?.fieldVisibility?.[field.key] ?? true}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                invoiceTemplate: {
                                                                    ...formData.invoiceTemplate,
                                                                    fieldVisibility: {
                                                                        ...formData.invoiceTemplate.fieldVisibility,
                                                                        [field.key]: e.target.checked
                                                                    }
                                                                }
                                                            })}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Digital Signature Upload (Conditional) */}
                                        {formData.invoiceTemplate?.fieldVisibility?.signature && (
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-fadeIn">
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                                    Authorized Signatory Image
                                                </label>
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-20 w-40 bg-white dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden relative group">
                                                        {currentSettings?.digitalSignature ? (
                                                            <>
                                                                <img
                                                                    src={currentSettings.digitalSignature.startsWith('http') ? currentSettings.digitalSignature : `${BACKEND_URL}${currentSettings.digitalSignature}`}
                                                                    alt="Signature"
                                                                    className="h-full w-full object-contain p-2"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleRemoveFile('digitalSignature', e)}
                                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs text-center p-2">No Signature Uploaded</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="cursor-pointer bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition shadow-lg flex items-center gap-2">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, 'digitalSignature')}
                                                            />
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                            Upload Image
                                                        </label>
                                                        <p className="text-[10px] text-gray-500 mt-2 max-w-[200px]">
                                                            Recommended: Transparent PNG, approx 200x100px.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4"></div>

                                        {/* Existing Brand Color & Fonts (Reused) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Brand Color
                                            </label>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <input
                                                    type="color"
                                                    value={formData.brandColor}
                                                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                                                    className="w-10 h-10 rounded cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 hidden">{formData.brandColor}</span>
                                                <input
                                                    type="text"
                                                    value={formData.brandColor}
                                                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="#000000"
                                                />
                                            </div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
                                                Primary Text Color
                                            </label>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <input
                                                    type="color"
                                                    value={formData.primaryTextColor || '#1F2937'}
                                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                                    className="w-10 h-10 rounded cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 hidden">{formData.primaryTextColor}</span>
                                                <input
                                                    type="text"
                                                    value={formData.primaryTextColor || '#1F2937'}
                                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Footer Note
                                                </label>
                                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    Size: {formData.footerFontSize}px
                                                </span>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <input
                                                    type="text"
                                                    value={formData.invoiceFooterText || ''}
                                                    onChange={(e) => setFormData({ ...formData, invoiceFooterText: e.target.value })}
                                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Thank you for your business!"
                                                />
                                                <input
                                                    type="range"
                                                    min="8"
                                                    max="24"
                                                    step="1"
                                                    value={formData.footerFontSize || 12}
                                                    onChange={(e) => setFormData({ ...formData, footerFontSize: parseInt(e.target.value) })}
                                                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                )}


                                {/* App Appearance Tab */}
                                {activeTab === 'appearance' && (
                                    <div className="space-y-6">
                                        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 dark:border-purple-500 p-4 rounded-lg">
                                            <p className="text-sm text-purple-800 dark:text-purple-300">
                                                <strong>Customize App Theme</strong>
                                                <br />
                                                Personalize the look and feel of your application
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Primary Theme Color
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    value={formData.themeColor}
                                                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                                                    className="w-16 h-10 rounded cursor-pointer bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.themeColor}
                                                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Changes buttons, links, sidebar active state, and login button
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 w-full">Quick picks:</p>
                                                {colorPresets.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, themeColor: color })}
                                                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 transition"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>





                                        <hr />

                                        <div>
                                            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3">User Profile Customization</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Personalize your profile picture and role badge</p>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Profile Picture (Avatar)
                                                    </label>
                                                    <div className="flex items-center space-x-4">
                                                        {currentSettings?.profilePicture ? (
                                                            <img
                                                                src={currentSettings.profilePicture.startsWith('http') ? currentSettings.profilePicture : `${BACKEND_URL}${currentSettings.profilePicture}`}
                                                                alt="Profile"
                                                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-md">
                                                                <span className="text-white text-2xl">👤</span>
                                                            </div>
                                                        )}
                                                        <label className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer transition-colors">
                                                            <Upload className="w-5 h-5" />
                                                            <span>Upload Picture</span>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => handleFileUpload(e, 'profilePicture')}
                                                                accept="image/*"
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        {currentSettings?.profilePicture && (
                                                            <button
                                                                onClick={(e) => handleRemoveFile('profilePicture', e)}
                                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                                                                title="Remove Picture"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        Upload a custom profile picture to replace the default icon in the sidebar. PNG, JPG, WEBP (max 1MB). Compressed & cropped to fit
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Role Title (Badge Text)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.roleBadge}
                                                        onChange={(e) => setFormData({ ...formData, roleBadge: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                        placeholder="ADMIN"
                                                    />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        Customize the text shown in your role badge (e.g., OWNER, BOSS, MANAGER, STAFF)
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 w-full">Quick picks:</p>
                                                        {['ADMIN', 'OWNER', 'BOSS', 'MANAGER', 'STAFF'].map((role) => (
                                                            <button
                                                                key={role}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, roleBadge: role })}
                                                                className="px-3 py-1 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                                                            >
                                                                {role}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>


                                            </div>
                                        </div>
                                    </div>
                                )}



                                {/* Team Management Tab */}
                                {activeTab === 'team' && (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded-lg">
                                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                                <strong>Team Management</strong>
                                                <br />
                                                Invite staff members to help manage your store. They can view and create invoices/products but cannot change these settings.
                                            </p>
                                        </div>

                                        {/* Add Staff Form */}
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">Add New Staff Member</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Full Name"
                                                    value={newStaff.name}
                                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email Address"
                                                    value={newStaff.email}
                                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Username"
                                                    value={newStaff.username}
                                                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="Password"
                                                    value={newStaff.password}
                                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleCreateStaff}
                                                    disabled={!newStaff.name || !newStaff.email || !newStaff.username || !newStaff.password}
                                                    className="px-8 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
                                                >
                                                    Incorporate Member
                                                </button>
                                            </div>
                                        </div>

                                        {/* Staff List */}
                                        <div>
                                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">Existing Team Members</h3>
                                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                        {staffList.length > 0 ? (
                                                            staffList.map((staff) => (
                                                                <tr key={staff._id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                        {staff.name}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                        {staff.email}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                            {staff.role}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                        {new Date(staff.createdAt).toLocaleDateString()}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                    No staff members found. Invite someone above!
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'letterheadTemplate' && (
                                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
                                        <div className="xl:col-span-3 space-y-6">
                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Custom Letterhead Background</h3>
                                                <p className="text-sm text-gray-500 mb-4">Upload a pre-designed A4 background image (PNG/JPG). This will replace the default header/footer with your full-page design.</p>

                                                <div className="flex items-center space-x-4">
                                                    {currentSettings?.letterhead ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={currentSettings.letterhead.startsWith('http') ? currentSettings.letterhead : `${BACKEND_URL}${currentSettings.letterhead}`}
                                                                alt="Letterhead"
                                                                className="w-24 h-32 object-cover border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-md"
                                                            />
                                                            <button
                                                                onClick={(e) => handleRemoveFile('letterhead', e)}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                                title="Remove Letterhead"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-24 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700/50">
                                                            <span className="text-xs text-gray-400 text-center px-1">No Image</span>
                                                        </div>
                                                    )}

                                                    <div className="flex-1">
                                                        <label className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-blue-500/30 rounded-xl bg-blue-50/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group">
                                                            <Upload className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Upload A4 Image</span>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => handleFileUpload(e, 'letterhead')}
                                                                accept="image/*"
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                                                            Recommended: 210mm x 297mm (2480x3508 px for high quality).
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">A4 Page Layout (Global Template)</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {['Top', 'Bottom', 'Left', 'Right'].map(side => (
                                                        <div key={side}>
                                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Margin {side} (mm)</label>
                                                            <input
                                                                type="range" min="0" max="50" step="1"
                                                                value={formData.letterheadConfig?.[`margin${side}`] || 20}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    letterheadConfig: { ...formData.letterheadConfig, [`margin${side}`]: parseInt(e.target.value) }
                                                                })}
                                                                className="w-full mt-1 accent-blue-600"
                                                            />
                                                            <div className="text-right text-xs text-blue-600 dark:text-blue-400 font-mono">{formData.letterheadConfig?.[`margin${side}`] || 20}mm</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Branding & Watermark</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo Position</label>
                                                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                                            {['left', 'center', 'right'].map(pos => (
                                                                <button
                                                                    key={pos}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, letterheadConfig: { ...formData.letterheadConfig, logoPosition: pos } })}
                                                                    className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-all ${(formData.letterheadConfig?.logoPosition || 'left') === pos
                                                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm'
                                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                                                        }`}
                                                                >
                                                                    {pos}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Watermark Text</label>
                                                        <input
                                                            type="text"
                                                            value={formData.letterheadConfig?.watermarkText || ''}
                                                            onChange={(e) => {
                                                                const newText = e.target.value;
                                                                // Reset opacity and size when watermark text is cleared
                                                                if (newText === '') {
                                                                    setFormData({
                                                                        ...formData,
                                                                        letterheadConfig: {
                                                                            ...formData.letterheadConfig,
                                                                            watermarkText: '',
                                                                            watermarkOpacity: 0.1,
                                                                            watermarkSize: 100
                                                                        }
                                                                    });
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        letterheadConfig: {
                                                                            ...formData.letterheadConfig,
                                                                            watermarkText: newText
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                            placeholder="e.g. OFFICIAL / DRAFT"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opacity</label>
                                                            <input
                                                                type="range" min="0" max="1" step="0.05"
                                                                value={formData.letterheadConfig?.watermarkOpacity || 0.1}
                                                                onChange={(e) => setFormData({ ...formData, letterheadConfig: { ...formData.letterheadConfig, watermarkOpacity: parseFloat(e.target.value) } })}
                                                                className="w-full accent-blue-600"
                                                            />
                                                            <div className="text-right text-xs text-gray-500 dark:text-gray-400">{Math.round((formData.letterheadConfig?.watermarkOpacity || 0.1) * 100)}%</div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
                                                            <input
                                                                type="range" min="40" max="250" step="10"
                                                                value={formData.letterheadConfig?.watermarkSize || 100}
                                                                onChange={(e) => setFormData({ ...formData, letterheadConfig: { ...formData.letterheadConfig, watermarkSize: parseInt(e.target.value) } })}
                                                                className="w-full accent-blue-600"
                                                            />
                                                            <div className="text-right text-xs text-gray-500 dark:text-gray-400">{formData.letterheadConfig?.watermarkSize || 100}px</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="xl:col-span-9">
                                            <div className="sticky top-6">
                                                <div className="flex items-center justify-between mb-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-xl bg-opacity-80">
                                                    <div className="flex items-center space-x-2">
                                                        <LayoutIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live A4 Preview</h3>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="hidden md:flex items-center space-x-2">
                                                            <span className="text-[10px] uppercase font-bold text-gray-500">Zoom</span>
                                                            <input
                                                                type="range"
                                                                min="0.3"
                                                                max="1.0"
                                                                step="0.05"
                                                                value={previewScale}
                                                                onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                                                                className="w-24 accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-mono font-bold">A4</span>
                                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono w-12 text-center">{Math.round(previewScale * 100)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-200/50 dark:bg-black/40 p-4 rounded-xl overflow-hidden flex justify-center items-start min-h-[600px] border-2 border-dashed border-gray-300 dark:border-gray-700 relative">
                                                    {/* Background Grid Pattern */}
                                                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                                                        style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                                    </div>

                                                    <div
                                                        className="bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative transition-all duration-300 ease-out origin-top border-t border-gray-100"
                                                        style={{
                                                            width: '210mm',
                                                            minHeight: '297mm',
                                                            transform: `scale(${previewScale})`,
                                                            marginBottom: `-${(1 - previewScale) * 297}mm`, // Compensate for scale white space
                                                            border: formData.letterheadConfig?.showBorder ? `2px solid ${formData.letterheadConfig?.borderColor}` : 'none',
                                                        }}
                                                    >
                                                        {currentSettings?.letterhead && (
                                                            <div className="absolute inset-0 z-0 overflow-hidden">
                                                                <img
                                                                    src={currentSettings.letterhead.startsWith('http') ? currentSettings.letterhead : `${BACKEND_URL}${currentSettings.letterhead}`}
                                                                    alt="Letterhead Background"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}

                                                        {formData.letterheadConfig?.watermarkText && (
                                                            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
                                                                <div
                                                                    className="font-bold text-gray-900 transform -rotate-45 whitespace-nowrap select-none"
                                                                    style={{
                                                                        opacity: formData.letterheadConfig?.watermarkOpacity || 0.1,
                                                                        fontSize: `${formData.letterheadConfig?.watermarkSize || 100}px`
                                                                    }}
                                                                >
                                                                    {formData.letterheadConfig.watermarkText}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative z-10 flex flex-col h-full"
                                                            style={{
                                                                paddingTop: `${formData.letterheadConfig?.marginTop || 20}mm`,
                                                                paddingBottom: `${formData.letterheadConfig?.marginBottom || 20}mm`,
                                                                paddingLeft: `${formData.letterheadConfig?.marginLeft || 20}mm`,
                                                                paddingRight: `${formData.letterheadConfig?.marginRight || 20}mm`,
                                                            }}
                                                        >
                                                            {/* Liceria Header */}
                                                            <div className="flex justify-between items-start mb-4">
                                                                {/* Branding (Left) */}
                                                                <div className="flex flex-col items-start" style={{
                                                                    width: formData.letterheadConfig?.logoPosition === 'center' ? '100%' : 'auto',
                                                                    alignItems: formData.letterheadConfig?.logoPosition === 'center' ? 'center' : (formData.letterheadConfig?.logoPosition === 'right' ? 'flex-end' : 'flex-start'),
                                                                    order: formData.letterheadConfig?.logoPosition === 'right' ? 2 : 1
                                                                }}>
                                                                    <div className={`flex ${formData.letterheadConfig?.logoPosition === 'center' ? 'flex-col text-center' : 'items-center'} gap-4 mb-2`}>
                                                                        {/* Logo Icon (Reused from Invoice Preview if no real logo) */}
                                                                        {currentSettings?.logo && (
                                                                            <img src={currentSettings.logo} className="h-16 w-auto object-contain" alt="Logo" />
                                                                        )}
                                                                        <div>
                                                                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none" style={{ color: formData.brandColor }}>{formData.shopName || 'SHOP NAME'}</h1>
                                                                            <p className="text-sm text-gray-500 font-medium tracking-[0.3em] mt-1">{formData.tagline || 'PREMIUM TAGLINE'}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Contact Info (Right) */}
                                                                {formData.letterheadConfig?.logoPosition !== 'center' && (
                                                                    <div className="text-right text-[10px] text-gray-600 leading-tight" style={{ order: formData.letterheadConfig?.logoPosition === 'right' ? 1 : 2 }}>
                                                                        <div className="font-semibold text-gray-900 text-sm mb-1">
                                                                            {formData.address ? (
                                                                                <>
                                                                                    <p>{formData.address.split('\n')[0]}</p>
                                                                                    <p>{formData.address.split('\n')[1]}</p>
                                                                                </>
                                                                            ) : <p>123 Business Road, Suite 400<br />Innovation City, ST 12345</p>}
                                                                        </div>
                                                                        <div className="space-y-0.5 opacity-80">
                                                                            {formData.phone ? (
                                                                                <p className="flex items-center justify-end gap-1.5">
                                                                                    {formData.phone} <span className="text-[9px] bg-slate-900 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center">P</span>
                                                                                </p>
                                                                            ) : <p>+91 98765 43210</p>}

                                                                            {formData.email ? (
                                                                                <p className="flex items-center justify-end gap-1.5">
                                                                                    {formData.email} <span className="text-[9px] bg-slate-900 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center">E</span>
                                                                                </p>
                                                                            ) : <p>contact@business.com</p>}

                                                                            {formData.website && (
                                                                                <p className="flex items-center justify-end gap-1.5">
                                                                                    {formData.website} <span className="text-[9px] bg-slate-900 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center">W</span>
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Graphical Separator - Red/Black Line */}
                                                            <div className="w-full flex h-1.5 mb-12">
                                                                <div className="w-1/3" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                                                <div className="flex-1 bg-gray-900"></div>
                                                            </div>

                                                            {/* Content Placeholder */}
                                                            <div className="space-y-6 flex-1 px-2">
                                                                <div className="flex justify-between items-end mb-10">
                                                                    <div className="space-y-1">
                                                                        <div className="h-2.5 bg-gray-200 rounded w-24"></div>
                                                                        <div className="h-3 bg-gray-800 rounded w-48"></div>
                                                                    </div>
                                                                    <div className="h-2.5 bg-gray-200 rounded w-24"></div>
                                                                </div>

                                                                <div className="pt-4 space-y-3">
                                                                    <div className="h-2 bg-gray-100 rounded w-full"></div>
                                                                    <div className="h-2 bg-gray-100 rounded w-full"></div>
                                                                    <div className="h-2 bg-gray-100 rounded w-11/12"></div>
                                                                    <div className="h-2 bg-gray-100 rounded w-full"></div>
                                                                </div>

                                                                <div className="pt-2 space-y-3">
                                                                    <div className="h-2 bg-gray-100 rounded w-10/12"></div>
                                                                    <div className="h-2 bg-gray-100 rounded w-full"></div>
                                                                    <div className="h-2 bg-gray-100 rounded w-9/12"></div>
                                                                </div>

                                                                <div className="pt-8">
                                                                    <div className="h-2 bg-gray-100 rounded w-1/4 mb-1"></div>
                                                                    <div className="h-2 bg-gray-100 rounded w-1/5"></div>
                                                                </div>
                                                            </div>

                                                            {/* Footer - 4 Color Blocks */}
                                                            <div className="absolute bottom-0 left-0 right-0 h-4 flex">
                                                                <div className="flex-1" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                                                <div className="flex-1" style={{ backgroundColor: formData.brandColor || '#EF4444', filter: 'brightness(0.9)' }}></div>
                                                                <div className="flex-1" style={{ backgroundColor: formData.brandColor || '#EF4444', filter: 'brightness(0.8)' }}></div>
                                                                <div className="flex-1" style={{ backgroundColor: formData.brandColor || '#EF4444', filter: 'brightness(0.7)' }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>
                        </form>
                    </div>

                    <div className={activeTab === 'letterheadTemplate' ? "hidden" : "lg:col-span-1"}>
                        {/* Dynamic Invoice Preview */}
                        {activeTab === 'invoice' && (
                            <div className="sticky top-6">
                                <div className="bg-gray-800 rounded-[28px] p-2 shadow-2xl border-4 border-gray-700 backdrop-blur-md">
                                    <div className="bg-gray-900 rounded-[24px] overflow-hidden aspect-[1/1.414] relative">
                                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                                            <SettingsInvoicePreview settings={currentSettings} formData={formData} />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Live Preview</p>
                                </div>
                            </div>
                        )}

                        {/* Placeholder or Info for other tabs */}
                        {activeTab !== 'invoice' && activeTab !== 'letterheadTemplate' && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sticky top-6 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center space-x-2 mb-2">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Workspace Settings</h3>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Configure your store details, branding, and billing preferences here.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </Layout >
    );
};

export default Settings;
