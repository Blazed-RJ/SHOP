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
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const { settings } = useSettings();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            toast.success(`Welcome back, ${result.user.name}!`);
            navigate('/dashboard');
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    };

    // Background image from settings or default gradient
    const backgroundStyle = settings?.backgroundImage
        ? { backgroundImage: `url(${settings.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

    return (
        <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            <div className="relative z-10 max-w-md w-full mx-4">
                <div className="glass-dark rounded-2xl shadow-2xl p-8">
                    {/* Logo and Shop Name */}
                    <div className="text-center mb-8">
                        {settings?.logo && (
                            <img
                                src={settings.logo}
                                alt="Shop Logo"
                                className="w-24 h-24 mx-auto mb-4 object-contain"
                            />
                        )}
                        <h1 className="text-3xl font-bold text-white tracking-widest uppercase">
                            {settings?.shopName || 'SHOP'}
                        </h1>
                        <p className="text-gray-300 mt-2">Point of Sale System</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Google Login */}
                    <div className="mt-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                setLoading(true);
                                const result = await googleLogin(credentialResponse.credential);
                                if (result.success) {
                                    toast.success(`Welcome back, ${result.user.name}!`);
                                    navigate('/dashboard');
                                } else {
                                    toast.error(result.error);
                                }
                                setLoading(false);
                            }}
                            onError={() => {
                                toast.error('Google authorization failed');
                            }}
                            theme="filled_black"
                            shape="pill"
                        />
                    </div>

                    {/* Demo Mode Hint */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-300 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
                                Register
                            </Link>
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
