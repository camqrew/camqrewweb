import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';

// Immediate Homepage load for zero-delay First Contentful Paint
import HomePage from './pages/HomePage';

// Route-based code-splitting: Lazy-load subpages on demand
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const CityLandingPage = lazy(() => import('./pages/CityLandingPage'));
const CreatorProfilePage = lazy(() => import('./pages/CreatorProfilePage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const CreateJobPage = lazy(() => import('./pages/CreateJobPage'));
const JobReviewPage = lazy(() => import('./pages/JobReviewPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const ReelsFeedPage = lazy(() => import('./pages/ReelsFeedPage'));

// Admin Backoffice Pages (isolated into separate lazy chunks)
const AdminLayout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Verifications = lazy(() => import('./pages/Verifications'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Disputes = lazy(() => import('./pages/Disputes'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Orders = lazy(() => import('./pages/Orders'));
const Login = lazy(() => import('./pages/Login'));

import { useAuthStore } from './store/authStore';
import { supabase } from './api/supabaseClient';
import { ScrollToTop } from './components/ScrollToTop';
import './index.css';
import './App.css';

const RouteLoadingFallback = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  }}>
    <div style={{
      width: 34,
      height: 34,
      borderRadius: '50%',
      border: '3px solid rgba(63, 182, 104, 0.2)',
      borderTopColor: 'var(--accent, #3fb668)',
      animation: 'spin 0.7s linear infinite',
    }} />
  </div>
);

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { loadAuth } = useAuthStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    loadAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadAuth();
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [loadAuth]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Main Website & User Portal Routes */}
          <Route element={<MainLayout theme={theme} toggleTheme={toggleTheme} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/crews/:city" element={<CityLandingPage />} />
            <Route path="/city/:city" element={<CityLandingPage />} />
            <Route path="/reels" element={<ReelsFeedPage />} />
            <Route path="/showcase" element={<Navigate to="/reels" replace />} />
            <Route path="/creators/:id" element={<CreatorProfilePage />} />
            <Route path="/creators/:id/services/:serviceId" element={<ServiceDetailPage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/services/:creatorId/:serviceId" element={<ServiceDetailPage />} />
            <Route path="/book/:id" element={<BookingPage />} />
            <Route path="/jobs/create" element={<CreateJobPage />} />
            <Route path="/jobs/review/:id" element={<JobReviewPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<Navigate to="/marketplace?tab=cart" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pro/dashboard" element={<Navigate to="/dashboard?tab=overview" replace />} />
            <Route path="/pro-dashboard" element={<Navigate to="/dashboard?tab=overview" replace />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/terms" element={<LegalPage />} />
            <Route path="/privacy" element={<LegalPage />} />
          </Route>

          {/* Admin Portal Auth */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin Backoffice Portal Routes */}
          <Route path="/admin" element={<AdminLayout theme={theme} toggleTheme={toggleTheme} />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="verifications" element={<Verifications />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="orders" element={<Orders />} />
            <Route path="disputes" element={<Disputes />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
