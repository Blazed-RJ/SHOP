import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import {
    Store, CreditCard, FileText, Smartphone,
    Save, Upload, Info, X, Image, Layout as LayoutIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const Settings = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { settings: currentSettings, refreshSettings, updateSettings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

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
        invoiceFooterText: ''
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
                invoiceFooterText: currentSettings.invoiceFooterText || ''
            });
        }
    }, [currentSettings]);

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

    const handleRemoveFile = async (field) => {
        if (!window.confirm('Are you sure you want to remove this image?')) return;

        try {
            await api.put('/settings', { [field]: null });
            toast.success('Image removed successfully');
            refreshSettings();
        } catch (error) {
            toast.error('Failed to remove image');
        }
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Store },
        { id: 'banking', name: 'Banking & QR', icon: CreditCard },
        { id: 'invoice', name: 'Invoice Design', icon: FileText },
        { id: 'appearance', name: 'App Appearance', icon: Smartphone },
        { id: 'letterheadTemplate', name: 'Letterhead Design', icon: LayoutIcon },
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
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Store Settings & Branding</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your store information and app appearance</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        <span>{loading ? 'Saving...' : 'Save All Changes'}</span>
                    </button>
                </div>

                {/* Demo Mode Indicator */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-4 mb-6 rounded-lg hidden">
                    <div className="flex items-center space-x-2">
                        <Info className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            <strong>Demo Mode:</strong> Settings saved to browser localStorage
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side - Tabs and Forms */}
                    <div className={activeTab === 'letterheadTemplate' ? "lg:col-span-3" : "lg:col-span-2"}>
                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <nav className="flex space-x-1 px-4 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5 flex-shrink-0" />
                                                <span>{tab.name}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <form onSubmit={handleSubmit}>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
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
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                placeholder="e.g., Best Deals in Tech"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Address
                                            </label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
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
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
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
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
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
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
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
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
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
                                        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 dark:border-purple-500 p-4 rounded-lg">
                                            <p className="text-sm text-purple-800 dark:text-purple-300">
                                                <strong>Customize Your Invoice Design</strong>
                                                <br />
                                                Control colors and branding that appear on all invoices
                                            </p>
                                        </div>

                                        {/* Brand Color */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Brand Color (Invoice Theme)
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    value={formData.brandColor}
                                                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                                                    className="w-16 h-10 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.brandColor}
                                                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Used for invoice header, table headers, and GRAND TOTAL badge
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 w-full">Quick picks:</p>
                                                {colorPresets.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, brandColor: color })}
                                                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 transition"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Company Logo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Company Logo
                                            </label>
                                            <div className="flex items-center space-x-4">
                                                {currentSettings?.logo && (
                                                    <img
                                                        src={currentSettings.logo.startsWith('http') ? currentSettings.logo : `http://localhost:5000${currentSettings.logo}`}
                                                        alt="Logo"
                                                        className="w-16 h-16 object-contain border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
                                                    />
                                                )}
                                                <label className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                                                    <Upload className="w-5 h-5" />
                                                    <span>Upload Logo</span>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => handleFileUpload(e, 'logo')}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />
                                                </label>
                                                {currentSettings?.logo && (
                                                    <button
                                                        onClick={() => handleRemoveFile('logo')}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                                                        title="Remove Logo"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                PNG, JPG, WEBP (max 2MB). Appears in invoice header.
                                            </p>
                                        </div>

                                        {/* Letterhead Upload */}


                                        {/* Primary Text Color */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Primary Text Color (for Invoice)
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    value={formData.primaryTextColor}
                                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                                    className="w-16 h-10 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.primaryTextColor}
                                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Applied to invoice text elements. Choose dark colors for better readability.
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 w-full">Quick picks:</p>
                                                {darkColorPresets.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, primaryTextColor: color })}
                                                        className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 transition"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Digital Signature */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Digital Signature / Stamp
                                            </label>
                                            <div className="flex items-center space-x-4">
                                                {currentSettings?.digitalSignature ? (
                                                    <img
                                                        src={currentSettings.digitalSignature.startsWith('http') ? currentSettings.digitalSignature : `http://localhost:5000${currentSettings.digitalSignature}`}
                                                        alt="Signature"
                                                        className="w-24 h-16 object-contain border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-16 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500">
                                                        <span className="font-serif italic text-lg">Signed</span>
                                                    </div>
                                                )}
                                                <label className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                                                    <Upload className="w-5 h-5" />
                                                    <span>Upload Signature</span>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => handleFileUpload(e, 'digitalSignature')}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />
                                                </label>
                                                {currentSettings?.digitalSignature && (
                                                    <button
                                                        onClick={() => handleRemoveFile('digitalSignature')}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                                                        title="Remove Signature"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                PNG with transparency recommended. Appears in invoice footer.
                                            </p>
                                        </div>

                                        {/* Invoice Text Configuration */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                            <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-4">Invoice Text & Labels</h4>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Terms & Conditions
                                                    </label>
                                                    <textarea
                                                        value={formData.termsAndConditions || ''}
                                                        onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                        rows={3}
                                                        placeholder="e.g. Goods once sold will not be taken back."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Footer Note
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.invoiceFooterText || ''}
                                                        onChange={(e) => setFormData({ ...formData, invoiceFooterText: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                        placeholder="e.g. Thank you for your business!"
                                                    />
                                                </div>

                                                {/* Footer Styling Controls */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Footer Font Size: <span className="text-blue-600 font-mono">{formData.footerFontSize}px</span>
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="8"
                                                            max="24"
                                                            value={formData.footerFontSize}
                                                            onChange={(e) => setFormData({ ...formData, footerFontSize: parseInt(e.target.value) })}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Footer Alignment
                                                        </label>
                                                        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                                                            {['left', 'center', 'right'].map((align) => (
                                                                <button
                                                                    key={align}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, footerAlignment: align })}
                                                                    className={`flex-1 py-1 text-xs font-medium capitalize rounded-md transition-all ${formData.footerAlignment === align
                                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                                                                        }`}
                                                                >
                                                                    {align}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="flex items-center cursor-pointer group">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only"
                                                                    checked={formData.footerFontFamily === 'handwritten'}
                                                                    onChange={(e) => setFormData({
                                                                        ...formData,
                                                                        footerFontFamily: e.target.checked ? 'handwritten' : 'sans-serif'
                                                                    })}
                                                                />
                                                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.footerFontFamily === 'handwritten' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.footerFontFamily === 'handwritten' ? 'translate-x-4' : ''}`}></div>
                                                            </div>
                                                            <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                                                                Use Handwritten Font Style
                                                                <span className="ml-2 text-xs text-gray-500 italic font-handwritten">(Thank you for your business!)</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Authorized Signatory Label
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.authSignLabel || ''}
                                                        onChange={(e) => setFormData({ ...formData, authSignLabel: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                                        placeholder="e.g. Authorized Signatory"
                                                    />
                                                </div>
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
                                                                src={currentSettings.profilePicture.startsWith('http') ? currentSettings.profilePicture : `http://localhost:5000${currentSettings.profilePicture}`}
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
                                                                onClick={() => handleRemoveFile('profilePicture')}
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

                                {activeTab === 'letterheadTemplate' && (
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="lg:w-1/2 space-y-6">
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

                                        <div className="lg:w-1/2">
                                            <div className="sticky top-6">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <LayoutIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Live A4 Preview</h3>
                                                </div>
                                                <div className="bg-gray-200 dark:bg-gray-900 p-4 rounded-xl overflow-auto flex justify-center h-[600px] border border-gray-200 dark:border-gray-700">
                                                    <div
                                                        className="bg-white shadow-lg relative transition-all duration-300 origin-top"
                                                        style={{
                                                            width: '210mm',
                                                            minHeight: '297mm',
                                                            transform: 'scale(0.5)',
                                                            border: formData.letterheadConfig?.showBorder ? `1px solid ${formData.letterheadConfig?.borderColor}` : 'none'
                                                        }}
                                                    >
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
                                                                <div className="flex flex-col items-start">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        {/* Logo Icon (Reused from Invoice Preview if no real logo) */}
                                                                        {currentSettings?.logo && (
                                                                            <img src={currentSettings.logo} className="h-12 w-auto object-contain" alt="Logo" />
                                                                        )}
                                                                        <div>
                                                                            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide leading-none">{formData.shopName || ''}</h1>
                                                                            <p className="text-xs text-gray-500 tracking-[0.2em]">{formData.tagline || ''}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Contact Info (Right) */}
                                                                <div className="text-right text-[10px] text-gray-600 leading-tight">
                                                                    <div className="font-semibold text-gray-800">
                                                                        {formData.address ? (
                                                                            <>
                                                                                <p>{formData.address.split('\n')[0]}</p>
                                                                                <p>{formData.address.split('\n')[1]}</p>
                                                                            </>
                                                                        ) : null}
                                                                    </div>
                                                                    {formData.phone && (
                                                                        <p className="mt-1 flex items-center justify-end gap-1">
                                                                            {formData.phone} <span className="text-[8px] bg-red-500 text-white rounded-full p-0.5">📞</span>
                                                                        </p>
                                                                    )}
                                                                    {formData.email && (
                                                                        <p className="flex items-center justify-end gap-1">
                                                                            {formData.email} <span className="text-[8px] bg-red-500 text-white rounded-full p-0.5">✉️</span>
                                                                        </p>
                                                                    )}
                                                                    {formData.website && (
                                                                        <p className="flex items-center justify-end gap-1">
                                                                            {formData.website} <span className="text-[8px] bg-red-500 text-white rounded-full p-0.5">🌐</span>
                                                                        </p>
                                                                    )}
                                                                    {formData.gstNumber && (
                                                                        <p className="flex items-center justify-end gap-1 mt-1">
                                                                            GSTIN: {formData.gstNumber}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Graphical Separator - Red/Black Line */}
                                                            <div className="w-full flex h-1.5 mb-8">
                                                                <div className="w-1/3" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                                                <div className="flex-1 bg-gray-900"></div>
                                                            </div>

                                                            {/* Content Placeholder */}
                                                            <div className="space-y-4 flex-1">
                                                                <div className="h-4 bg-gray-100 w-1/3 mb-8"></div>
                                                                <div className="space-y-2">
                                                                    <div className="h-4 bg-gray-100 w-full"></div>
                                                                    <div className="h-4 bg-gray-100 w-full"></div>
                                                                    <div className="h-4 bg-gray-100 w-5/6"></div>
                                                                    <div className="h-4 bg-gray-100 w-full"></div>
                                                                </div>
                                                            </div>

                                                            {/* Footer - 4 Color Blocks */}
                                                            <div className="absolute bottom-0 left-0 right-0 h-8 flex">
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

                    {/* Right Side - Live Invoice Preview */}
                    {activeTab !== 'letterheadTemplate' && (
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sticky top-6 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center space-x-2 mb-2">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Live Invoice Preview</h3>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">See your design changes in real-time</p>

                                {/* Mini Invoice Preview */}
                                <div className="bg-white shadow-lg rounded-lg overflow-hidden border text-xs">
                                    {/* Header - Modern Design */}
                                    {false ? (
                                        <div className="w-full">
                                            <img
                                                src={currentSettings.letterhead.startsWith('http') ? currentSettings.letterhead : `http://localhost:5000${currentSettings.letterhead}`}
                                                alt="Letterhead"
                                                className="w-full h-auto object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-white">
                                            <div className="flex justify-between items-start mb-2">
                                                {/* Left: Branding */}
                                                <div className="flex items-center gap-3">
                                                    {currentSettings?.logo && (
                                                        <img src={currentSettings.logo.startsWith('http') ? currentSettings.logo : `http://localhost:5000${currentSettings.logo}`} className="h-10 w-auto object-contain" alt="Logo" />
                                                    )}
                                                    <div>
                                                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-800 leading-tight">
                                                            {formData.shopName || ''}
                                                        </h4>
                                                        <p className="text-[9px] text-gray-500 tracking-[0.2em]">
                                                            {formData.tagline || ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Contact Info */}
                                                <div className="text-right">
                                                    <div className="text-[9px] text-gray-600 space-y-0.5 font-medium">
                                                        {formData.address ? (
                                                            <>
                                                                <p>{formData.address.split(',')[0]}</p>
                                                                <p>{formData.address.split(',')[1]}</p>
                                                            </>
                                                        ) : null}

                                                        {formData.phone && (
                                                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                                                <span>{formData.phone}</span>
                                                                <span className="text-[8px]" style={{ color: formData.brandColor || '#EF4444' }}>📞</span>
                                                            </div>
                                                        )}
                                                        {formData.email && (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <span>{formData.email}</span>
                                                                <span className="text-[8px]" style={{ color: formData.brandColor || '#EF4444' }}>✉️</span>
                                                            </div>
                                                        )}
                                                        {formData.website && (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <span>{formData.website}</span>
                                                                <span className="text-[8px]" style={{ color: formData.brandColor || '#EF4444' }}>🌐</span>
                                                            </div>
                                                        )}
                                                        {formData.gstNumber && (
                                                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                                                <span className="text-[8px] text-gray-600">GSTIN: {formData.gstNumber}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom Divider Line */}
                                            <div className="flex items-center mt-2 mb-1">
                                                <div className="h-1.5 rounded-l-full w-1/3" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                                <div className="h-0.5 bg-gray-800 w-2/3 rounded-r-full"></div>
                                            </div>
                                        </div>
                                    )}


                                    {/* From/To Section */}
                                    <div className="p-3 grid grid-cols-2 gap-3 border-b">
                                        <div>
                                            <div className="text-[8px] font-semibold mb-1" style={{ color: formData.primaryTextColor || '#1F2937' }}>From:</div>
                                            <p className="text-[10px] font-semibold" style={{ color: formData.primaryTextColor || '#1F2937' }}>{formData.shopName || 'Your Shop'}</p>
                                            <p className="text-[9px] text-gray-700 leading-tight mt-0.5">
                                                {formData.address || 'Shop Address'}
                                            </p>
                                            <p className="text-[9px] text-gray-700">{formData.phone || 'Phone Number'}</p>
                                            {formData.gstin && (
                                                <p className="text-[8px] text-gray-600 mt-0.5">GSTIN: {formData.gstin}</p>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-semibold mb-1" style={{ color: formData.primaryTextColor || '#1F2937' }}>To:</div>
                                            <p className="text-[10px] font-semibold" style={{ color: formData.primaryTextColor || '#1F2937' }}>Demo Customer</p>
                                            <p className="text-[9px] text-gray-700">9876543210</p>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="p-3">
                                        <table className="w-full text-[9px]">
                                            <thead style={{ backgroundColor: formData.brandColor || '#3B82F6' }}>
                                                <tr className="text-white">
                                                    <th className="py-1.5 px-2 text-left font-semibold">#</th>
                                                    <th className="py-1.5 px-2 text-left font-semibold">Item</th>
                                                    <th className="py-1.5 px-2 text-center font-semibold">Qty</th>
                                                    <th className="py-1.5 px-2 text-right font-semibold">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                <tr>
                                                    <td className="py-2 px-2 text-gray-600">1</td>
                                                    <td className="py-2 px-2 font-medium" style={{ color: formData.primaryTextColor || '#1F2937' }}>Sample Product 1</td>
                                                    <td className="py-2 px-2 text-center text-gray-700">2</td>
                                                    <td className="py-2 px-2 text-right font-medium" style={{ color: formData.primaryTextColor || '#1F2937' }}>₹2,000.00</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-2 text-gray-600">2</td>
                                                    <td className="py-2 px-2 font-medium" style={{ color: formData.primaryTextColor || '#1F2937' }}>Sample Product 2</td>
                                                    <td className="py-2 px-2 text-center text-gray-700">1</td>
                                                    <td className="py-2 px-2 text-right font-medium" style={{ color: formData.primaryTextColor || '#1F2937' }}>₹500.00</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Totals Section - Right Aligned */}
                                    <div className="p-3 border-t flex justify-end">
                                        <div className="w-48 space-y-0.5 text-[9px]">
                                            <div className="flex justify-between" style={{ color: formData.primaryTextColor || '#374151' }}>
                                                <span>Subtotal:</span>
                                                <span className="font-medium">₹2,500.00</span>
                                            </div>
                                            <div className="flex justify-between" style={{ color: formData.primaryTextColor || '#374151' }}>
                                                <span>Total GST:</span>
                                                <span className="font-medium">₹450.00</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-white p-1.5 rounded mt-1.5"
                                                style={{ backgroundColor: formData.brandColor || '#3B82F6' }}>
                                                <span className="text-[10px] uppercase tracking-wide">GRAND TOTAL:</span>
                                                <span className="text-[11px]">₹2,950.00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Section */}
                                    <div className="p-3 border-t bg-gray-50">
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Left: QR Code, Notes, Bank Details */}
                                            <div className="space-y-2">
                                                {/* QR Code */}
                                                {formData.upiId && (
                                                    <div className="flex flex-col items-start">
                                                        <QRCodeSVG
                                                            value={`upi://pay?pa=${formData.upiId}&pn=${encodeURIComponent(formData.shopName || 'Store')}`}
                                                            size={60}
                                                            level="M"
                                                        />
                                                        <div className="text-[7px] text-gray-500 mt-0.5">Scan to Pay</div>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                <div className="text-[8px] text-gray-700 leading-relaxed whitespace-pre-line">
                                                    <p className="font-semibold mb-0.5" style={{ color: formData.primaryTextColor || '#1F2937' }}>Notes:</p>
                                                    {formData.termsAndConditions || '• Goods once sold will not be taken back\n• Payment due within 30 days'}
                                                </div>
                                                {formData.invoiceFooterText && (
                                                    <div
                                                        className={`mt-1 ${formData.footerFontFamily === 'handwritten' ? 'font-handwritten' : 'font-medium'} ${formData.footerAlignment === 'center' ? 'text-center' : formData.footerAlignment === 'right' ? 'text-right' : 'text-left'}`}
                                                        style={{ fontSize: `${formData.footerFontSize * 0.7}px`, color: '#6B7280' }}
                                                    >
                                                        {formData.invoiceFooterText}
                                                    </div>
                                                )}

                                                {/* Bank Details */}
                                                {(formData.bankName || formData.accountNumber) && (
                                                    <div className="text-[8px]">
                                                        <p className="font-semibold mb-0.5" style={{ color: formData.primaryTextColor || '#1F2937' }}>Bank Details:</p>
                                                        <div className="text-gray-700 leading-tight">
                                                            {formData.bankName && <p>{formData.bankName}</p>}
                                                            {formData.accountNumber && <p>A/C: {formData.accountNumber}</p>}
                                                            {formData.ifscCode && <p>IFSC: {formData.ifscCode}</p>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Signature */}
                                            <div className="flex flex-col items-end justify-end">
                                                {currentSettings?.digitalSignature ? (
                                                    <>
                                                        <img
                                                            src={currentSettings.digitalSignature.startsWith('http') ? currentSettings.digitalSignature : `http://localhost:5000${currentSettings.digitalSignature}`}
                                                            alt="Signature"
                                                            className="w-24 h-12 object-contain mb-1"
                                                        />
                                                        <div className="text-[8px] font-medium text-gray-800 border-t border-gray-400 pt-0.5">
                                                            {formData.authSignLabel || 'Authorized Signatory'}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-end opacity-50">
                                                        <div className="w-20 h-10 flex items-center justify-center border border-dashed border-gray-300 rounded mb-1 bg-gray-50">
                                                            <span className="font-serif italic text-[10px] text-gray-500">Signed</span>
                                                        </div>
                                                        <div className="text-[8px] font-medium text-gray-800 border-t border-gray-400 pt-0.5 w-full text-right">
                                                            {formData.authSignLabel || 'Authorized Signatory'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    {/* Decorative Footer Bar */}
                                    <div className="flex h-3 border-t border-white">
                                        <div className="w-1/4 h-full" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                        <div className="w-1/4 h-full opacity-80" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                        <div className="w-1/4 h-full opacity-60" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                        <div className="w-1/4 h-full opacity-40" style={{ backgroundColor: formData.brandColor || '#EF4444' }}></div>
                                    </div>
                                </div>

                                {/* Tip */}
                                <div className="mt-4 text-xs text-blue-700 bg-blue-50 rounded p-2.5 border border-blue-200">
                                    <span className="font-semibold">💡 Live Preview:</span> Changes to brand color and signature update instantly!
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Settings;

