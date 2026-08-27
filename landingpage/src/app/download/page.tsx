'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  Settings, 
  AlertTriangle,
  Layers,
  Cpu,
  Clock,
  Check,
  XCircle,
  Info,
  ChevronDown,
  RefreshCw,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';
import { useLanguage, LanguageSelector } from '../../lib/LanguageContext';

interface AndroidVersionInfo {
  version: string;
  name: string;
  apiLevel: number;
  year: string;
  supported: boolean;
  tier: 'optimal' | 'great' | 'standard' | 'unsupported';
  notes: string;
}

const ANDROID_VERSIONS: AndroidVersionInfo[] = [
  { version: '15.0', name: 'Android 15 (Vanilla Ice Cream)', apiLevel: 35, year: '2024', supported: true, tier: 'optimal', notes: 'Latest Android release. Full hardware acceleration and maximum privacy sandboxing.' },
  { version: '14.0', name: 'Android 14 (Upside Down Cake)', apiLevel: 34, year: '2023', supported: true, tier: 'optimal', notes: 'Optimal performance. Full support for predictive back animations and ultra HD media.' },
  { version: '13.0', name: 'Android 13 (Tiramisu)', apiLevel: 33, year: '2022', supported: true, tier: 'optimal', notes: 'Optimal performance. Granular media permissions and per-app language settings.' },
  { version: '12.0', name: 'Android 12 / 12L (Snow Cone)', apiLevel: 31, year: '2021', supported: true, tier: 'great', notes: 'Great performance. Material You dynamic theming and microphone/camera indicators.' },
  { version: '11.0', name: 'Android 11 (Red Velvet Cake)', apiLevel: 30, year: '2020', supported: true, tier: 'great', notes: 'Great performance. Dedicated chat bubbles and one-time permission controls.' },
  { version: '10.0', name: 'Android 10 (Queen Cake / Q)', apiLevel: 29, year: '2019', supported: true, tier: 'great', notes: 'Great performance. System-wide dark theme and gesture navigation.' },
  { version: '9.0', name: 'Android 9.0 (Pie)', apiLevel: 28, year: '2018', supported: true, tier: 'standard', notes: 'Standard performance. Adaptive battery management and full WebRTC calling.' },
  { version: '8.1', name: 'Android 8.1 (Oreo MR1)', apiLevel: 27, year: '2017', supported: true, tier: 'standard', notes: 'Minimum officially supported release. All messaging and calling features fully enabled.' },
  { version: '8.0', name: 'Android 8.0 (Oreo)', apiLevel: 26, year: '2017', supported: true, tier: 'standard', notes: 'Minimum officially supported release (API 26). Notification channels & background limits.' },
  { version: '7.1', name: 'Android 7.1 (Nougat)', apiLevel: 25, year: '2016', supported: false, tier: 'unsupported', notes: 'Below minimum requirement (API 26 required). System security and TLS 1.3 limitations.' },
  { version: '7.0', name: 'Android 7.0 (Nougat)', apiLevel: 24, year: '2016', supported: false, tier: 'unsupported', notes: 'Below minimum requirement. Does not meet modern cryptography and runtime standards.' },
  { version: '6.0', name: 'Android 6.0 (Marshmallow)', apiLevel: 23, year: '2015', supported: false, tier: 'unsupported', notes: 'Below minimum requirement. Legacy Android runtime.' },
  { version: '5.1', name: 'Android 5.1 (Lollipop)', apiLevel: 22, year: '2015', supported: false, tier: 'unsupported', notes: 'Below minimum requirement. Legacy Android runtime.' },
];

export default function DownloadPage() {
  const { t, language } = useLanguage();
  const [config, setConfig] = useState<PublicAppConfig>({
    appName: 'VIBEZ',
    appVersion: '1.0.0',
    appDownloadUrl: '',
    contactEmail: 'support@vibez.chat',
    contactPhone: '+1 (800) 555-0199',
    supportAddress: 'San Francisco, CA, USA',
    maintenanceMode: false,
    allowNewRegistrations: true
  });

  const [selectedVersion, setSelectedVersion] = useState<string>('14.0');
  const [detectedOS, setDetectedOS] = useState<string | null>(null);
  const [showHowToFind, setShowHowToFind] = useState<boolean>(false);

  useEffect(() => {
    fetchPublicAppConfig().then(data => {
      if (data) setConfig(data);
    });

    // Auto-detect browser/client user agent
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const match = ua.match(/Android\s([0-9.]+)/);
      if (match && match[1]) {
        const major = parseFloat(match[1]);
        setDetectedOS(`Android ${match[1]}`);
        const found = ANDROID_VERSIONS.find(v => parseFloat(v.version) === Math.floor(major) || v.version === match[1]);
        if (found) {
          setSelectedVersion(found.version);
        } else if (major >= 8.0) {
          setSelectedVersion('14.0');
        }
      }
    }
  }, []);

  // Determine active download target - No static fallback, strictly respect admin configuration
  const hasDownloadUrl = Boolean(config.appDownloadUrl && config.appDownloadUrl.trim() !== '');
  const downloadLink = hasDownloadUrl ? config.appDownloadUrl : '';

  const currentInfo = ANDROID_VERSIONS.find(v => v.version === selectedVersion) || ANDROID_VERSIONS[1];

  const handleAutoDetect = () => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const match = ua.match(/Android\s([0-9.]+)/);
      if (match && match[1]) {
        const major = parseFloat(match[1]);
        setDetectedOS(`Android ${match[1]}`);
        const found = ANDROID_VERSIONS.find(v => parseFloat(v.version) === Math.floor(major) || v.version === match[1]);
        if (found) {
          setSelectedVersion(found.version);
        } else {
          setSelectedVersion('14.0');
        }
      } else {
        setDetectedOS('Non-Android Device (Desktop or iOS browser)');
      }
    }
  };

  return (
    <div className="bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      
      {/* Hero Download Card */}
      <section className="relative pt-14 pb-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <Sparkles className="h-4 w-4" />
            {t('download.badge')}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {t('download.title')} <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              Android Smartphone & Tablet
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8696a0] leading-relaxed max-w-2xl mx-auto">
            {t('download.subtitle')}
          </p>

          {/* Download Box */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="bg-[#111b21] p-8 rounded-3xl border-2 border-[#00a884]/40 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between text-left border-b border-[#202c33] pb-5">
                <div>
                  <div className="text-xs text-[#8696a0] font-medium">{t('download.packageVersion')}</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{config.appName} APK</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884]">{config.appVersion || 'v1.0.0'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8696a0] font-medium">{t('download.platform')}</div>
                  <div className="text-sm font-bold text-[#53bdeb]">Android 8.0+</div>
                </div>
              </div>

              {/* Download Action Area */}
              {hasDownloadUrl ? (
                <a 
                  href={downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download-pulse w-full py-4 px-8 rounded-2xl bg-[#00a884] text-white font-black text-base shadow-xl shadow-[#00a884]/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Download className="h-5 w-5" />
                  {t('download.downloadBtn')}
                </a>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#0b141a] border border-amber-500/30 flex items-start gap-3 text-left">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-amber-300">
                        {t('download.apkPendingTitle')}
                      </div>
                      <p className="text-[#8696a0] leading-relaxed">
                        {t('download.apkPendingDesc')}
                      </p>
                    </div>
                  </div>
                  <button 
                    disabled
                    className="w-full py-4 px-8 rounded-2xl bg-[#202c33] border border-[#2a3942] text-[#8696a0] font-bold text-base cursor-not-allowed flex items-center justify-center gap-2.5 opacity-80"
                  >
                    <Clock className="h-5 w-5 text-amber-400" />
                    {t('download.noAppAvailable')}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-6 text-[11px] text-[#8696a0]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#00a884]" />
                  <span>{t('download.virusFree')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#00a884]" />
                  <span>{t('download.verifiedBinary')}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Android Device Compatibility Checker Utility Card */}
      <section className="py-12 bg-gradient-to-b from-[#0b141a] via-[#111b21]/70 to-[#0b141a] border-t border-[#202c33]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-[#111b21] border border-[#202c33] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#00a884]/10 blur-[100px] pointer-events-none -z-0" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202c33] pb-5 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a884] uppercase tracking-wider">
                  <Activity className="h-3.5 w-3.5" />
                  {t('download.compatibilityTitle')}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {t('download.compatibilityMainTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-[#8696a0]">
                  {t('download.compatibilitySubtitle', { appName: config.appName })}
                </p>
              </div>

              {/* Auto detect button */}
              <button
                onClick={handleAutoDetect}
                className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-xs font-semibold text-white border border-[#2a3942] transition-colors"
                title="Detect device OS from browser"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#00a884]" />
                {t('download.autoDetectBtn')}
              </button>
            </div>

            {/* Selector Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-10">
              <div className="sm:col-span-8 space-y-1.5">
                <label className="block text-xs font-semibold text-[#8696a0]">
                  {t('download.selectOsLabel')}
                </label>
                <div className="relative">
                  <select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    className="w-full bg-[#0b141a] border border-[#202c33] focus:border-[#00a884] text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none transition-colors cursor-pointer"
                  >
                    {ANDROID_VERSIONS.map((v) => (
                      <option key={v.version} value={v.version} className="bg-[#111b21] text-white">
                        {v.name} (API {v.apiLevel}, {v.year}) {v.supported ? '✓ Supported' : '✕ Unsupported'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0] pointer-events-none" />
                </div>
              </div>

              <div className="sm:col-span-4 bg-[#0b141a] p-3 rounded-xl border border-[#202c33] text-center space-y-1">
                <div className="text-[10px] text-[#8696a0] uppercase font-bold tracking-wider">
                  {t('download.minRequired')}
                </div>
                <div className="text-sm font-black text-[#00a884]">
                  Android 8.0 (API 26)
                </div>
                <div className="text-[10px] text-[#8696a0]">
                  {t('download.minYear')}
                </div>
              </div>
            </div>

            {/* Detected device badge notification if detected */}
            {detectedOS && (
              <div className="p-3 rounded-xl bg-[#0b141a]/90 border border-[#202c33] flex items-center justify-between text-xs text-[#8696a0]">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-[#53bdeb]" />
                  <span>{t('download.detectedOS')} <strong className="text-white">{detectedOS}</strong></span>
                </div>
                <span className="text-[11px] text-[#00a884] font-semibold">{t('download.matched')}</span>
              </div>
            )}

            {/* Compatibility Result Card */}
            <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              currentInfo.supported 
                ? 'bg-gradient-to-r from-[#00a884]/10 via-[#111b21] to-[#53bdeb]/10 border-[#00a884]/40' 
                : 'bg-gradient-to-r from-red-500/10 via-[#111b21] to-amber-500/10 border-red-500/40'
            }`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    currentInfo.supported ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {currentInfo.supported ? <Check className="h-6 w-6 stroke-[3]" /> : <XCircle className="h-6 w-6 stroke-[2.5]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{currentInfo.name}</h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        currentInfo.supported 
                          ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}>
                        {currentInfo.supported ? t('download.compatibleLabel') : t('download.unsupportedLabel')}
                      </span>
                    </div>
                    <p className="text-xs text-[#8696a0] mt-1">{currentInfo.notes}</p>
                  </div>
                </div>

                {currentInfo.supported ? (
                  hasDownloadUrl ? (
                    <a
                      href={downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download-pulse shrink-0 self-start sm:self-center px-4 py-2.5 rounded-xl bg-[#00a884] text-white text-xs font-bold shadow-lg shadow-[#00a884]/20 flex items-center gap-2 active:scale-95"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t('download.downloadBtn')}
                    </a>
                  ) : (
                    <div className="shrink-0 self-start sm:self-center px-3.5 py-2 rounded-xl bg-[#202c33] border border-[#2a3942] text-[#8696a0] text-xs font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      {t('download.unavailable')}
                    </div>
                  )
                ) : (
                  <div className="shrink-0 self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('download.upgradeNeeded')}
                  </div>
                )}
              </div>

              {/* Requirement Matrix Breakdown */}
              <div className="mt-5 pt-4 border-t border-[#202c33] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#0b141a]/60 p-2.5 rounded-xl border border-[#202c33]">
                  <div className="text-[10px] text-[#8696a0]">{t('download.webrtc')}</div>
                  <div className={`font-bold flex items-center gap-1 mt-0.5 ${currentInfo.supported ? 'text-[#00a884]' : 'text-red-400'}`}>
                    {currentInfo.supported ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {currentInfo.supported ? t('download.supported') : t('download.unavailable')}
                  </div>
                </div>

                <div className="bg-[#0b141a]/60 p-2.5 rounded-xl border border-[#202c33]">
                  <div className="text-[10px] text-[#8696a0]">{t('download.instantChat')}</div>
                  <div className={`font-bold flex items-center gap-1 mt-0.5 ${currentInfo.supported ? 'text-[#00a884]' : 'text-red-400'}`}>
                    {currentInfo.supported ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {currentInfo.supported ? t('download.supported') : t('download.unavailable')}
                  </div>
                </div>

                <div className="bg-[#0b141a]/60 p-2.5 rounded-xl border border-[#202c33]">
                  <div className="text-[10px] text-[#8696a0]">{t('download.pushNotifications')}</div>
                  <div className={`font-bold flex items-center gap-1 mt-0.5 ${currentInfo.supported ? 'text-[#00a884]' : 'text-red-400'}`}>
                    {currentInfo.supported ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {currentInfo.supported ? t('download.supported') : t('download.unavailable')}
                  </div>
                </div>

                <div className="bg-[#0b141a]/60 p-2.5 rounded-xl border border-[#202c33]">
                  <div className="text-[10px] text-[#8696a0]">{t('download.securityProtocols')}</div>
                  <div className={`font-bold flex items-center gap-1 mt-0.5 ${currentInfo.supported ? 'text-[#00a884]' : 'text-red-400'}`}>
                    {currentInfo.supported ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {currentInfo.supported ? 'TLS 1.3 / AES' : t('download.unavailable')}
                  </div>
                </div>
              </div>

            </div>

            {/* Helper: How to find your Android version */}
            <div className="border border-[#202c33] rounded-2xl overflow-hidden bg-[#0b141a]">
              <button
                onClick={() => setShowHowToFind(!showHowToFind)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-white hover:bg-[#111b21] transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#53bdeb]" />
                  <span>{t('download.howToFindQ')}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#8696a0] transition-transform ${showHowToFind ? 'rotate-180 text-[#00a884]' : ''}`} />
              </button>

              {showHowToFind && (
                <div className="px-4 pb-4 pt-1 text-xs text-[#8696a0] space-y-2 border-t border-[#202c33]/50">
                  <div className="space-y-1.5 pl-1 leading-relaxed">
                    <p dangerouslySetInnerHTML={{ __html: t('download.howToFindStep1') }} />
                    <p dangerouslySetInnerHTML={{ __html: t('download.howToFindStep2') }} />
                    <p dangerouslySetInnerHTML={{ __html: t('download.howToFindStep3') }} />
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 3 Step Installation Guide */}
      <section className="py-16 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white">
              {t('download.howToInstallTitle')}
            </h2>
            <p className="text-sm text-[#8696a0]">
              {t('download.howToInstallSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-[#00a884] text-white font-black flex items-center justify-center text-base">
                1
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('download.step1Title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                {t('download.step1Desc')}
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-[#53bdeb] text-white font-black flex items-center justify-center text-base">
                2
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('download.step2Title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                {t('download.step2Desc')}
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-base">
                3
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('download.step3Title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                {t('download.step3Desc', { appName: config.appName })}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">
          {t('download.requirements')}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Smartphone className="h-6 w-6 text-[#00a884]" />
            <div className="text-xs text-[#8696a0]">{t('download.platform')}</div>
            <div className="text-sm font-bold text-white">Android 8.0 (Oreo) +</div>
          </div>

          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Cpu className="h-6 w-6 text-[#53bdeb]" />
            <div className="text-xs text-[#8696a0]">{t('download.processor')}</div>
            <div className="text-sm font-bold text-white">ARM64, ARMv7, x86_64</div>
          </div>

          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Layers className="h-6 w-6 text-purple-400" />
            <div className="text-xs text-[#8696a0]">{t('download.ram')}</div>
            <div className="text-sm font-bold text-white">1 GB RAM (2 GB rec.)</div>
          </div>

          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Clock className="h-6 w-6 text-amber-400" />
            <div className="text-xs text-[#8696a0]">{t('download.storage')}</div>
            <div className="text-sm font-bold text-white">~45 MB {t('download.unavailable') === 'Unavailable' ? 'free space' : ''}</div>
          </div>
        </div>
      </section>

    </div>
  );
}

