import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Layout from '../components/Layout/Layout';
import {
    Store, CreditCard, Save, Library, Plus, Trash2, CheckCircle, AlertCircle, Wallet, Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import ConfirmationModal from '../components/ConfirmationModal';
import DashboardStats from '../components/DashboardStats';

const Catalog = () => {
    const { isAdmin } = useAuth();
    const { settings: currentSettings, updateSettings } = useSettings();
    const [loading, setLoading] = useState(false);

    // Using local state for form to control inputs
    const [formData, setFormData] = useState({
        shopName: '',
        bankAccounts: [],
        upiId: ''
    });

    useEffect(() => {
        if (currentSettings) {
            // Migration logic: If no bankAccounts but old fields exist, create one
            let initialAccounts = currentSettings.bankAccounts || [];
            if (initialAccounts.length === 0 && (currentSettings.bankName || currentSettings.accountNumber)) {
                initialAccounts = [{
                    id: Date.now().toString(),
                    type: 'bank',
                    bankName: currentSettings.bankName || '',
                    bankHolderName: currentSettings.bankHolderName || '',
                    accountNumber: currentSettings.accountNumber || '',
                    ifscCode: currentSettings.ifscCode || '',
                    bankBranch: currentSettings.bankBranch || '',
                    upiId: currentSettings.upiId || '',
                    isDefault: true
                }];
            } else {
                // Ensure all accounts have a type (migration for existing array)
                initialAccounts = initialAccounts.map(acc => ({
                    ...acc,
                    type: acc.type || 'bank'
                }));
            }

            setFormData({
                shopName: currentSettings.shopName || '',
                bankAccounts: initialAccounts,
                upiId: currentSettings.upiId || ''
            });
        }
    }, [currentSettings]);

    // Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);

    const handleAddAccount = (type = 'bank') => {
        const newAccount = {
            id: Date.now().toString(),
            type,
            bankName: type === 'cash' ? 'Main Cash' : '', // Reuse bankName for Account Name
            bankHolderName: '',
            accountNumber: '',
            ifscCode: '',
            bankBranch: type === 'cash' ? 'Petty Cash' : '', // Reuse bankBranch for Description
            upiId: '',
            isDefault: formData.bankAccounts.length === 0
        };
        setFormData(prev => ({
            ...prev,
            bankAccounts: [...prev.bankAccounts, newAccount]
        }));
    };

    const handleRemoveAccount = (id) => {
        setAccountToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!accountToDelete) return;

        setFormData(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.filter(acc => acc.id !== accountToDelete)
        }));

        setShowDeleteModal(false);
        setAccountToDelete(null);
    };

    const handleUpdateAccount = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.map(acc =>
                acc.id === id ? { ...acc, [field]: value } : acc
            )
        }));
    };

    const handleSetDefault = (id) => {
        setFormData(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.map(acc => ({
                ...acc,
                isDefault: acc.id === id
            }))
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Ensure one default exists if accounts exist
            let accountsToSave = [...formData.bankAccounts];
            if (accountsToSave.length > 0 && !accountsToSave.some(a => a.isDefault)) {
                accountsToSave[0].isDefault = true;
            }

            // Sync legacy fields with default account for backward compatibility
            const defaultAcc = accountsToSave.find(a => a.isDefault) || {};
            const payload = {
                ...formData,
                bankAccounts: accountsToSave,
                // Legacy support
                bankName: defaultAcc.bankName || '',
                bankHolderName: defaultAcc.bankHolderName || '',
                accountNumber: defaultAcc.accountNumber || '',
                ifscCode: defaultAcc.ifscCode || '',
                bankBranch: defaultAcc.bankBranch || '',
                upiId: defaultAcc.upiId || formData.upiId || ''
            };

            const result = await updateSettings(payload);
            if (result.success) {
                toast.success('Banking details updated successfully');
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

    // Find default account for preview
    const defaultAccount = formData.bankAccounts.find(a => a.isDefault) || formData.bankAccounts[0] || {};

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen relative z-0 bg-gray-50/50 dark:bg-[#050505] transition-colors duration-500">
                {/* Header Section */}
                <div className="mb-10 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Library className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em]">Master Data</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                Cash & Bank <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Manager</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md">
                                Manage your banking details and cash accounts.
                            </p>
                        </div>
                        {isAdmin() && (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`flex items-center space-x-2 px-8 py-4 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded-2xl shadow-[0_20px_40px_rgba(37,99,235,0.2)] hover:shadow-[0_25px_50px_rgba(37,99,235,0.3)] transition-all duration-300 transform hover:-translate-y-1 group`}
                            >
                                <Save className={`${loading ? 'animate-pulse' : 'group-hover:scale-110'} w-6 h-6 transition-transform`} />
                                <span className="font-black tracking-tight text-lg">{loading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Financial Summary */}
                <DashboardStats />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Bank Accounts List */}
                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border-[2.5px] border-blue-500/30 shadow-2xl transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-500" />
                                    Accounts
                                </h2>
                                {isAdmin() && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddAccount('cash')}
                                            className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                        >
                                            <Wallet className="w-4 h-4" />
                                            Add Cash
                                        </button>
                                        <button
                                            onClick={() => handleAddAccount('bank')}
                                            className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Bank
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isAdmin() ? (
                                <div className="space-y-6">
                                    {formData.bankAccounts.length === 0 && (
                                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">No accounts added yet.</p>
                                            <div className="mt-4 flex justify-center gap-4">
                                                <button onClick={() => handleAddAccount('cash')} className="text-green-500 font-bold hover:underline">Add Cash</button>
                                                <button onClick={() => handleAddAccount('bank')} className="text-blue-500 font-bold hover:underline">Add Bank</button>
                                            </div>
                                        </div>
                                    )}

                                    {formData.bankAccounts.map((account, index) => (
                                        <div key={account.id} className={`relative p-6 rounded-2xl border-2 transition-all ${account.isDefault
                                            ? (account.type === 'cash' ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10')
                                            : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
                                            }`}>
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${account.type === 'cash' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                                                        {account.type === 'cash' ? <Banknote className="w-4 h-4" /> : index + 1}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-wide">
                                                                {account.type === 'cash' ? 'CASH ACCOUNT' : 'BANK ACCOUNT'}
                                                            </span>
                                                            {account.isDefault && (
                                                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg ${account.type === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!account.isDefault && (
                                                        <button
                                                            onClick={() => handleSetDefault(account.id)}
                                                            className="text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        >
                                                            Set Default
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveAccount(account.id)}
                                                        className="text-red-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Form Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Fields for CASH */}
                                                {account.type === 'cash' && (
                                                    <>
                                                        <div className="md:col-span-1">
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Account Name</label>
                                                            <input
                                                                type="text"
                                                                value={account.bankName}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'bankName', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:outline-none transition-colors font-medium text-gray-900 dark:text-white"
                                                                placeholder="e.g. Main Cash, Petty Cash"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-1">
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Description</label>
                                                            <input
                                                                type="text"
                                                                value={account.bankBranch}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'bankBranch', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:outline-none transition-colors font-medium text-gray-900 dark:text-white"
                                                                placeholder="Description or location"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Fields for BANK */}
                                                {(account.type === 'bank' || !account.type) && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Bank Name</label>
                                                            <input
                                                                type="text"
                                                                value={account.bankName}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'bankName', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900 dark:text-white"
                                                                placeholder="HDFC Bank"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Account Number</label>
                                                            <input
                                                                type="text"
                                                                value={account.accountNumber}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'accountNumber', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none transition-colors font-mono text-gray-900 dark:text-white"
                                                                placeholder="0000000000"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Holder Name</label>
                                                            <input
                                                                type="text"
                                                                value={account.bankHolderName}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'bankHolderName', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900 dark:text-white"
                                                                placeholder="Holder Name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">IFSC Code</label>
                                                            <input
                                                                type="text"
                                                                value={account.ifscCode}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'ifscCode', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none transition-colors font-mono text-gray-900 dark:text-white uppercase"
                                                                placeholder="IFSC1234"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Branch</label>
                                                            <input
                                                                type="text"
                                                                value={account.bankBranch}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'bankBranch', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none transition-colors font-medium text-gray-900 dark:text-white"
                                                                placeholder="Branch Name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">UPI ID</label>
                                                            <input
                                                                type="text"
                                                                value={account.upiId}
                                                                onChange={(e) => handleUpdateAccount(account.id, 'upiId', e.target.value)}
                                                                className="w-full px-4 py-2 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:outline-none transition-colors font-mono text-gray-900 dark:text-white"
                                                                placeholder="user@upi"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    You do not have permission to edit banking details.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        {/* Info / Help Section */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-xl font-bold mb-4 relative z-10">Multiple Accounts</h3>
                            <p className="text-blue-100 mb-6 text-sm leading-relaxed relative z-10">
                                You can now add multiple bank and cash accounts. The <strong>Default</strong> account will be used on all invoices.
                            </p>
                        </div>

                        {/* Preview Section */}
                        {defaultAccount.bankName && (
                            <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur rounded-[24px] p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                                <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Default Account Preview
                                </h3>

                                <div className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-black/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800 mb-6">
                                    <div className="space-y-1">
                                        {defaultAccount.type === 'cash' ? (
                                            <>
                                                <p><span className="opacity-50">Account:</span> {defaultAccount.bankName}</p>
                                                <p><span className="opacity-50">Type:</span> Cash Account</p>
                                                {defaultAccount.bankBranch && <p><span className="opacity-50">Desc:</span> {defaultAccount.bankBranch}</p>}
                                            </>
                                        ) : (
                                            <>
                                                <p><span className="opacity-50">Bank:</span> {defaultAccount.bankName}</p>
                                                <p><span className="opacity-50">A/c No:</span> {defaultAccount.accountNumber}</p>
                                                <p><span className="opacity-50">IFSC:</span> {defaultAccount.ifscCode}</p>
                                                <p><span className="opacity-50">Branch:</span> {defaultAccount.bankBranch}</p>
                                                <p><span className="opacity-50">Holder:</span> {defaultAccount.bankHolderName}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {defaultAccount.type !== 'cash' && defaultAccount.upiId && (
                                    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="bg-white p-2 rounded-lg">
                                            <QRCodeSVG
                                                value={`upi://pay?pa=${defaultAccount.upiId}&pn=${encodeURIComponent(formData.shopName || 'Store')}`}
                                                size={60}
                                                level="L"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{formData.shopName}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{defaultAccount.upiId}</p>
                                            <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded flex items-center gap-1 w-fit mt-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                Active QR
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>


                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    title="Remove Account"
                    message="Are you sure you want to remove this account? This action cannot be undone."
                    confirmText="Remove"
                    cancelText="Cancel"
                    isDangerous={true}
                />
            </div >
        </Layout >
    );
};

export default Catalog;

