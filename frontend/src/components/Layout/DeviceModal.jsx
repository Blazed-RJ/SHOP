import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, X, LogOut, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DeviceIcon = ({ name }) => {
    const isMobile = name?.toLowerCase().includes('android') || name?.toLowerCase().includes('iphone');
    return isMobile
        ? <Smartphone className="w-5 h-5 text-amber-400" />
        : <Monitor className="w-5 h-5 text-amber-400" />;
};

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DeviceModal = ({ onClose, onLogoutCurrent }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState(null);
    const currentDeviceId = localStorage.getItem('deviceId');

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const { data } = await api.get('/auth/devices', {
                    headers: { 'x-device-id': currentDeviceId }
                });
                setDevices(data);
            } catch {
                toast.error('Could not load devices');
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, [currentDeviceId]);

    const handleRemove = async (deviceId, isCurrent) => {
        if (isCurrent) {
            // Logging out current device = full logout
            onClose();
            onLogoutCurrent();
            return;
        }
        setRemoving(deviceId);
        try {
            await api.delete(`/auth/devices/${deviceId}`);
            setDevices(prev => prev.filter(d => d.id !== deviceId));
            toast.success('Device removed');
        } catch {
            toast.error('Failed to remove device');
        } finally {
            setRemoving(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-md bg-zinc-900 border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base">Trusted Devices</h2>
                            <p className="text-gray-500 text-xs">Select a device to log out from</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Device List */}
                <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-sm">Loading devices...</span>
                        </div>
                    ) : devices.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-8">No trusted devices found</p>
                    ) : (
                        devices.map(device => (
                            <div
                                key={device.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${device.isCurrent
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <DeviceIcon name={device.name} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">
                                        {device.name || 'Unknown Device'}
                                        {device.isCurrent && (
                                            <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                This device
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-gray-500 text-xs">Trusted on {formatDate(device.addedAt)}</p>
                                </div>
                                <button
                                    onClick={() => handleRemove(device.id, device.isCurrent)}
                                    disabled={removing === device.id}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${device.isCurrent
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                        : 'bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 border border-white/10'
                                        }`}
                                >
                                    {removing === device.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : device.isCurrent ? (
                                        <><LogOut className="w-3 h-3" /> Logout</>
                                    ) : (
                                        <><Trash2 className="w-3 h-3" /> Remove</>
                                    )}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onClose(); onLogoutCurrent(); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500/80 hover:bg-red-500 transition-all"
                    >
                        Logout This Device
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeviceModal;
