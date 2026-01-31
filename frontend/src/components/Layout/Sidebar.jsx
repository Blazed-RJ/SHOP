import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
    LayoutDashboard,
    Package,
    FileText,
    Users,
    TruckIcon,
    BookOpen,
    Settings,
    LogOut,
    User,
    Eye,
    EyeOff,
    ScrollText,
    Sun,
    Moon,
    Monitor
} from 'lucide-react';
import { useClientView } from '../../context/ClientViewContext.jsx';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout, isAdmin } = useAuth();
    const { settings, theme, toggleTheme } = useSettings();
    const { isClientView, toggleClientView } = useClientView();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', admin: false },
        { name: 'Inventory', icon: Package, path: '/inventory', admin: false },
        { name: 'New Invoice', icon: FileText, path: '/invoice/new', admin: false },
        { name: 'Invoice History', icon: BookOpen, path: '/invoices', admin: false },
        { name: 'Customers', icon: Users, path: '/customers', admin: false },
        { name: 'Suppliers', icon: TruckIcon, path: '/suppliers', admin: false }, // Everyone
        { name: 'Daybook', icon: BookOpen, path: '/daybook', admin: false },
        { name: 'Letterheads', icon: ScrollText, path: '/letterheads', admin: false },
        { name: 'Settings', icon: Settings, path: '/settings', admin: true }, // Admin Only
    ];

    const filteredNav = navItems.filter(item => !item.admin || isAdmin());

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/10
            transform transition-transform duration-300 ease-in-out h-screen flex flex-col
            md:translate-x-0 md:sticky md:top-0 md:inset-auto
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Logo & Brand */}
            <div className="p-6 border-b border-gray-200 dark:border-white/10 relative overflow-hidden">
                {/* Gold Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex items-center space-x-3 relative z-10">
                    {settings?.logo && (
                        <div className="p-1 rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 shadow-gold">
                            <img src={settings.logo.startsWith('http') ? settings.logo : `http://localhost:5000${settings.logo}`} alt="Logo" className="w-8 h-8 object-contain bg-black rounded-lg" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {settings?.shopName || 'Sharogis Digital'}
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-brand-600 dark:text-brand-400 font-semibold">{settings?.tagline || 'Inventory & Billing'}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {filteredNav.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => window.innerWidth < 768 && onClose && onClose()}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                ? 'text-white bg-gradient-to-r from-brand-800 to-brand-900 shadow-lg border border-brand-500/20'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute inset-0 bg-brand-500/5 mr-auto w-full h-full z-0"></div>
                                )}
                                <item.icon className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-400' : 'text-gray-400 group-hover:text-brand-500'}`} />
                                <span className={`relative z-10 ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-500 rounded-l-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-2 bg-gray-50/50 dark:bg-black/20">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-brand-500/50"
                >
                    <div className="flex items-center space-x-3">
                        {theme === 'dark' ? (
                            <div className="p-1.5 rounded-lg bg-gray-800 text-brand-400">
                                <Moon className="w-4 h-4" />
                            </div>
                        ) : theme === 'light' ? (
                            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-500">
                                <Sun className="w-4 h-4" />
                            </div>
                        ) : (
                            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-500">
                                <Monitor className="w-4 h-4" />
                            </div>
                        )}
                        <span className="font-medium text-sm">Theme</span>
                    </div>
                    <span className="text-xs text-brand-600 dark:text-brand-500 font-mono uppercase tracking-wider">{theme}</span>
                </button>

                {/* Client View Toggle */}
                <button
                    onClick={toggleClientView}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border ${isClientView
                        ? 'bg-brand-900/20 border-brand-500/50 text-brand-600 dark:text-brand-400'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'
                        }`}
                >
                    <div className="flex items-center space-x-3">
                        {isClientView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="font-medium text-sm">Client View</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isClientView ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${isClientView ? 'left-[18px]' : 'left-0.5'}`} />
                    </div>
                </button>

                {/* User Profile */}
                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-brand-500/30 transition-all cursor-pointer group">
                    {(settings?.profilePicture || user?.avatar) ? (
                        <img
                            src={settings?.profilePicture
                                ? (settings.profilePicture.startsWith('http') ? settings.profilePicture : `http://localhost:5000${settings.profilePicture}`)
                                : user?.avatar}
                            alt="Avatar"
                            className="w-9 h-9 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-brand-500 transition-all"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-brand-500 font-bold border border-white/10 shadow-inner group-hover:shadow-gold-lg transition-all">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-brand-400 transition-colors">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{settings?.roleBadge || user?.role?.toUpperCase()}</p>
                    </div>
                    <LogOut
                        onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                        className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors"
                    />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
