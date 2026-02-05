import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [shopCode, setShopCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();
    const { settings } = useSettings();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        setLoading(true);

        const result = await register(name, username, email, password, shopCode);

        if (result.success) {
            toast.success(`Account created! Welcome, ${result.user.name}`);
            navigate('/dashboard');
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    };

    // Background style
    const backgroundStyle = settings?.backgroundImage
        ? { backgroundImage: `url(${settings.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: '#09090b' };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden" style={backgroundStyle}>
            {/* Gold Standard Ambient Effects */}
            {!settings?.backgroundImage && (
                <>
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                </>
            )}

            {/* Overlay */}
            {settings?.backgroundImage && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>}

            <div className="relative z-10 max-w-md w-full">
                <div className="bg-black/40 backdrop-blur-xl rounded-[32px] border border-amber-500/20 shadow-[0_8px_32px_0_rgba(245,158,11,0.15)] p-0 relative overflow-hidden group">

                    {/* Shimmer Border */}
                    <div className="absolute inset-0 border border-white/10 rounded-[32px] pointer-events-none"></div>

                    <div className="p-8 pb-6">
                        {/* Header */}
                        <div className="text-center mb-8">
                            {settings?.logo && (
                                <img
                                    src={settings.logo}
                                    alt="Shop Logo"
                                    className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                />
                            )}
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                Create Account
                            </h2>
                            <p className="text-amber-500/60 mt-2 font-medium">Join our POS system</p>
                        </div>

                        {/* Info Alert (Gold) */}
                        <div className="mb-8 p-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl">
                            <div className="bg-[#0f0f11]/90 rounded-[10px] p-4 flex items-start">
                                <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-gray-300">
                                    <p className="font-bold text-amber-500 mb-1 tracking-wide uppercase text-xs">Shop Code Logic</p>
                                    <ul className="space-y-1.5 text-xs font-medium text-gray-400">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            <span>Code <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">OWNER2026</span> → Admin</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                            <span>Wrong/Empty code → Staff access</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                        Shop Code
                                    </label>
                                    <input
                                        type="text"
                                        value={shopCode}
                                        onChange={(e) => setShopCode(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                        placeholder="Create password"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                        Confirm
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                        placeholder="Confirm"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-4 px-6 rounded-xl font-black text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(245,158,11,0.4)] transform hover:-translate-y-0.5 tracking-wide text-lg"
                            >
                                {loading ? 'Creating Account...' : 'Register'}
                            </button>
                        </form>
                    </div>

                    {/* Login Link */}
                    <div className="text-center bg-white/5 py-4 border-t border-white/5">
                        <p className="text-gray-400 text-sm font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-amber-500 hover:text-amber-400 font-bold hover:underline transition-all">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

