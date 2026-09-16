import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { Layout as AdminLayout } from './components/Layout';

// Public & Customer / Creator Pages
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import BookingPage from './pages/BookingPage';
import CreateJobPage from './pages/CreateJobPage';
import JobReviewPage from './pages/JobReviewPage';
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailPage from './pages/ProductDetailPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';

// Admin Portal Pages
import Dashboard from './pages/Dashboard';
import Verifications from './pages/Verifications';
import Inventory from './pages/Inventory';
import Disputes from './pages/Disputes';
import Subscriptions from './pages/Subscriptions';
import Orders from './pages/Orders';

import { useAuthStore } from './store/authStore';
import { supabase } from './api/supabaseClient';
import './index.css';
import './App.css';

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
      <Routes>
        {/* Main Website & User Portal Routes */}
        <Route element={<MainLayout theme={theme} toggleTheme={toggleTheme} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/creators/:id" element={<CreatorProfilePage />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/jobs/create" element={<CreateJobPage />} />
          <Route path="/jobs/review/:id" element={<JobReviewPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<Navigate to="/marketplace?tab=cart" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
        </Route>

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
    </BrowserRouter>
  );
}

export default App;
