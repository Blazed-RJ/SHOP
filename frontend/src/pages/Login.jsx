import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const navigate = useNavigate();
    const { login, googleLogin, verifyOTP } = useAuth();
    const { settings } = useSettings();
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [tempUserId, setTempUserId] = useState(null);
    const [emailMasked, setEmailMasked] = useState('');
    // deviceId is generated at app startup in main.jsx

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const deviceId = localStorage.getItem('deviceId');
        const result = await login(username, password, deviceId);

        if (result.success) {
            if (result.requireOtp) {
                setTempUserId(result.userId);
                setEmailMasked(result.emailMasked);
                setShowOtpInput(true);
                toast.success('Verification code sent to email');
            } else {
                toast.success(`Welcome back, ${result.user.name}!`);
                navigate('/dashboard');
            }
        } else {
            toast.error(result.error || 'An unexpected error occurred during login.');
        }

        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const deviceId = localStorage.getItem('deviceId');
        const result = await verifyOTP(tempUserId, otp, deviceId);
        if (result.success) {
            toast.success(`Welcome back, ${result.user.name}!`);
            navigate('/dashboard');
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        try {
            const { data } = await import('../utils/api').then(m => m.default.post('/auth/resend-otp', { userId: tempUserId }));
            setEmailMasked(data.emailMasked);
            toast.success('New verification code sent!');
        } catch {
            toast.error('Failed to resend code. Try again.');
        }
        setResendLoading(false);
    };

    // New Gold Standard Background
    const backgroundStyle = settings?.backgroundImage
        ? { backgroundImage: `url(${settings.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: '#09090b' }; // Deep Zinc Black

    if (!settings?.backgroundImage) {
        // If no custom background, we render the gold glow manually in the JSX
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={backgroundStyle}>
            {/* Gold Standard Ambient Effects */}
            {!settings?.backgroundImage && (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                </>
            )}

            {/* Overlay for custom images */}
            {settings?.backgroundImage && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>}

            <div className="relative z-10 max-w-md w-full mx-4">
                <div className="bg-black/40 backdrop-blur-xl rounded-[32px] border border-amber-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-8 relative overflow-hidden group">

                    {/* Shimmer Border Effect */}
                    <div className="absolute inset-0 border border-white/10 rounded-[32px] pointer-events-none"></div>

                    {/* Logo and Shop Name */}
                    <div className="text-center mb-10">
                        {settings?.logo && (
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
                                <img
                                    src={settings.logo}
                                    alt="Shop Logo"
                                    className="w-24 h-24 relative z-10 mx-auto object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                />
                            </div>
                        )}
                        <h1 className="text-3xl font-black text-white tracking-widest uppercase">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                                {settings?.shopName || 'SHOP'}
                            </span>
                        </h1>
                        <p className="text-amber-500/60 mt-2 font-medium tracking-wide text-sm">Point of Sale System</p>
                    </div>

                    {/* Login Form / OTP Form */}
                    {!showOtpInput ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 rounded-xl font-black text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(245,158,11,0.4)] transform hover:-translate-y-0.5 tracking-wide text-lg"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-white mb-2">Verify Device</h3>
                                <p className="text-gray-400 text-sm">
                                    Enter the 6-digit code sent to<br />
                                    <span className="font-mono text-amber-400">{emailMasked}</span>
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider mb-2 text-center">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-center tracking-[1em] text-3xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                                    placeholder="000000"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-4 px-6 rounded-xl font-black text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(245,158,11,0.4)] transform hover:-translate-y-0.5 tracking-wide"
                            >
                                {loading ? 'Verifying...' : 'Verify & Trust Device'}
                            </button>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendLoading}
                                    className="flex-1 py-3 text-sm text-amber-500 hover:text-amber-400 transition-colors font-bold border border-amber-500/30 hover:border-amber-500/60 rounded-xl"
                                >
                                    {resendLoading ? 'Sending...' : 'Resend Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowOtpInput(false)}
                                    className="flex-1 py-3 text-sm text-gray-500 hover:text-white transition-colors font-medium border border-transparent hover:border-white/10 rounded-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Google Login */}
                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-transparent text-gray-500 font-medium bg-[#0f0f11]">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center grayscale hover:grayscale-0 transition-all duration-300">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                setLoading(true);
                                const result = await googleLogin(credentialResponse.credential);
                                if (result.success) {
                                    if (result.requireOtp) {
                                        setTempUserId(result.userId);
                                        setEmailMasked(result.emailMasked);
                                        setShowOtpInput(true);
                                        toast.success('Verification code sent to email');
                                    } else {
                                        toast.success(`Welcome back, ${result.user.name}!`);
                                        navigate('/dashboard');
                                    }
                                } else {
                                    toast.error(result.error);
                                }
                                setLoading(false);
                            }}
                            onError={() => {
                                toast.error('Google authorization failed');
                            }}
                            theme="filled_black"
                            shape="circle"
                        />
                    </div>

                    {/* Register Link */}
                    <div className="mt-8 text-center bg-white/5 mx-[-2rem] mb-[-2rem] py-4 rounded-b-[32px] border-t border-white/5">
                        <p className="text-gray-400 text-sm font-medium">
                            First time here?{' '}
                            <Link to="/register" className="text-amber-500 hover:text-amber-400 font-bold hover:underline transition-all">
                                Create an Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

