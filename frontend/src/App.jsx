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
import PurchaseEntry from './pages/PurchaseEntry';
import ExpiryReport from './pages/ExpiryReport';
import LetterheadList from './pages/LetterheadList';
import LetterheadCreator from './pages/LetterheadCreator';
import Expenses from './pages/Expenses';
import Catalog from './pages/Catalog';
import ChartOfAccounts from './components/Accounting/ChartOfAccounts';
import JournalEntry from './components/Accounting/JournalEntry';
import TrialBalance from './components/Reports/TrialBalance';
import ProfitAndLoss from './components/Reports/ProfitAndLoss';
import BalanceSheet from './components/Reports/BalanceSheet';
import AuthorizeView from './components/AuthorizeView';

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

      <Route path="/purchase-entry" element={
        <ProtectedRoute>
          <PurchaseEntry />
        </ProtectedRoute>
      } />

      <Route path="/expiry-report" element={
        <ProtectedRoute>
          <ExpiryReport />
        </ProtectedRoute>
      } />

      <Route path="/daybook" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <Daybook />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/expenses" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <Expenses />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/expenses/:id/ledger" element={
        <ProtectedRoute>
          <SupplierLedger />
        </ProtectedRoute>
      } />


      <Route path="/settings" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin']}>
            <Settings />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/cash-bank" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <Catalog />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/accounting/chart-of-accounts" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <ChartOfAccounts />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/accounting/journal" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <JournalEntry />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/reports/trial-balance" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <TrialBalance />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/reports/profit-loss" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <ProfitAndLoss />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/reports/balance-sheet" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin', 'Accountant']}>
            <BalanceSheet />
          </AuthorizeView>
        </ProtectedRoute>
      } />

      <Route path="/letterheads" element={
        <ProtectedRoute>
          <AuthorizeView roles={['Admin']}>
            <LetterheadList />
          </AuthorizeView>
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
