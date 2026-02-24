import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { ArrowLeft, Save, Printer, Type, Layout as LayoutIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const LetterheadCreator = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isViewMode = location.pathname.includes('/view/');
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [previewScale, setPreviewScale] = useState(0.65);

    // Document Content
    const [recipient, setRecipient] = useState({ name: '', address: '', email: '' });
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');

    // Copy Global Config to Local State (for potential overrides, though we stick to Global for now)
    const [config, setConfig] = useState(null);

    useEffect(() => {
        if (settings?.letterheadConfig && !id) {
            setConfig(settings.letterheadConfig);
        }
    }, [settings, id]);

    const loadLetterhead = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/letterheads/${id}`);
            setRecipient(data.recipient || { name: '', address: '', email: '' });
            setSubject(data.subject);
            setContent(data.content);
            if (data.configSnapshot) {
                setConfig(data.configSnapshot);
            } else if (settings?.letterheadConfig) {
                setConfig(settings.letterheadConfig);
            }
        } catch (error) {
            console.error('Failed to load', error);
            toast.error('Failed to load letterhead');
            navigate('/letterheads');
        } finally {
            setLoading(false);
        }
    }, [id, settings, navigate]);

    useEffect(() => {
        if (id) {
            loadLetterhead();
        }
    }, [id, loadLetterhead]);



    const handleSave = async (status = 'Draft') => {
        if (!subject || !content) {
            toast.error('Subject and Content are required');
            return;
        }
        try {
            setLoading(true);
            const data = {
                recipient,
                subject,
                content,
                status
            };

            if (id) {
                await api.put(`/letterheads/${id}`, data);
                toast.success('Letterhead updated');
            } else {
                await api.post('/letterheads', data);
                toast.success('Letterhead created');
            }
            navigate('/letterheads');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save letterhead');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!config) return <Layout><div className="p-6">Loading config...</div></Layout>;

    return (
        <Layout>
            <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col no-print bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/letterheads')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Letter</h1>
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={handlePrint} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <Printer className="w-4 h-4" />
                            <span>Print / PDF</span>
                        </button>
                        {!isViewMode && (
                            <button onClick={() => handleSave('Final')} disabled={loading} className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                <Save className="w-4 h-4" />
                                <span>{loading ? 'Saving...' : id ? 'Update' : 'Save Document'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Editor Panel */}
                    <div className="w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-[28px] shadow-xl border-[2.5px] border-amber-500/30 overflow-hidden relative">
                        {/* Soft Gold Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none"></div>

                        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-b-[2.5px] border-amber-500/20 flex items-center justify-between">
                            <h3 className="font-black text-amber-800 dark:text-amber-500 flex items-center uppercase tracking-widest text-xs">
                                <Type className="w-4 h-4 mr-2" /> Content Editor
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Recipient */}
                            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Recipient Details</span>
                                <input
                                    type="text"
                                    placeholder="Recipient Name"
                                    value={recipient.name}
                                    onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                />
                                <textarea
                                    placeholder="Address / Designation"
                                    value={recipient.address}
                                    onChange={(e) => setRecipient({ ...recipient, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm h-16 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Subject of the letter..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Body */}
                            <div className="flex-1 flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body Content</label>
                                <textarea
                                    placeholder="Type your letter content here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm leading-relaxed resize-none min-h-[300px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    style={{ fontFamily: config.fontFamily }}
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    HTML or Markdown not supported in this version. Plain text only.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel (A4) */}
                    <div className="flex-1 bg-slate-100 dark:bg-[#0F172A] rounded-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800 relative shadow-inner">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                        </div>
                        {/* Zoom Control Overlay */}
                        <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100 transition-opacity">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Zoom</span>
                            <input
                                type="range"
                                min="0.3"
                                max="1.2"
                                step="0.05"
                                value={previewScale}
                                onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                                className="w-20 accent-blue-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="w-8 text-center text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{Math.round(previewScale * 100)}%</span>
                        </div>

                        <div className="overflow-auto flex-1 flex justify-center p-8 relative z-10">
                            <div className="printable-content bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative transition-all duration-300 origin-top border-t border-gray-100"
                                style={{
                                    width: '210mm',
                                    minHeight: '297mm',
                                    transform: `scale(${previewScale})`,
                                    marginBottom: `-${(1 - previewScale) * 297}mm`,
                                    paddingTop: `${config.marginTop}mm`,
                                    paddingBottom: `${config.marginBottom}mm`,
                                    paddingLeft: `${config.marginLeft}mm`,
                                    paddingRight: `${config.marginRight}mm`,
                                    fontFamily: config.fontFamily || 'Inter',
                                    position: 'relative'
                                }}
                            >
                                {/* Watermark */}
                                {config.watermarkText && (
                                    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
                                        <div
                                            className="font-bold text-gray-900 transform -rotate-45 whitespace-nowrap select-none"
                                            style={{
                                                opacity: config.watermarkOpacity,
                                                fontSize: `${config.watermarkSize || 100}px`
                                            }}
                                        >
                                            {config.watermarkText}
                                        </div>
                                    </div>
                                )}

                                {/* Header - Liceria Style */}
                                <div className="relative z-10 flex justify-between items-start mb-4">
                                    {/* Branding (Left) */}
                                    <div className="flex flex-col items-start">
                                        <div className="flex items-center gap-3 mb-2">
                                            {settings?.logo && (
                                                <img src={settings.logo} className="h-16 w-auto object-contain" alt="Logo" />
                                            )}
                                            <div>
                                                <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wide leading-none">{settings.shopName || ''}</h1>
                                                <p className="text-sm text-gray-500 tracking-[0.2em]">{settings.tagline || ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Info (Right) */}
                                    <div className="text-right text-xs text-gray-600 leading-tight">
                                        <p className="font-semibold text-gray-800">{settings.address?.split('\n')[0]}</p>
                                        <p>{settings.address?.split('\n')[1]}</p>
                                        {settings.phone && (
                                            <p className="mt-2 flex items-center justify-end gap-2">
                                                {settings.phone} <span className="text-[10px] bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center">📞</span>
                                            </p>
                                        )}
                                        {settings.email && (
                                            <p className="flex items-center justify-end gap-2 mt-1">
                                                {settings.email} <span className="text-[10px] bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center">✉️</span>
                                            </p>
                                        )}
                                        {settings.website && (
                                            <p className="flex items-center justify-end gap-2 mt-1">
                                                {settings.website} <span className="text-[10px] bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center">🌐</span>
                                            </p>
                                        )}
                                        {settings.gstNumber && (
                                            <p className="flex items-center justify-end gap-2 mt-1 font-semibold">
                                                GSTIN: {settings.gstNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Graphical Separator - Red/Black Line */}
                                <div className="relative z-10 w-full flex h-3 mb-10">
                                    <div className="w-1/3" style={{ backgroundColor: settings.brandColor || '#EF4444' }}></div>
                                    <div className="flex-1 bg-black"></div>
                                </div>

                                {/* Letter Content */}
                                <div className="relative z-10 text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {/* Date */}
                                    <div className="mb-8 text-right font-medium">
                                        {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>

                                    {/* Recipient Block */}
                                    {(recipient.name || recipient.address) && (
                                        <div className="mb-12">
                                            <p className="font-bold text-lg">{recipient.name}</p>
                                            <p className="whitespace-pre-line text-gray-600">{recipient.address}</p>
                                        </div>
                                    )}

                                    {/* Subject */}
                                    {subject && (
                                        <div className="mb-8 font-bold text-lg underline decoration-2 underline-offset-4 decoration-gray-400">
                                            Subject: {subject}
                                        </div>
                                    )}

                                    {/* Body */}
                                    <div className="min-h-[300px] text-justify text-base">
                                        {content || <span className="text-gray-300 italic">Start typing content...</span>}
                                    </div>

                                    {/* Signature Block */}
                                    <div className="mt-20 text-right">
                                        <p className="font-bold text-lg">{settings.shopName}</p>
                                        <div className="h-24"></div>
                                        <p className="text-sm text-gray-600 border-t inline-block pt-2 px-8 border-gray-400">Authorized Signatory</p>
                                    </div>
                                </div>

                                {/* Footer - 4 Color Blocks */}
                                <div className="absolute bottom-0 left-0 right-0 h-12 flex">
                                    <div className="flex-1" style={{ backgroundColor: settings.brandColor || '#EF4444' }}></div>
                                    <div className="flex-1" style={{ backgroundColor: settings.brandColor || '#EF4444', filter: 'brightness(0.9)' }}></div>
                                    <div className="flex-1" style={{ backgroundColor: settings.brandColor || '#EF4444', filter: 'brightness(0.8)' }}></div>
                                    <div className="flex-1" style={{ backgroundColor: settings.brandColor || '#EF4444', filter: 'brightness(0.7)' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; background: white; }
                    .no-print { display: none !important; }
                    .printable-content {
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default LetterheadCreator;
