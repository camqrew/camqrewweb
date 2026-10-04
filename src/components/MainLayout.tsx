import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CursorBackgroundFollower } from './CursorBackgroundFollower';
import { GlobalRealtimeAlerts } from './GlobalRealtimeAlerts';
import { MobileTabBar } from './MobileTabBar';

interface MainLayoutProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ theme, toggleTheme }) => {
  return (
    <div className="main-site-wrapper">
      <CursorBackgroundFollower />
      <GlobalRealtimeAlerts />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="main-site-content">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
};
