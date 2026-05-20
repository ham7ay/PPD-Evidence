import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Loading from './components/Loading';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Locker from './pages/Locker';
import Treasury from './pages/Treasury';
import Reports from './pages/Reports';
import History from './pages/History';
import Admin from './pages/Admin';
import PendingApproval from './pages/PendingApproval';

function Protected({ children, adminOnly = false }) {
  const { firebaseUser, user, isAdmin, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading label="INITIALIZING"/></div>;
  if (!firebaseUser) return <Navigate to="/login" state={{ from: loc }} replace />;

  // Block any access for users who are not approved (admins are always approved).
  const approved = user?.status === 'approved' || user?.role === 'admin';
  if (!approved) return <PendingApproval />;

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex relative">
      <div className="scanline" />
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen relative">
        {children}
      </main>
    </div>
  );
}

function AuthedRoutes() {
  return (
    <Shell>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/locker"    element={<Locker />} />
        <Route path="/treasury"  element={<Protected adminOnly><Treasury /></Protected>} />
        <Route path="/reports"   element={<Reports />} />
        <Route path="/history"   element={<History />} />
        <Route path="/admin"     element={<Protected adminOnly><Admin /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function Root() {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading label="INITIALIZING"/></div>;

  return (
    <Routes>
      <Route path="/login" element={firebaseUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<Protected><AuthedRoutes /></Protected>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Root />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#070d1f',
              color: '#e2e8f0',
              border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: 4,
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.05em',
            },
            success: { iconTheme: { primary: '#f5c518', secondary: '#040814' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#040814' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}