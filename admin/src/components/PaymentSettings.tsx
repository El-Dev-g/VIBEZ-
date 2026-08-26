'use client';

import React, { useState, useEffect } from 'react';
import { fetchPaymentProviders, updatePaymentProvider, testPaymentCredentials, PaymentProvider } from '@/services/api';

export default function PaymentSettings() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testFeedback, setTestFeedback] = useState<Record<string, { success: boolean; message: string; timestamp: string }>>({});
  const [formConfig, setFormConfig] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const showToast = (text: string, isError = false) => {
    setNotification({ text, isError });
    setTimeout(() => setNotification(null), 4500);
  };

  const loadProviders = async () => {
    setLoading(true);
    const data = await fetchPaymentProviders();
    setProviders(data || []);
    
    // Initialize form configurations from fetched data
    const initialConfigs: Record<string, any> = {};
    (data || []).forEach(p => {
      initialConfigs[p.id] = { ...(p.config || {}) };
    });
    setFormConfig(initialConfigs);
    setLoading(false);
  };

  const isProviderConfigured = (provider: PaymentProvider): boolean => {
    const cfg = formConfig[provider.id] || provider.config || {};
    if (provider.name === 'STRIPE') {
      return !!(cfg.publicKey?.trim() && cfg.secretKey?.trim());
    } else if (provider.name === 'PAYPAL') {
      return !!(cfg.clientId?.trim() && cfg.clientSecret?.trim());
    } else if (provider.name === 'PAYSTACK') {
      return !!(cfg.publicKey?.trim() && cfg.secretKey?.trim());
    } else if (provider.name === 'FLUTTERWAVE') {
      return !!(cfg.publicKey?.trim() && cfg.secretKey?.trim());
    } else if (provider.name === 'RAZORPAY') {
      return !!(cfg.keyId?.trim() && cfg.keySecret?.trim());
    }
    return false;
  };

  const handleConfigChange = (providerId: string, field: string, value: string) => {
    setFormConfig(prev => ({
      ...prev,
      [providerId]: {
        ...(prev[providerId] || {}),
        [field]: value
      }
    }));
  };

  const toggleSecretVisibility = (fieldKey: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleTestCredentials = async (provider: PaymentProvider) => {
    setTesting(provider.id);
    const currentConfig = formConfig[provider.id] || provider.config || {};

    if (!isProviderConfigured(provider)) {
      showToast(`Please input all required ${provider.name} credentials before testing.`, true);
      setTesting(null);
      return;
    }

    const result = await testPaymentCredentials(provider.id, provider.name, currentConfig);
    setTesting(null);

    if (result.success) {
      const msg = result.message || `${provider.name} API connection verified successfully!`;
      setTestFeedback(prev => ({
        ...prev,
        [provider.id]: {
          success: true,
          message: msg,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      showToast(msg, false);
      // Reload providers to update status badges
      const refreshed = await fetchPaymentProviders();
      setProviders(refreshed || []);
    } else {
      const errMsg = result.error || `Verification failed: Unable to validate ${provider.name} credentials.`;
      setTestFeedback(prev => ({
        ...prev,
        [provider.id]: {
          success: false,
          message: errMsg,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      showToast(errMsg, true);
    }
  };

  const handleSaveCredentials = async (provider: PaymentProvider) => {
    setSaving(provider.id);
    const currentConfig = formConfig[provider.id] || {};
    const res = await updatePaymentProvider(provider.id, { config: currentConfig });
    setSaving(null);

    if (res.provider) {
      showToast(`${provider.name} credentials saved securely.`, false);
      setProviders(prev => prev.map(p => p.id === res.provider!.id ? res.provider! : p));
      setFormConfig(prev => ({
        ...prev,
        [provider.id]: { ...(res.provider!.config || {}) }
      }));
    } else {
      showToast(res.error || `Failed to save ${provider.name} credentials.`, true);
    }
  };

  const handleToggle = async (provider: PaymentProvider) => {
    const configured = isProviderConfigured(provider);
    
    // Strict Guard: Prevent enabling if keys are not configured
    if (!provider.isEnabled && !configured) {
      showToast(`Cannot enable ${provider.name}. Please configure valid API keys and test credentials first.`, true);
      return;
    }

    setSaving(provider.id);
    const targetState = !provider.isEnabled;
    const currentConfig = formConfig[provider.id] || provider.config || {};

    const res = await updatePaymentProvider(provider.id, {
      isEnabled: targetState,
      config: currentConfig
    });
    setSaving(null);

    if (res.provider) {
      setProviders(prev => prev.map(p => p.id === res.provider!.id ? res.provider! : p));
      showToast(`${provider.name} provider ${targetState ? 'enabled & active' : 'disabled'}.`, false);
    } else {
      showToast(res.error || `Failed to change ${provider.name} status.`, true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-44 bg-slate-900/40 rounded-3xl border border-white/10 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast alert */}
      {notification && (
        <div className={`p-5 rounded-2xl text-sm font-black flex items-center gap-3 transition-all animate-fadeIn ${
          notification.isError 
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/5' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
        }`}>
          <span>{notification.isError ? '⚠️' : '✅'}</span>
          <span>{notification.text}</span>
        </div>
      )}

      {providers.length === 0 && (
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-12 text-center">
          <p className="text-white font-black text-lg">No payment providers initialized.</p>
          <p className="text-slate-400 text-sm mt-2 font-bold">Refreshing system database registry...</p>
        </div>
      )}

      {providers.map(provider => {
        const configured = isProviderConfigured(provider);
        const feedback = testFeedback[provider.id];
        const currentCfg = formConfig[provider.id] || provider.config || {};
        const isCurrentlyTesting = testing === provider.id;
        const isCurrentlySaving = saving === provider.id;

        return (
          <div 
            key={provider.id} 
            className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
              provider.isEnabled 
                ? 'bg-slate-900/90 border-emerald-500/30 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/20' 
                : 'bg-slate-900/60 border-white/10 hover:border-white/20'
            }`}
          >
            {/* Header Header Bar */}
            <div className="p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                  provider.name === 'STRIPE' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                  provider.name === 'PAYPAL' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                  provider.name === 'PAYSTACK' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
                  provider.name === 'FLUTTERWAVE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {provider.name === 'STRIPE' ? 'S' : 
                   provider.name === 'PAYPAL' ? 'P' : 
                   provider.name === 'PAYSTACK' ? 'PS' : 
                   provider.name === 'FLUTTERWAVE' ? 'FW' : 'RZ'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-white tracking-tight">{provider.name}</h3>
                    {configured ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Keys Configured
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        Keys Missing
                      </span>
                    )}

                    {provider.isTested && (
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Manage API keys, webhooks, and live transaction dispatch.
                  </p>
                </div>
              </div>

              {/* Status & Enable Toggle Area */}
              <div className="flex items-center gap-5 self-end sm:self-center">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gateway Status</p>
                  <p className={`text-xs font-black uppercase tracking-wider mt-0.5 ${provider.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {provider.isEnabled ? 'Active in Production' : 'Inactive / Disabled'}
                  </p>
                </div>

                {/* Secure Toggle Button */}
                <div className="relative group">
                  <button
                    onClick={() => handleToggle(provider)}
                    disabled={isCurrentlySaving || (!provider.isEnabled && !configured)}
                    aria-label={`Toggle ${provider.name}`}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none shadow-lg ${
                      provider.isEnabled 
                        ? 'bg-emerald-500 shadow-emerald-500/30' 
                        : configured 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-slate-800 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                        provider.isEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Tooltip explaining disabled state if keys are not configured */}
                  {!provider.isEnabled && !configured && (
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-white/10 shadow-2xl z-20 pointer-events-none">
                      🔒 Keys not configured. Enter valid credentials and test connection before enabling this provider.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Result Banner */}
            {feedback && (
              <div className={`px-7 py-3 text-xs font-bold flex items-center justify-between border-b ${
                feedback.success 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  <span>{feedback.success ? '✅' : '❌'}</span>
                  <span>{feedback.message}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono">Tested at {feedback.timestamp}</span>
              </div>
            )}

            {/* Provider Configuration Fields */}
            <div className="p-7 space-y-6">
              {provider.name === 'STRIPE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Public Key */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      value={currentCfg.publicKey || ''}
                      onChange={(e) => handleConfigChange(provider.id, 'publicKey', e.target.value)}
                      placeholder="pk_test_... or pk_live_..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Secret Key with Masking & Visibility Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Stripe Secret Key (Encrypted & Masked)
                      </label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                        🔒 Key Masked
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets[`${provider.id}_secret`] ? 'text' : 'password'}
                        value={currentCfg.secretKey || ''}
                        onChange={(e) => handleConfigChange(provider.id, 'secretKey', e.target.value)}
                        placeholder="sk_test_... or sk_live_..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(`${provider.id}_secret`)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1"
                        title={showSecrets[`${provider.id}_secret`] ? 'Mask Key' : 'Reveal Key'}
                      >
                        {showSecrets[`${provider.id}_secret`] ? '👁️‍🗨️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {provider.name === 'PAYPAL' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Client ID */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      PayPal Client ID
                    </label>
                    <input
                      type="text"
                      value={currentCfg.clientId || ''}
                      onChange={(e) => handleConfigChange(provider.id, 'clientId', e.target.value)}
                      placeholder="PayPal REST App Client ID"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Client Secret */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        PayPal Client Secret
                      </label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                        🔒 Secret Masked
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets[`${provider.id}_secret`] ? 'text' : 'password'}
                        value={currentCfg.clientSecret || ''}
                        onChange={(e) => handleConfigChange(provider.id, 'clientSecret', e.target.value)}
                        placeholder="PayPal Secret Key"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(`${provider.id}_secret`)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1"
                      >
                        {showSecrets[`${provider.id}_secret`] ? '👁️‍🗨️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                  </div>

                  {/* Mode */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Environment Mode
                    </label>
                    <select
                      value={currentCfg.mode || 'sandbox'}
                      onChange={(e) => handleConfigChange(provider.id, 'mode', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all appearance-none cursor-pointer"
                    >
                      <option value="sandbox" className="bg-slate-900">Sandbox (Test Mode)</option>
                      <option value="live" className="bg-slate-900">Live (Production)</option>
                    </select>
                  </div>
                </div>
              )}

              {provider.name === 'PAYSTACK' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Paystack Public Key</label>
                    <input
                      type="text"
                      value={currentCfg.publicKey || ''}
                      onChange={(e) => handleConfigChange(provider.id, 'publicKey', e.target.value)}
                      placeholder="pk_test_..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Paystack Secret Key</label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">🔒 Masked</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets[`${provider.id}_secret`] ? 'text' : 'password'}
                        value={currentCfg.secretKey || ''}
                        onChange={(e) => handleConfigChange(provider.id, 'secretKey', e.target.value)}
                        placeholder="sk_test_..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(`${provider.id}_secret`)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        {showSecrets[`${provider.id}_secret`] ? '👁️‍🗨️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {provider.name === 'FLUTTERWAVE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Flutterwave Public Key</label>
                    <input
                      type="text"
                      value={currentCfg.publicKey || ''}
                      onChange={(e) => handleConfigChange(provider.id, 'publicKey', e.target.value)}
                      placeholder="FLWPUBK_TEST-..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Flutterwave Secret Key</label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">🔒 Masked</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets[`${provider.id}_secret`] ? 'text' : 'password'}
                        value={currentCfg.secretKey || ''}
                        onChange={(e) => handleConfigChange(provider.id, 'secretKey', e.target.value)}
                        placeholder="FLWSECK_TEST-..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(`${provider.id}_secret`)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        {showSecrets[`${provider.id}_secret`] ? '👁️‍🗨️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {provider.name === 'RAZORPAY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={currentCfg.keyId || ''}
                      onChange={(e) => handleConfigChange(provider.id, 'keyId', e.target.value)}
                      placeholder="rzp_test_..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Razorpay Key Secret</label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">🔒 Masked</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecrets[`${provider.id}_secret`] ? 'text' : 'password'}
                        value={currentCfg.keySecret || ''}
                        onChange={(e) => handleConfigChange(provider.id, 'keySecret', e.target.value)}
                        placeholder="Razorpay Secret"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility(`${provider.id}_secret`)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        {showSecrets[`${provider.id}_secret`] ? '👁️‍🗨️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Test Connection & Save Changes */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <span>ℹ️</span>
                  <span>Credentials are masked and encrypted with high-entropy standards.</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Admin Test Feature */}
                  <button
                    type="button"
                    onClick={() => handleTestCredentials(provider)}
                    disabled={isCurrentlyTesting || isCurrentlySaving}
                    className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 border border-white/10 shadow-lg"
                  >
                    {isCurrentlyTesting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Test Credentials</span>
                      </>
                    )}
                  </button>

                  {/* Save Credentials Button */}
                  <button
                    type="button"
                    onClick={() => handleSaveCredentials(provider)}
                    disabled={isCurrentlySaving || isCurrentlyTesting}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
                  >
                    {isCurrentlySaving ? 'Encrypting & Saving...' : 'Save Keys'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
