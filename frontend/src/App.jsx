import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { ClientViewProvider } from './context/ClientViewContext.jsx';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import InvoiceCreator from './pages/InvoiceCreator';
import InvoiceView from './pages/InvoiceView';
import InvoiceHistory from './pages/InvoiceHistory';
import Customers from './pages/Customers';
import CustomerLedger from './pages/CustomerLedger';
import Suppliers from './pages/Suppliers';
import SupplierLedger from './pages/SupplierLedger';
import Daybook from './pages/Daybook';
import Settings from './pages/Settings';
import LetterheadList from './pages/LetterheadList';
import LetterheadCreator from './pages/LetterheadCreator';
import Expenses from './pages/Expenses';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// App Routes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes - Uncomment as pages are created */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      } />

      <Route path="/invoice/new" element={
        <ProtectedRoute>
          <InvoiceCreator />
        </ProtectedRoute>
      } />

      <Route path="/invoice/:id" element={
        <ProtectedRoute>
          <InvoiceView />
        </ProtectedRoute>
      } />

      {/* Public Route for Sharing */}
      <Route path="/share/invoice/:id" element={<InvoiceView isPublic={true} />} />
      <Route path="/share/customer/:id/ledger" element={<CustomerLedger isPublic={true} />} />
      <Route path="/share/supplier/:id/ledger" element={<SupplierLedger isPublic={true} />} />

      <Route path="/invoices" element={
        <ProtectedRoute>
          <InvoiceHistory />
        </ProtectedRoute>
      } />

      <Route path="/customers" element={
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      } />

      <Route path="/customers/:id/ledger" element={
        <ProtectedRoute>
          <CustomerLedger />
        </ProtectedRoute>
      } />

      <Route path="/suppliers" element={
        <ProtectedRoute>
          <Suppliers />
        </ProtectedRoute>
      } />

      <Route path="/suppliers/:id/ledger" element={
        <ProtectedRoute>
          <SupplierLedger />
        </ProtectedRoute>
      } />

      <Route path="/daybook" element={
        <ProtectedRoute>
          <Daybook />
        </ProtectedRoute>
      } />

      <Route path="/expenses" element={
        <ProtectedRoute>
          <Expenses />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/letterheads" element={
        <ProtectedRoute>
          <LetterheadList />
        </ProtectedRoute>
      } />

      <Route path="/letterheads/create" element={
        <ProtectedRoute>
          <LetterheadCreator />
        </ProtectedRoute>
      } />

      <Route path="/letterheads/edit/:id" element={
        <ProtectedRoute>
          <LetterheadCreator />
        </ProtectedRoute>
      } />

      <Route path="/letterheads/view/:id" element={
        <ProtectedRoute>
          <LetterheadCreator />
        </ProtectedRoute>
      } />

      {/* Redirect root to dashboard if authenticated, else login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <ClientViewProvider>
              <Toaster position="top-right" />
              <AppRoutes />
            </ClientViewProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
