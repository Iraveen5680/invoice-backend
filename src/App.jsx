import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import Dashboard from '@/pages/Dashboard';
import Invoices from '@/pages/Invoices';
import CreateInvoice from '@/pages/CreateInvoice';
import EditInvoice from '@/pages/EditInvoice';
import Customers from '@/pages/Customers';
import Parties from '@/pages/Parties';
import Products from '@/pages/Products';
import Payments from '@/pages/Payments';
import Expenses from '@/pages/Expenses';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import AuthPage from '@/pages/AuthPage';
import Spinner from '@/components/Spinner';
import { Toaster as SonnerToaster } from 'sonner';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background"><Spinner /></div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return children;
};

import { ThemeProvider } from '@/components/theme-provider';

function App() {
  const { user, loading, companyProfile } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background"><Spinner /></div>;
  }

  const siteName = companyProfile?.site_name || 'Invoice Management';
  const faviconUrl = companyProfile?.favicon_url;

  return (
    <ThemeProvider defaultTheme="light" storageKey="invoice-theme">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Helmet
          defaultTitle={siteName}
          titleTemplate={`%s | ${siteName}`}
        >
          {faviconUrl && <link rel="icon" type="image/png" href={faviconUrl} />}
        </Helmet>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
            <Route path="/invoices/new" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
            <Route path="/invoices/edit/:id" element={<PrivateRoute><EditInvoice /></PrivateRoute>} />
            <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
            <Route path="/parties" element={<PrivateRoute><Parties /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
            <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          </Routes>
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;