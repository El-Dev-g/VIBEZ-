'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  Smartphone, 
  Settings, 
  Download, 
  Lock, 
  ArrowRight, 
  CheckCheck, 
  Menu, 
  X,
  Server,
  Key,
  Flame,
  Activity,
  Trash2,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'app' | 'admin'>('app');
  const [typedText, setTypedText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const fullText = "Hey there! Have you tested our new secure calling system?";

  useEffect(() => {
    if (typingIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prev => prev + fullText[typingIndex]);
        setTypingIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      const resetTimeout = setTimeout(() => {
        setTypedText('');
        setTypingIndex(0);
      }, 5000);
      return () => clearTimeout(resetTimeout);
    }
  }, [typingIndex]);

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0b141a]/80 border-b border-[#202c33] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 shadow-lg shadow-[#00a884]/10 flex items-center justify-center">
                <div className="h-full w-full rounded-[10px] bg-[#0b141a] flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-[#00a884]" />
                </div>
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#e9edef] to-[#00a884] bg-clip-text text-transparent">
                VIBEZ
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-[#8696a0] hover:text-[#00a884] transition-colors">Features</a>
              <a href="#preview" className="text-sm font-medium text-[#8696a0] hover:text-[#00a884] transition-colors">Live Preview</a>
              <a href="#architecture" className="text-sm font-medium text-[#8696a0] hover:text-[#00a884] transition-colors">Architecture</a>
              <a href="#admin" className="text-sm font-medium text-[#8696a0] hover:text-[#00a884] transition-colors">Admin Panel</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <a 
                href="https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#202c33] hover:bg-[#202c33] hover:text-white transition-all"
              >
                Launch Console
              </a>
              <a 
                href="#download" 
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00a884] hover:bg-[#008f72] text-white transition-all shadow-md shadow-[#00a884]/20"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-[#202c33] text-[#8696a0] hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111b21] border-b border-[#202c33] py-4 px-4 space-y-3">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              Features
            </a>
            <a 
              href="#preview" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              Live Preview
            </a>
            <a 
              href="#architecture" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              Architecture
            </a>
            <a 
              href="#admin" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              Admin Panel
            </a>
            <div className="pt-4 flex flex-col gap-3 border-t border-[#202c33]">
              <a 
                href="https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-[#202c33] hover:bg-[#202c33] transition-all"
              >
                Launch Console
              </a>
              <a 
                href="#download" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#00a884] hover:bg-[#008f72] text-white transition-all"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Background Decorative Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-[#53bdeb]/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Secure Android Release Available Now
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Connect Intuitively. <br />
                <span className="bg-gradient-to-r from-[#00a884] to-[#53bdeb] bg-clip-text text-transparent">
                  Chat Privately.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#8696a0] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Experience **VIBEZ**, a professional communication ecosystem crafted to deliver high-performance messaging, seamless media exchange, absolute data protection, and unified Google + Phone verification.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="#download" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#00a884] hover:bg-[#008f72] text-white font-semibold shadow-xl shadow-[#00a884]/20 hover:-translate-y-0.5 transition-all"
                >
                  <Download className="h-5 w-5" />
                  Install App APK
                </a>
                <a 
                  href="#preview" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111b21] hover:bg-[#202c33] border border-[#202c33] text-white font-semibold transition-all hover:-translate-y-0.5"
                >
                  Interactive Demo
                  <ArrowRight className="h-5 w-5 text-[#8696a0]" />
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-center lg:text-left border-t border-[#202c33]">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">100%</div>
                  <div className="text-xs text-[#8696a0]">Secure Channels</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">Prisma</div>
                  <div className="text-xs text-[#8696a0]">ORM Persistence</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">M3</div>
                  <div className="text-xs text-[#8696a0]">Material Design</div>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Mobile Preview mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-[310px] h-[620px] rounded-[48px] bg-black p-3.5 border-[6px] border-[#202c33] shadow-2xl shadow-[#00a884]/10 overflow-hidden">
                {/* Speaker Grill / Dynamic Island */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-[#202c33] rounded-full" />
                </div>

                {/* Simulated Screen Body */}
                <div className="h-full w-full bg-[#0b141a] rounded-[36px] flex flex-col justify-between overflow-hidden relative">
                  {/* Mock Screen Header */}
                  <div className="bg-[#111b21] pt-8 pb-3 px-4 border-b border-[#202c33] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-sm text-white">
                        V
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">VIBEZ Support</div>
                        <div className="text-[10px] text-[#00a884] flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-[#00a884] rounded-full animate-pulse" />
                          Online
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[#8696a0]">
                      <span className="text-[10px] bg-[#202c33] px-1.5 py-0.5 rounded text-white">v1.2</span>
                    </div>
                  </div>

                  {/* Mock Chat Canvas */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs bg-[radial-gradient(#111b21_1px,transparent_1px)] [background-size:16px_16px]">
                    
                    {/* Welcome System Note */}
                    <div className="text-center my-2">
                      <span className="bg-[#111b21] text-[#8696a0] text-[9px] px-2.5 py-1 rounded-md border border-[#202c33]">
                        🔒 Messages are securely processed through your private backend
                      </span>
                    </div>

                    {/* Received Message */}
                    <div className="flex justify-start max-w-[85%]">
                      <div className="bg-[#111b21] text-[#e9edef] p-2.5 rounded-r-xl rounded-bl-xl border border-[#202c33] space-y-1">
                        <p>Welcome! Thank you for downloading the VIBEZ production client. Let's configure your profile.</p>
                        <span className="block text-[8px] text-right text-[#8696a0]">11:24 AM</span>
                      </div>
                    </div>

                    {/* Sent Message */}
                    <div className="flex justify-end ml-auto max-w-[85%]">
                      <div className="bg-[#005c4b] text-white p-2.5 rounded-l-xl rounded-br-xl space-y-1 shadow-sm">
                        <p>Perfect! Can I secure my registration with phone SMS verification?</p>
                        <div className="flex items-center justify-end gap-1 text-[8px] text-[#8696a0]">
                          <span>11:25 AM</span>
                          <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                        </div>
                      </div>
                    </div>

                    {/* Typing Animation/Dynamic Input */}
                    {typedText && (
                      <div className="flex justify-start max-w-[85%] animate-fade-in">
                        <div className="bg-[#111b21] text-[#e9edef] p-2.5 rounded-r-xl rounded-bl-xl border border-[#202c33] space-y-1">
                          <p className="border-r-2 border-[#00a884] pr-1">{typedText}</p>
                          <span className="block text-[8px] text-right text-[#8696a0]">Typing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mock Input Bar */}
                  <div className="bg-[#111b21] p-2 border-t border-[#202c33] flex items-center gap-2">
                    <div className="flex-1 bg-[#2a3942] rounded-lg px-3 py-1.5 text-[10px] text-[#8696a0] flex items-center justify-between">
                      <span>Message...</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Engineered for Speed. Built for Integrity.
            </h2>
            <p className="text-base text-[#8696a0]">
              Every module, view, and line of code has been crafted to satisfy high production standards, avoiding mock data loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#00a884]/20 to-emerald-500/10 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dual-Identity Binding</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Binds Google Credentials and Phone SMS verification into a single unified record within your database for absolute validation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#00a884]/20 to-emerald-500/10 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Secure Data Sandbox</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Leverages local Room persistence coupled with secure backend API queries to protect communication threads from external telemetry.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#00a884]/20 to-emerald-500/10 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Server className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real PostgreSQL Engine</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                No mock mockups. Backed by Express, TypeScript, Prisma, and PostgreSQL supporting transaction cascades and instant socket response.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#00a884]/20 to-emerald-500/10 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Edge-to-Edge Design</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Features Material Design 3 guidelines on Android including fluid animations, native window insets, dark mode layouts, and custom icons.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#00a884]/20 to-emerald-500/10 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Manual Build Pipeline</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Features GitHub Action workflows setup with manual dispatch toggles for APK, signed bundles (.aab), backend, or admin dashboards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#00a884]/20 to-emerald-500/10 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Purge Data Cascades</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                GDPR-ready control. Our administrative panel features full database cascades that safely delete chats, messages, and files on user purge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Switchboard: App vs Dashboard */}
      <section id="preview" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <h2 className="text-3xl font-extrabold text-white">Explore the Architecture</h2>
            <p className="text-sm text-[#8696a0]">
              Toggle between the Android Mobile Experience and the Control Administration Center to see how data synchronizes.
            </p>

            {/* Tabs Trigger Switcher */}
            <div className="inline-flex bg-[#111b21] p-1 rounded-xl border border-[#202c33] gap-1">
              <button 
                onClick={() => setActiveTab('app')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'app' ? 'bg-[#00a884] text-white shadow-md' : 'text-[#8696a0] hover:text-white'}`}
              >
                <Smartphone className="h-4 w-4" />
                Android App Client
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'admin' ? 'bg-[#00a884] text-white shadow-md' : 'text-[#8696a0] hover:text-white'}`}
              >
                <Settings className="h-4 w-4" />
                Administrative Panel
              </button>
            </div>
          </div>

          {/* Visual Dynamic Preview Showcase */}
          <div className="bg-[#111b21] rounded-3xl border border-[#202c33] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
            {activeTab === 'app' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00a884] bg-[#00a884]/10 px-3 py-1 rounded-full">
                    Material Design 3 Client
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white">Stunning Native Jetpack Compose Interface</h3>
                  <p className="text-[#8696a0] text-sm leading-relaxed">
                    Designed entirely with Kotlin and Jetpack Compose to follow Material 3 standards. It features smooth sheet transitions, adaptive edge-to-edge screens, a fully-featured country code selector, and custom user avatar generation.
                  </p>
                  
                  <div className="space-y-3.5">
                    {[
                      "Reactive status flags (Typing, Sent, Delivered, Read)",
                      "Local cache validation via Room database architecture",
                      "Dynamic system permission requests with runtime compliance checks",
                      "Optimized light/dark theme schemes matching device preferences"
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-[#e9edef]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 flex justify-center bg-[#0b141a] rounded-2xl p-6 border border-[#202c33] relative">
                  <div className="w-full max-w-md space-y-6">
                    {/* Header bar simulated */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#202c33]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#00a884] to-emerald-500 flex items-center justify-center font-bold text-white">
                          A
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Austin (Developer)</div>
                          <div className="text-xs text-[#00a884]">Linking complete...</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#202c33] px-2 py-0.5 rounded text-[#8696a0]">Connected</span>
                    </div>

                    {/* Step wizard simulation */}
                    <div className="bg-[#111b21] p-4 rounded-xl border border-[#202c33] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#8696a0]">Identity Registration Verification</span>
                        <span className="text-xs text-[#00a884] font-medium">Step 2 of 2</span>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] text-[#8696a0] uppercase tracking-wider font-bold">Verification OTP Code</label>
                        <div className="grid grid-cols-6 gap-2">
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <div key={num} className="h-10 rounded-lg bg-[#0b141a] border border-[#202c33] flex items-center justify-center text-sm font-bold text-[#00a884]">
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-emerald-500/10 border border-[#00a884]/30 text-xs text-[#00a884] flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Phone number bound successfully to your Google account session!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#53bdeb] bg-[#53bdeb]/10 px-3 py-1 rounded-full">
                    Control Center
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white">Administrative Portal Terminal</h3>
                  <p className="text-[#8696a0] text-sm leading-relaxed">
                    Designed with Next.js, featuring a robust, authenticated dashboard that interfaces with backend Prisma schemas. It grants administrators immediate user list insights, system metrics, and secure, cascading account purges.
                  </p>
                  
                  <div className="space-y-3.5">
                    {[
                      "Cascading data purging for secure, structural account cleanup",
                      "Prisma transaction integration preventing orphan database nodes",
                      "Aggregated real-time metrics for connected users and storage charts",
                      "Protected routes using administrative tokens and cookie validation"
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-[#53bdeb]/20 flex items-center justify-center text-[#53bdeb]">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-[#e9edef]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#0b141a] rounded-2xl p-6 border border-[#202c33] space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#202c33]">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#53bdeb]" />
                      <span className="text-sm font-bold text-white">System Monitor</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#53bdeb]/10 text-[#53bdeb] font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-[#53bdeb] rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>

                  {/* Simulated Admin table with user purge */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-[#111b21] p-3 rounded-xl border border-[#202c33]">
                        <div className="text-xs text-[#8696a0]">Total Users</div>
                        <div className="text-xl font-black text-white">1,420</div>
                      </div>
                      <div className="bg-[#111b21] p-3 rounded-xl border border-[#202c33]">
                        <div className="text-xs text-[#8696a0]">Purges</div>
                        <div className="text-xl font-black text-emerald-500">24</div>
                      </div>
                      <div className="bg-[#111b21] p-3 rounded-xl border border-[#202c33]">
                        <div className="text-xs text-[#8696a0]">Database Sockets</div>
                        <div className="text-xl font-black text-[#53bdeb]">Active</div>
                      </div>
                    </div>

                    <div className="bg-[#111b21] rounded-xl border border-[#202c33] overflow-hidden text-xs">
                      <div className="bg-[#202c33] p-2.5 grid grid-cols-12 font-bold text-white text-[10px] uppercase tracking-wider">
                        <div className="col-span-5">User Account</div>
                        <div className="col-span-4">Status</div>
                        <div className="col-span-3 text-right">Admin Controls</div>
                      </div>
                      <div className="p-2.5 grid grid-cols-12 border-b border-[#202c33] items-center">
                        <div className="col-span-5 font-bold text-white">GhanaianTester</div>
                        <div className="col-span-4 text-emerald-500 font-semibold">Verified</div>
                        <div className="col-span-3 text-right">
                          <button className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ml-auto">
                            <Trash2 className="h-3 w-3" />
                            Purge
                          </button>
                        </div>
                      </div>
                      <div className="p-2.5 grid grid-cols-12 items-center">
                        <div className="col-span-5 font-bold text-white">VibezChef</div>
                        <div className="col-span-4 text-yellow-500 font-semibold">Pending Phone</div>
                        <div className="col-span-3 text-right">
                          <button className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ml-auto">
                            <Trash2 className="h-3 w-3" />
                            Purge
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Database & Architecture Layer */}
      <section id="architecture" className="py-20 bg-[#111b21] border-t border-[#202c33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b141a] border border-[#202c33] text-[#00a884] text-xs font-bold">
                <Server className="h-3.5 w-3.5" />
                No Placeholders
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Solid Prisma-Schema PostgreSQL Foundation
              </h2>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                We believe in absolute code integrity. Instead of relying on volatile arrays, memory storage, or mocks, VIBEZ connects directly to a live PostgreSQL relational instance managed via Prisma ORM schemas.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0b141a] p-4 rounded-xl border border-[#202c33]">
                  <div className="text-lg font-bold text-white">Prisma Client</div>
                  <div className="text-xs text-[#8696a0]">Auto-generated database models</div>
                </div>
                <div className="bg-[#0b141a] p-4 rounded-xl border border-[#202c33]">
                  <div className="text-lg font-bold text-white">Full Cascades</div>
                  <div className="text-xs text-[#8696a0]">Safe automatic database cleaning</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0b141a] p-5 rounded-2xl border border-[#202c33] font-mono text-xs overflow-x-auto text-[#00a884] max-h-[400px] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#202c33] text-[#8696a0] mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-[8px]">×</span>
                  <span className="h-3 w-3 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-[8px]">-</span>
                  <span className="h-3 w-3 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-[8px]">+</span>
                  <span className="ml-2 text-[10px]">schema.prisma</span>
                </div>
                <span className="text-[10px] bg-[#111b21] px-2 py-0.5 rounded text-white">Prisma v5.x</span>
              </div>

              <pre className="text-left text-[11px] leading-relaxed text-[#e9edef] opacity-90">
{`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  phone         String?   @unique
  displayName   String?
  avatarUrl     String?
  bio           String?   @default("Available")
  role          String    @default("USER") // ADMIN, USER, CHEF
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Cascading Relations
  messages      Message[] @relation("UserMessages")
  chats         Chat[]    @relation("UserChats")
}

model Chat {
  id        String    @id @default(uuid())
  isGroup   Boolean   @default(false)
  name      String?
  createdAt DateTime  @default(now())
  
  // Relations
  members   User[]    @relation("UserChats")
  messages  Message[] @relation("ChatMessages")
}

model Message {
  id        String   @id @default(uuid())
  text      String
  mediaUrl  String?
  createdAt DateTime @default(now())

  // Relations
  senderId  String
  sender    User     @relation("UserMessages", fields: [senderId], onDelete: Cascade)
  chatId    String
  chat      Chat     @relation("ChatMessages", fields: [chatId], onDelete: Cascade)
}`}
              </pre>
            </div>

          </div>
        </div>
      </section>

      {/* APK Installation / Downloads Section */}
      <section id="download" className="py-24 relative overflow-hidden">
        {/* Background Decorative Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00a884]/10 to-[#53bdeb]/10 blur-[130px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex h-16 w-16 rounded-3xl bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 shadow-xl shadow-[#00a884]/20 items-center justify-center mx-auto mb-4">
            <div className="h-full w-full rounded-[22px] bg-[#0b141a] flex items-center justify-center">
              <Download className="h-8 w-8 text-[#00a884]" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Download the Stable Android Package
          </h2>
          <p className="text-base text-[#8696a0] max-w-2xl mx-auto leading-relaxed">
            Get the production client directly onto your mobile device or emulator. Features absolute local speed and Material Design compliance.
          </p>

          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] max-w-lg mx-auto space-y-4 text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-[#00a884]" />
              Android Verification Signatures
            </h4>
            <div className="space-y-3 text-xs text-[#8696a0]">
              <div className="flex justify-between border-b border-[#202c33] pb-2">
                <span>File Name:</span>
                <span className="font-mono text-white font-semibold">app-debug.apk / app-release.apk</span>
              </div>
              <div className="flex justify-between border-b border-[#202c33] pb-2">
                <span>Minimum OS:</span>
                <span className="font-mono text-white font-semibold">Android 8.0 (API Level 26)</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Signature Checksum:</span>
                <span className="font-mono text-white font-semibold">SHA-256 Verified</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a 
              href="https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app"
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full text-center px-6 py-4 rounded-xl bg-[#00a884] hover:bg-[#008f72] text-white font-bold shadow-xl shadow-[#00a884]/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Download APK Directly
            </a>
          </div>
        </div>
      </section>

      {/* Elegant Professional Footer */}
      <footer className="bg-[#0b141a] border-t border-[#202c33] py-12 text-xs text-[#8696a0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 flex items-center justify-center">
                <div className="h-full w-full rounded-[6px] bg-[#0b141a] flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-[#00a884]" />
                </div>
              </div>
              <span className="text-sm font-black tracking-tight text-white">VIBEZ</span>
            </div>

            <p className="text-center md:text-right">
              &copy; 2026 VIBEZ. All rights reserved. Secure Communication Sandbox Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
