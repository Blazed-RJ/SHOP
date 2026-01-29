import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;
