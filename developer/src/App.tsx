import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DeveloperAuthProvider } from './context/DeveloperAuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import OverviewPage from './pages/OverviewPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import KeysPage from './pages/KeysPage';
import ExplorerPage from './pages/ExplorerPage';
import DocsPage from './pages/DocsPage';
import SdksPage from './pages/SdksPage';
import WebhooksPage from './pages/WebhooksPage';

export default function App() {
  return (
    <DeveloperAuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#050811] text-slate-100">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/keys" element={<KeysPage />} />
              <Route path="/explorer" element={<ExplorerPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/sdks" element={<SdksPage />} />
              <Route path="/webhooks" element={<WebhooksPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </DeveloperAuthProvider>
  );
}
