/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';

const ClientViewContext = createContext();

export const useClientView = () => useContext(ClientViewContext);

export const ClientViewProvider = ({ children }) => {
    const [isClientView, setIsClientView] = useState(() => {
        const saved = localStorage.getItem('clientView');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('clientView', isClientView);
    }, [isClientView]);

    const toggleClientView = () => {
        setIsClientView(prev => !prev);
    };

    return (
        <ClientViewContext.Provider value={{ isClientView, toggleClientView }}>
            {children}
        </ClientViewContext.Provider>
    );
};
