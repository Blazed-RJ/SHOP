import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthorizeView = ({ children, roles }) => {
    const { user } = useAuth();

    // Wait for auth check to complete (if loading state exists in context)
    // But since ProtectedRoute handles loading, user should be populated if authenticated.

    if (!user) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AuthorizeView;
