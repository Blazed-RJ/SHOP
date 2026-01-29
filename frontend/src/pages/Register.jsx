import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
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

        const result = await register(name, username, password, shopCode);

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
        : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4" style={backgroundStyle}>
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            <div className="relative z-10 max-w-md w-full">
                <div className="glass-dark rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        {settings?.logo && (
                            <img
                                src={settings.logo}
                                alt="Shop Logo"
                                className="w-20 h-20 mx-auto mb-4 object-contain"
                            />
                        )}
                        <h2 className="text-3xl font-bold text-white">Create Account</h2>
                        <p className="text-gray-300 mt-2">Join our POS system</p>
                    </div>

                    {/* Info Alert */}
                    <div className="mb-6 p-4 bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded-lg">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-blue-300 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-100">
                                <p className="font-semibold mb-1">Shop Code Logic:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Code <span className="font-mono bg-white bg-opacity-10 px-1 rounded">OWNER2026</span> → Admin access</li>
                                    <li>• Wrong/Empty code → Staff access</li>
                                    <li>• First user automatically becomes Admin</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Choose a username"
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
                                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                Shop Code (Optional)
                            </label>
                            <input
                                type="text"
                                value={shopCode}
                                onChange={(e) => setShopCode(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Enter shop code for Admin access"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            {loading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-300 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
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
