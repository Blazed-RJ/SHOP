
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Layout from '../components/Layout/Layout';
import api, { BACKEND_URL } from '../utils/api';
import {
    Store, FileText, Smartphone,
    Save, Upload, Info, X, Image, Layout as LayoutIcon, Users,
    User, MapPin, Phone, Mail, Globe, Palette, Type, ImageIcon, Briefcase, CreditCard, Shield, Check, Bell, Moon, Sun, Monitor, AlertTriangle,
    Plus, Code, Eye, Trash2, Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import SettingsInvoicePreview from '../components/Settings/SettingsInvoicePreview';
import { TEMPLATE_LIST } from '../components/Invoice/templateList';
import LiquidBackground from '../components/UI/LiquidBackground';
import ConfirmationModal from '../components/ConfirmationModal';

const Settings = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { settings: currentSettings, refreshSettings, updateSettings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [staffList, setStaffList] = useState([]);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', username: '', password: '' });
    const [previewScale, setPreviewScale] = useState(0.55); // Default scale for A4 preview
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState(null);

    // Custom HTML template editor state
    const [showHtmlEditor, setShowHtmlEditor] = useState(false);
    const [editingHtmlTemplate, setEditingHtmlTemplate] = useState(null);
    const [htmlEditorName, setHtmlEditorName] = useState('');
    const [htmlEditorCode, setHtmlEditorCode] = useState('');
    const [htmlPreviewMode, setHtmlPreviewMode] = useState(false);

    const openHtmlEditor = (template = null) => {
        if (template) {
            setEditingHtmlTemplate(template.id);
            setHtmlEditorName(template.name);
            setHtmlEditorCode(template.html);
        } else {
            setEditingHtmlTemplate(null);
            setHtmlEditorName('');
            setHtmlEditorCode('');
        }
        setHtmlPreviewMode(false);
        setShowHtmlEditor(true);
    };

    const saveHtmlTemplate = () => {
        if (!htmlEditorName.trim()) return toast.error('Please enter a template name');
        if (!htmlEditorCode.trim()) return toast.error('Please enter HTML code');
        setFormData(prev => {
            const templates = [...(prev.invoiceTemplate?.customHtmlTemplates || [])];
            if (editingHtmlTemplate) {
                const idx = templates.findIndex(t => t.id === editingHtmlTemplate);
                if (idx >= 0) templates[idx] = { ...templates[idx], name: htmlEditorName.trim(), html: htmlEditorCode };
            } else {
                templates.push({ id: `custom-${Date.now()}`, name: htmlEditorName.trim(), html: htmlEditorCode });
            }
            return { ...prev, invoiceTemplate: { ...prev.invoiceTemplate, customHtmlTemplates: templates } };
        });
        setShowHtmlEditor(false);
        toast.success(editingHtmlTemplate ? 'Template updated' : 'Template added');
    };

    const deleteHtmlTemplate = (id) => {
        setFormData(prev => {
            const templates = (prev.invoiceTemplate?.customHtmlTemplates || []).filter(t => t.id !== id);
            const newTemplateId = prev.invoiceTemplate?.templateId === id ? 'gradient' : prev.invoiceTemplate?.templateId;
            return { ...prev, invoiceTemplate: { ...prev.invoiceTemplate, customHtmlTemplates: templates, templateId: newTemplateId } };
        });
        toast.success('Template deleted');
    };

    const [formData, setFormData] = useState({
        shopName: '',
        tagline: '',
        address: '',
        phone: '',
        email: '',
        whatsappNumber: '',
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
        appFontFamily: 'Inter',
        sidebarStyle: 'solid',
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
                qrText: true,
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
                whatsappNumber: currentSettings.whatsappNumber || '',
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
                appFontFamily: currentSettings.appFontFamily || 'Inter',
                sidebarStyle: currentSettings.sidebarStyle || 'solid',
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
    }, [currentSettings, isAdmin, navigate, updateSettings]);

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
            console.error('Staff fetch error:', error);
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
            console.error('Settings update error:', error);
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
            // Nullifying the Content-Type allows the XHR browser engine to automatically build boundaries
            await api.put('/settings', formDataUpload, {
                headers: {
                    'Content-Type': undefined
                }
            });
            toast.success(`${field} uploaded successfully`);
            refreshSettings();
        } catch (error) {
            console.error(`Upload error for ${field}: `, error);
            toast.error(`Failed to upload ${field} `);
        }
    };

    const handleRemoveFile = useCallback((field, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setFieldToDelete(field);
        setShowDeleteModal(true);
    }, []);

    const confirmRemoveFile = async () => {
        if (!fieldToDelete) return;

        try {
            // Update via Context (handles API and Context State)
            const result = await updateSettings({ [fieldToDelete]: null });

            if (result.success) {
                toast.success('Image removed successfully');
                // Update local form state immediately to reflect change in UI
                setFormData(prev => ({ ...prev, [fieldToDelete]: null }));
            } else {
                toast.error(result.error || 'Failed to remove image');
            }
        } catch (error) {
            console.error('Error removing image:', error);
            toast.error('Failed to remove image');
        } finally {
            setFieldToDelete(null);
            setShowDeleteModal(false);
        }
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Store },
        { id: 'invoice', name: 'Invoice Design', icon: FileText },
        { id: 'appearance', name: 'App Appearance', icon: Smartphone },
        { id: 'letterheadTemplate', name: 'Letterhead Design', icon: LayoutIcon },
        { id: 'team', name: 'Team Management', icon: Users },
    ];

    const colorPresets = [
        '#2563EB', '#10B981', '#EF4444', '#8B5CF6',
        '#F59E0B', '#06B6D4', '#F97316', '#EC4899'
    ];



    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen relative z-0 bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <Store className="w-5 h-5 text-amber-500" />
                                </div>
                                <span className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-[0.3em]">System Core</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                Workspace <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">Control</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Define your business identity and orchestrate operational parameters.
                            </p>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`flex items-center space-x-2 px-8 py-4 ${loading ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-500'} text-white rounded-2xl shadow-[0_20px_40px_rgba(217,119,6,0.2)] hover:shadow-[0_25px_50px_rgba(217,119,6,0.3)] transition-all duration-300 transform hover:-translate-y-1 group`}
                        >
                            <Save className={`${loading ? 'animate-pulse' : 'group-hover:scale-110'} w-6 h-6 transition-transform`} />
                            <span className="font-black tracking-tight text-lg">{loading ? 'Syncing...' : 'Save All Changes'}</span>
                        </button>
                    </div>
                </div>

                {/* Intelligence Navigation */}
                <div className="mb-8 relative z-10">
                    <div className="bg-white/80 dark:bg-white/10 backdrop-blur-2xl p-2 rounded-[28px] border-[2.5px] border-amber-500/30 shadow-xl shadow-amber-900/5 transition-all duration-300">
                        <nav className="flex space-x-1 px-2 overflow-x-auto scrollbar-hide no-scrollbar" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-3 py-4 px-6 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 translate-y-0 opacity-100'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-amber-500/5 hover:text-amber-600 dark:hover:text-amber-200 opacity-70 hover:opacity-100'
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
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border-[2.5px] border-amber-500/30 shadow-2xl transition-all duration-300">
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
                                                                src={currentSettings.logo.startsWith('http') ? currentSettings.logo : `${BACKEND_URL}${currentSettings.logo} `}
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                WhatsApp Number (for Share Buttons)
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.whatsappNumber}
                                                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                                className="w-full px-5 py-3 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                placeholder="919876543210"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Format: Country code + number (no spaces, no +). When set, share buttons will open WhatsApp directly to this number. Example: 919876543210
                                            </p>
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

                                {/* Banking & QR Tab Removed - Moved to Catalog */}

                                {/* Invoice Design Tab */}
                                {activeTab === 'invoice' && (
                                    <div className="space-y-6">

                                        {/* Template Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Choose Template
                                            </label>
                                            {['Modern', 'Dark', 'Elegant', 'Classic'].map(category => {
                                                const templates = TEMPLATE_LIST.filter(t => t.category === category);
                                                if (templates.length === 0) return null;
                                                return (
                                                    <div key={category} className="mb-4">
                                                        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{category}</div>
                                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                            {templates.map(tpl => (
                                                                <button
                                                                    key={tpl.id}
                                                                    type="button"
                                                                    onClick={() => setFormData(prev => ({
                                                                        ...prev,
                                                                        invoiceTemplate: { ...prev.invoiceTemplate, templateId: tpl.id }
                                                                    }))}
                                                                    className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200 ${(formData.invoiceTemplate?.templateId || 'gradient') === tpl.id
                                                                        ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800 scale-105 shadow-lg'
                                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                                                                        }`}
                                                                >
                                                                    <div style={{
                                                                        width: '100%',
                                                                        height: '28px',
                                                                        borderRadius: '6px',
                                                                        background: tpl.color,
                                                                        border: tpl.id === 'minimal' ? '1px solid #ccc' : 'none'
                                                                    }} />
                                                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-tight text-center">{tpl.name}</span>
                                                                    {(formData.invoiceTemplate?.templateId || 'gradient') === tpl.id && (
                                                                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                                            <Check className="w-3 h-3 text-white" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Custom HTML Templates */}
                                        {(formData.invoiceTemplate?.customHtmlTemplates || []).length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Custom HTML</div>
                                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                    {(formData.invoiceTemplate?.customHtmlTemplates || []).map(tpl => (
                                                        <div key={tpl.id} className="relative group">
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({
                                                                    ...prev,
                                                                    invoiceTemplate: { ...prev.invoiceTemplate, templateId: tpl.id }
                                                                }))}
                                                                className={`w-full flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200 ${formData.invoiceTemplate?.templateId === tpl.id
                                                                    ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800 scale-105 shadow-lg'
                                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                                                                    }`}
                                                            >
                                                                <div style={{ width: '100%', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Code className="w-3.5 h-3.5 text-white" />
                                                                </div>
                                                                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-tight text-center truncate w-full">{tpl.name}</span>
                                                                {formData.invoiceTemplate?.templateId === tpl.id && (
                                                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                                        <Check className="w-3 h-3 text-white" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                            {/* Edit/Delete overlay */}
                                                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); openHtmlEditor(tpl); }} className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center hover:bg-blue-600 transition-colors">
                                                                    <Pencil className="w-2.5 h-2.5 text-white" />
                                                                </button>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); deleteHtmlTemplate(tpl.id); }} className="w-5 h-5 bg-red-500 rounded flex items-center justify-center hover:bg-red-600 transition-colors">
                                                                    <Trash2 className="w-2.5 h-2.5 text-white" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add Custom Template Button */}
                                        <button
                                            type="button"
                                            onClick={() => openHtmlEditor()}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-sm font-medium">Add Custom HTML Template</span>
                                        </button>

                                        <div className="border-t border-gray-200 dark:border-gray-700" />


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
                                                                    src={currentSettings.digitalSignature.startsWith('http') ? currentSettings.digitalSignature : `${BACKEND_URL}${currentSettings.digitalSignature} `}
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Secondary/Text Theme Color
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    value={formData.primaryTextColor}
                                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                                    className="w-16 h-10 rounded cursor-pointer bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.primaryTextColor}
                                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Login Card Text Color
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    value={formData.loginCardTextColor}
                                                    onChange={(e) => setFormData({ ...formData, loginCardTextColor: e.target.value })}
                                                    className="w-16 h-10 rounded cursor-pointer bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.loginCardTextColor}
                                                    onChange={(e) => setFormData({ ...formData, loginCardTextColor: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Changes the font color on the login screen overlay.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    App Font Family
                                                </label>
                                                <select
                                                    value={formData.appFontFamily}
                                                    onChange={(e) => setFormData({ ...formData, appFontFamily: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                >
                                                    <option value="Inter">Inter (Modern Sans)</option>
                                                    <option value="'Roboto', sans-serif">Roboto</option>
                                                    <option value="'Outfit', sans-serif">Outfit</option>
                                                    <option value="'Open Sans', sans-serif">Open Sans</option>
                                                    <option value="system-ui">System Default</option>
                                                    <option value="serif">Serif (Classic)</option>
                                                    <option value="monospace">Monospace (Code)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Sidebar Style
                                                </label>
                                                <select
                                                    value={formData.sidebarStyle}
                                                    onChange={(e) => setFormData({ ...formData, sidebarStyle: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                >
                                                    <option value="solid">Solid (Standard)</option>
                                                    <option value="glass">Glassmorphism (Translucent)</option>
                                                    <option value="minimal">Minimal (Hidden borders)</option>
                                                </select>
                                                <p className="text-xs text-gray-500 mt-2">Requires page reload to fully apply.</p>
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
                                                                src={currentSettings.profilePicture.startsWith('http') ? currentSettings.profilePicture : `${BACKEND_URL}${currentSettings.profilePicture} `}
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
                                                                src={currentSettings.letterhead.startsWith('http') ? currentSettings.letterhead : `${BACKEND_URL}${currentSettings.letterhead} `}
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
                                                                value={formData.letterheadConfig?.[`margin${side} `] || 20}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    letterheadConfig: { ...formData.letterheadConfig, [`margin${side} `]: parseInt(e.target.value) }
                                                                })}
                                                                className="w-full mt-1 accent-blue-600"
                                                            />
                                                            <div className="text-right text-xs text-blue-600 dark:text-blue-400 font-mono">{formData.letterheadConfig?.[`margin${side} `] || 20}mm</div>
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
                                                                    className={`flex - 1 py - 1.5 text - xs font - medium capitalize rounded - md transition - all ${(formData.letterheadConfig?.logoPosition || 'left') === pos
                                                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm'
                                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                                                        } `}
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
                                                            marginBottom: `- ${(1 - previewScale) * 297} mm`, // Compensate for scale white space
                                                            border: formData.letterheadConfig?.showBorder ? `2px solid ${formData.letterheadConfig?.borderColor} ` : 'none',
                                                        }}
                                                    >
                                                        {currentSettings?.letterhead && (
                                                            <div className="absolute inset-0 z-0 overflow-hidden">
                                                                <img
                                                                    src={currentSettings.letterhead.startsWith('http') ? currentSettings.letterhead : `${BACKEND_URL}${currentSettings.letterhead} `}
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
                                                                        fontSize: `${formData.letterheadConfig?.watermarkSize || 100} px`
                                                                    }}
                                                                >
                                                                    {formData.letterheadConfig.watermarkText}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative z-10 flex flex-col h-full"
                                                            style={{
                                                                paddingTop: `${formData.letterheadConfig?.marginTop || 20} mm`,
                                                                paddingBottom: `${formData.letterheadConfig?.marginBottom || 20} mm`,
                                                                paddingLeft: `${formData.letterheadConfig?.marginLeft || 20} mm`,
                                                                paddingRight: `${formData.letterheadConfig?.marginRight || 20} mm`,
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
                                                                    <div className={`flex ${formData.letterheadConfig?.logoPosition === 'center' ? 'flex-col text-center' : 'items-center'} gap - 4 mb - 2`}>
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
                                <div className="bg-slate-900 dark:bg-black rounded-[32px] p-8 box-outline shadow-2xl transition-all duration-300 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="bg-gray-900 rounded-[24px] overflow-hidden aspect-[1/1.414] relative">
                                            <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                                                <SettingsInvoicePreview settings={currentSettings} formData={formData} />
                                            </div>
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
            </div >

            {/* Custom HTML Template Editor Modal */}
            {showHtmlEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Code className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {editingHtmlTemplate ? 'Edit HTML Template' : 'New HTML Template'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Paste your custom HTML invoice design</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHtmlEditor(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Template Name */}
                        <div className="px-6 pt-4">
                            <input
                                type="text"
                                placeholder="Template Name (e.g. My Corporate Design)"
                                value={htmlEditorName}
                                onChange={(e) => setHtmlEditorName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Code / Preview Tabs */}
                        <div className="px-6 pt-3 flex gap-2">
                            <button
                                onClick={() => setHtmlPreviewMode(false)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!htmlPreviewMode ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                <Code className="w-3.5 h-3.5" /> HTML Code
                            </button>
                            <button
                                onClick={() => setHtmlPreviewMode(true)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${htmlPreviewMode ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                        </div>

                        {/* Editor / Preview Body */}
                        <div className="flex-1 overflow-hidden px-6 py-3">
                            {!htmlPreviewMode ? (
                                <div className="h-full flex flex-col gap-3">
                                    <textarea
                                        value={htmlEditorCode}
                                        onChange={(e) => setHtmlEditorCode(e.target.value)}
                                        placeholder={`Paste your HTML invoice template here...\n\nUse these placeholders:\n  {{shopName}}, {{address}}, {{phone}}, {{email}}\n  {{invoiceNo}}, {{date}}, {{customerName}}, {{customerPhone}}\n  {{subtotal}}, {{tax}}, {{total}}\n  {{itemsRows}} — generates <tr> rows for each item`}
                                        className="flex-1 min-h-[300px] w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-mono text-xs leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        spellCheck={false}
                                    />
                                    {/* Placeholder Reference */}
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Available Placeholders</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['{{shopName}}', '{{address}}', '{{phone}}', '{{email}}', '{{brandColor}}',
                                                '{{invoiceNo}}', '{{date}}', '{{customerName}}', '{{customerPhone}}',
                                                '{{subtotal}}', '{{tax}}', '{{total}}', '{{itemsRows}}'].map(p => (
                                                    <span key={p} className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-medium">{p}</span>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[350px] bg-white rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto">
                                    <div
                                        className="w-full h-full"
                                        dangerouslySetInnerHTML={{ __html: htmlEditorCode || '<div style="padding:40px;text-align:center;color:#999;font-size:14px">No HTML code to preview</div>' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowHtmlEditor(false)}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveHtmlTemplate}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {editingHtmlTemplate ? 'Update Template' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setFieldToDelete(null);
                }}
                onConfirm={confirmRemoveFile}
                title="Remove Image"
                message="Are you sure you want to remove this image? This action cannot be undone."
                confirmText="Remove"
                isDangerous={true}
            />
        </Layout >
    );
};

export default Settings;
