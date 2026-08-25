'use client';

import React, { useState, useEffect } from 'react';
import { fetchPaymentProviders, updatePaymentProvider, PaymentProvider } from '@/services/api';

export default function PaymentSettings() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    const data = await fetchPaymentProviders();
    setProviders(data);
    setLoading(false);
  };

  const handleToggle = async (provider: PaymentProvider) => {
    setSaving(provider.id);
    const updated = await updatePaymentProvider(provider.id, { isEnabled: !provider.isEnabled });
    if (updated) {
      setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
    setSaving(null);
  };

  const handleUpdateConfig = async (provider: PaymentProvider, key: string, value: string) => {
    const newConfig = { ...(provider.config || {}), [key]: value };
    setSaving(provider.id);
    const updated = await updatePaymentProvider(provider.id, { config: newConfig });
    if (updated) {
      setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {providers.length === 0 && (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center">
          <p className="text-gray-400 font-bold">No payment providers configured in database.</p>
          <p className="text-gray-500 text-sm mt-2">Check backend initialization scripts.</p>
        </div>
      )}
      
      {providers.map(provider => (
        <div key={provider.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                {provider.name === 'STRIPE' ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.962 10.935c0-1.212.946-1.708 2.457-1.708 1.543 0 2.457.496 2.457 1.708v1.708h-4.914zm0 3.416h4.914v.854c0 1.212-.946 1.708-2.457 1.708-1.543 0-2.457-.496-2.457-1.708v-.854zm1.708-7.691c-2.906 0-4.914 1.543-4.914 4.275v6.832c0 2.732 2.008 4.275 4.914 4.275 2.906 0 4.914-1.543 4.914-4.275v-.854h-2.147v.854c0 1.212-.946 1.708-2.457 1.708-1.543 0-2.457-.496-2.457-1.708V10.935c0-1.212.946-1.708 2.457-1.708 1.543 0 2.457.496 2.457 1.708v.854h2.147v-.854c0-2.732-2.008-4.275-4.914-4.275zM5.147 22.89H3V1.11h2.147v21.78z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{provider.name}</h3>
                <p className="text-xs font-bold text-gray-500">Configure your {provider.name.toLowerCase()} integration credentials.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {saving === provider.id && (
                <span className="text-xs font-bold text-emerald-500 animate-pulse">Saving...</span>
              )}
              <button
                onClick={() => handleToggle(provider)}
                disabled={saving === provider.id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  provider.isEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    provider.isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-white/[0.02] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {provider.name === 'STRIPE' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Public Key</label>
                    <input
                      type="text"
                      value={provider.config?.publicKey || ''}
                      onChange={(e) => handleUpdateConfig(provider, 'publicKey', e.target.value)}
                      placeholder="pk_test_..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Secret Key</label>
                    <input
                      type="password"
                      value={provider.config?.secretKey || ''}
                      onChange={(e) => handleUpdateConfig(provider, 'secretKey', e.target.value)}
                      placeholder="sk_test_..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </>
              ) : provider.name === 'PAYPAL' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Client ID</label>
                    <input
                      type="text"
                      value={provider.config?.clientId || ''}
                      onChange={(e) => handleUpdateConfig(provider, 'clientId', e.target.value)}
                      placeholder="PayPal Client ID"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Client Secret</label>
                    <input
                      type="password"
                      value={provider.config?.clientSecret || ''}
                      onChange={(e) => handleUpdateConfig(provider, 'clientSecret', e.target.value)}
                      placeholder="PayPal Secret"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic text-sm">Generic provider configuration not yet supported in UI.</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
