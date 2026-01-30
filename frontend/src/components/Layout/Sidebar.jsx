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
        { name: 'Settings', icon: Settings, path: '/settings', admin: false }, // Everyone
    ];

    const filteredNav = navItems.filter(item => !item.admin || isAdmin());

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
            transform transition-transform duration-300 ease-in-out h-screen flex flex-col
            md:translate-x-0 md:static md:inset-auto
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Logo & Brand */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    {settings?.logo && (
                        <img src={settings.logo.startsWith('http') ? settings.logo : `http://localhost:5000${settings.logo}`} alt="Logo" className="w-10 h-10 object-contain" />
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {settings?.shopName || 'Sharogis Digital'}
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{settings?.tagline || 'Inventory & Billing'}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {filteredNav.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => window.innerWidth < 768 && onClose && onClose()}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 mb-2"
                >
                    <div className="flex items-center space-x-3">
                        {theme === 'dark' ? (
                            <Moon className="w-5 h-5 text-purple-500" />
                        ) : theme === 'light' ? (
                            <Sun className="w-5 h-5 text-orange-500" />
                        ) : (
                            <Monitor className="w-5 h-5 text-blue-500" />
                        )}
                        <span className="font-medium">Theme</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono capitalize">{theme}</span>
                </button>

                {/* Client View Toggle */}
                <button
                    onClick={toggleClientView}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors border ${isClientView
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center space-x-3">
                        {isClientView ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        <span className="font-medium">Client View</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isClientView ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-500'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isClientView ? 'left-[18px]' : 'left-0.5'}`} />
                    </div>
                </button>

                {/* User Profile */}
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors">
                    {(settings?.profilePicture || user?.avatar) ? (
                        <img
                            src={settings?.profilePicture
                                ? (settings.profilePicture.startsWith('http') ? settings.profilePicture : `http://localhost:5000${settings.profilePicture}`)
                                : user?.avatar}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm border border-white dark:border-gray-600">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{settings?.roleBadge || user?.role?.toUpperCase()}</p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
