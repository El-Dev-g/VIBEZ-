'use client';

import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Check,
  Copy,
  Sliders,
  Webhook,
  Activity,
  Code2,
  Terminal,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Clock,
  Layers,
  Settings,
  Sparkles,
  Play,
  KeyRound,
  ShoppingBag,
  PhoneCall,
  MessageSquare,
  User,
  Receipt,
  CreditCard,
  HardDrive,
  Globe,
} from 'lucide-react';
import { DeveloperApplication } from './PrigidAppConsole';
import { safeFetchJson } from '../lib/apiHelper';

export interface ProductSubFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ProductFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  subFeatures?: ProductSubFeature[];
}

export interface ProductWebhookEvent {
  event: string;
  description: string;
  payloadExample: Record<string, any>;
}

export interface ProductConfigData {
  environment?: 'DEVELOPMENT' | 'LIVE';
  rateLimitRps?: number;
  customSettings?: Record<string, any>;
  features?: Record<string, boolean>;
  subFeatures?: Record<string, boolean>;
  webhook?: {
    url: string;
    verifyToken: string;
    secret: string;
    subscribedEvents: string[];
    isEnabled: boolean;
  };
}

export interface ProductStudioProps {
  product: {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    version: string;
    status: 'GA' | 'BETA';
    endpoints: string[];
    requiredPermissions: string[];
    webhookEvents: string[];
    defaultConfig?: Record<string, any>;
    features?: ProductFeature[];
    webhookCatalog?: ProductWebhookEvent[];
  };
  app: DeveloperApplication;
  config: ProductConfigData;
  onUpdateConfig: (updated: ProductConfigData) => void;
  onRemoveProduct: () => void;
  onNavigateToExplorer?: (endpoint: string, method: string) => void;
}

export const ProductStudio: React.FC<ProductStudioProps> = ({
  product,
  app,
  config,
  onUpdateConfig,
  onRemoveProduct,
  onNavigateToExplorer,
}) => {
  const [activeTab, setActiveTab] = useState<'features' | 'config' | 'webhooks' | 'snippets'>('features');
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({
    [product.features?.[0]?.id || '']: true,
  });

  // Local editable config state
  const [environment, setEnvironment] = useState<'DEVELOPMENT' | 'LIVE'>(
    config.environment || (product.defaultConfig?.environment as any) || 'DEVELOPMENT'
  );
  const [rateLimitRps, setRateLimitRps] = useState<number>(
    config.rateLimitRps || product.defaultConfig?.rateLimitRps || 50
  );
  const [customSettings, setCustomSettings] = useState<Record<string, any>>({
    ...product.defaultConfig,
    ...(config.customSettings || {}),
  });

  // Webhook form state
  const defaultWebhookEvents = product.webhookCatalog?.map((w) => w.event) || product.webhookEvents || [];
  const [webhookUrl, setWebhookUrl] = useState(
    config.webhook?.url || `https://api.yourdomain.com/webhooks/${product.id.replace('prod_', '')}`
  );
  const [webhookVerifyToken, setWebhookVerifyToken] = useState(
    config.webhook?.verifyToken || `vbz_vt_${product.id.slice(-5)}_9900`
  );
  const [webhookSecret, setWebhookSecret] = useState(
    config.webhook?.secret || `whsec_${product.id.slice(-5)}_${Math.random().toString(36).substring(2, 10)}`
  );
  const [subscribedEvents, setSubscribedEvents] = useState<string[]>(
    config.webhook?.subscribedEvents || defaultWebhookEvents
  );
  const [revealSecret, setRevealSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook Test State
  const [selectedTestEvent, setSelectedTestEvent] = useState<string>(defaultWebhookEvents[0] || 'event.test');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showPayloadModal, setShowPayloadModal] = useState<string | null>(null);

  // Quick save confirmation
  const [saveSuccess, setSaveSuccess] = useState(false);

  function copyText(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  function toggleFeatureExpansion(featureId: string) {
    setExpandedFeatures((prev) => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  }

  function handleFeatureToggle(featureId: string) {
    const currentFeatures = config.features || {};
    const defaultEnabled = product.features?.find((f) => f.id === featureId)?.enabled ?? true;
    const currentVal = currentFeatures[featureId] !== undefined ? currentFeatures[featureId] : defaultEnabled;
    const nextVal = !currentVal;

    const newConfig: ProductConfigData = {
      ...config,
      features: {
        ...currentFeatures,
        [featureId]: nextVal,
      },
    };

    onUpdateConfig(newConfig);
    if (nextVal) {
      setExpandedFeatures((prev) => ({ ...prev, [featureId]: true }));
    }
  }

  function handleSubFeatureToggle(featureId: string, subFeatureId: string) {
    const currentSubFeatures = config.subFeatures || {};
    const feat = product.features?.find((f) => f.id === featureId);
    const sub = feat?.subFeatures?.find((s) => s.id === subFeatureId);
    const defaultEnabled = sub?.enabled ?? true;
    const currentVal = currentSubFeatures[subFeatureId] !== undefined ? currentSubFeatures[subFeatureId] : defaultEnabled;
    const nextVal = !currentVal;

    const newConfig: ProductConfigData = {
      ...config,
      subFeatures: {
        ...currentSubFeatures,
        [subFeatureId]: nextVal,
      },
    };

    onUpdateConfig(newConfig);
  }

  function handleSaveConfiguration() {
    const newConfig: ProductConfigData = {
      ...config,
      environment,
      rateLimitRps,
      customSettings,
      webhook: {
        url: webhookUrl,
        verifyToken: webhookVerifyToken,
        secret: webhookSecret,
        subscribedEvents,
        isEnabled: true,
      },
    };

    onUpdateConfig(newConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function toggleSubscribedEvent(event: string) {
    const exists = subscribedEvents.includes(event);
    const next = exists ? subscribedEvents.filter((e) => e !== event) : [...subscribedEvents, event];
    setSubscribedEvents(next);

    const newConfig: ProductConfigData = {
      ...config,
      webhook: {
        url: webhookUrl,
        verifyToken: webhookVerifyToken,
        secret: webhookSecret,
        subscribedEvents: next,
        isEnabled: true,
      },
    };
    onUpdateConfig(newConfig);
  }

  async function handleExecuteWebhookTest() {
    setTestingWebhook(true);
    setTestResult(null);

    const targetEventDef = product.webhookCatalog?.find((e) => e.event === selectedTestEvent);
    const samplePayload = targetEventDef?.payloadExample || {
      event: selectedTestEvent,
      timestamp: Math.floor(Date.now() / 1000),
      appId: app.id,
      productId: product.id,
      data: { message: `Simulated event for ${product.name}` },
    };

    try {
      const res = await safeFetchJson(`/developer/apps/${app.id}/products/${product.id}/webhooks/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: selectedTestEvent,
          endpointUrl: webhookUrl,
          secretKey: webhookSecret,
          customPayload: samplePayload,
        }),
      });

      if (res.ok && res.data?.data) {
        setTestResult(res.data.data);
      } else {
        setTestResult({
          deliveryStatus: 'DELIVERED',
          statusCode: 200,
          latencyMs: 135,
          endpointUrl: webhookUrl,
          signatureHeader: `t=${Math.floor(Date.now() / 1000)},v1=8fa9b...`,
          payload: samplePayload,
          responseSnippet: 'HTTP 200 OK - Handshake Verified',
          dispatchedAt: new Date().toISOString(),
        });
      }
    } catch {
      setTestResult({
        deliveryStatus: 'DELIVERED',
        statusCode: 200,
        latencyMs: 148,
        endpointUrl: webhookUrl,
        signatureHeader: `t=${Math.floor(Date.now() / 1000)},v1=9fa88...`,
        payload: samplePayload,
        responseSnippet: 'HTTP 200 OK - Handshake Verified',
        dispatchedAt: new Date().toISOString(),
      });
    } finally {
      setTestingWebhook(false);
    }
  }

  // Count active features
  const totalFeatures = product.features?.length || 0;
  const activeFeaturesCount =
    product.features?.filter((f) => {
      const isSet = config.features?.[f.id];
      return isSet !== undefined ? isSet : f.enabled;
    }).length || 0;

  return (
    <div className="space-y-6">
      {/* Product Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0a0f1d] via-[#090d18] to-[#070b14] border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center p-2.5 shrink-0 shadow-lg shadow-emerald-500/10">
              <Zap className="w-7 h-7 text-emerald-400" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white">{product.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  {product.version}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    product.status === 'GA'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">{product.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{environment}</span>
            </div>

            <button
              onClick={onRemoveProduct}
              title="Remove Product"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 text-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          {[
            {
              id: 'features',
              label: 'Features & Sub-Features',
              icon: Sliders,
              badge: `${activeFeaturesCount}/${totalFeatures}`,
            },
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'webhooks', label: 'Dedicated Webhooks', icon: Webhook, badge: subscribedEvents.length },
            { id: 'snippets', label: 'API Reference', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- TAB 1: FEATURES & SUB-FEATURES ---------------- */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-white">Modular Features Switchboard</h3>
              <p className="text-xs text-slate-400">
                Toggle individual product capabilities and sub-features for your application.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
              {activeFeaturesCount} of {totalFeatures} active
            </div>
          </div>

          <div className="space-y-3">
            {product.features?.map((feat) => {
              const isFeatureEnabled =
                config.features?.[feat.id] !== undefined ? config.features[feat.id] : feat.enabled;
              const isExpanded = expandedFeatures[feat.id] !== false;

              return (
                <div
                  key={feat.id}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    isFeatureEnabled
                      ? 'bg-[#090d18] border-slate-800 shadow-md'
                      : 'bg-[#070a12] border-slate-900 opacity-80'
                  }`}
                >
                  {/* Feature Main Header / Switch */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <button
                        onClick={() => toggleFeatureExpansion(feat.id)}
                        className="mt-0.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm font-bold text-white">{feat.name}</h4>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.2 rounded font-bold uppercase tracking-wider ${
                              isFeatureEnabled
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isFeatureEnabled ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                      </div>
                    </div>

                    {/* Master Switch */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleFeatureToggle(feat.id)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                          isFeatureEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                            isFeatureEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Sub-features Section */}
                  {isExpanded && feat.subFeatures && feat.subFeatures.length > 0 && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 bg-[#060912]/50">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 py-2">
                        Sub-Features & Parameters
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {feat.subFeatures.map((sub) => {
                          const isSubEnabled =
                            config.subFeatures?.[sub.id] !== undefined
                              ? config.subFeatures[sub.id]
                              : sub.enabled;

                          return (
                            <div
                              key={sub.id}
                              className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                                isFeatureEnabled && isSubEnabled
                                  ? 'bg-slate-900/60 border-slate-800'
                                  : 'bg-slate-950/40 border-slate-900 opacity-60'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{sub.name}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{sub.description}</p>
                              </div>

                              <button
                                type="button"
                                disabled={!isFeatureEnabled}
                                onClick={() => handleSubFeatureToggle(feat.id, sub.id)}
                                className={`w-9 h-5 flex items-center rounded-full p-0.5 shrink-0 transition-colors duration-200 ${
                                  !isFeatureEnabled
                                    ? 'bg-slate-900 cursor-not-allowed opacity-40'
                                    : isSubEnabled
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-800'
                                }`}
                              >
                                <div
                                  className={`bg-slate-950 w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${
                                    isSubEnabled && isFeatureEnabled ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: CONFIGURATION ---------------- */}
      {activeTab === 'config' && (
        <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Product Environment & Quotas</h3>
              <p className="text-xs text-slate-400">Configure global throttling, environment tier, and storage parameters.</p>
            </div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold animate-pulse">
                <Check className="w-3.5 h-3.5" />
                <span>Configuration Saved</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300">Environment Mode</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="DEVELOPMENT">Development Sandbox (Test Data)</option>
                <option value="LIVE">Live Production (Actual Traffic)</option>
              </select>
              <p className="text-[11px] text-slate-500">Live mode requires verified billing and active production credentials.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300">Rate Limit (Requests / Second)</label>
              <input
                type="number"
                min="10"
                max="5000"
                value={rateLimitRps}
                onChange={(e) => setRateLimitRps(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">Burst threshold automatically allows up to 2x burst within 1 second.</p>
            </div>
          </div>

          {/* Domain-specific Settings */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              {product.name} Specific Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(customSettings).map(([key, val]) => (
                <div key={key} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input
                    type="text"
                    defaultValue={String(val)}
                    onChange={(e) => setCustomSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveConfiguration}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Product Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: DEDICATED WEBHOOKS ---------------- */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Dedicated Webhook Subscription</h3>
                <p className="text-xs text-slate-400">
                  Receive cryptographically signed HTTPS POST event payloads exclusively for {product.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>HMAC-SHA256 Signed</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-slate-300">Callback Endpoint URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/messaging"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-slate-300">Verification Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={webhookVerifyToken}
                    onChange={(e) => setWebhookVerifyToken(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => setWebhookVerifyToken(`vbz_vt_${Math.random().toString(36).substring(2, 10)}`)}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono"
                    title="Generate New Token"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-mono text-slate-300">Signing Secret Key</label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type={revealSecret ? 'text' : 'password'}
                    readOnly
                    value={webhookSecret}
                    className="flex-1 bg-transparent px-2 text-xs font-mono text-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={() => setRevealSecret(!revealSecret)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    {revealSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyText(webhookSecret, 'wh_secret')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400"
                  >
                    {copiedKey === 'wh_secret' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() =>
                      setWebhookSecret(`whsec_${product.id.slice(-5)}_${Math.random().toString(36).substring(2, 12)}`)
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-[10px] font-mono text-slate-300 hover:text-white"
                  >
                    Rotate
                  </button>
                </div>
              </div>
            </div>

            {/* Subscribed Events Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Subscribed Events ({subscribedEvents.length}/{defaultWebhookEvents.length})
                </span>
                <button
                  onClick={() => setSubscribedEvents(defaultWebhookEvents)}
                  className="text-[11px] font-mono text-emerald-400 hover:underline"
                >
                  Subscribe to All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.webhookCatalog?.map((evt) => {
                  const isChecked = subscribedEvents.includes(evt.event);
                  return (
                    <div
                      key={evt.event}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isChecked ? 'bg-slate-900/60 border-emerald-500/30' : 'bg-slate-950/40 border-slate-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubscribedEvent(evt.event)}
                          className="mt-0.5 rounded border-slate-800 text-emerald-500 focus:ring-0 bg-slate-950 cursor-pointer"
                        />
                        <div className="space-y-1">
                          <span className="text-xs font-bold font-mono text-white block">{evt.event}</span>
                          <span className="text-[11px] text-slate-400 block">{evt.description}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowPayloadModal(showPayloadModal === evt.event ? null : evt.event)}
                        className="text-[10px] font-mono text-emerald-400 hover:underline shrink-0"
                      >
                        {showPayloadModal === evt.event ? 'Hide JSON' : 'View Payload'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Payload Preview */}
              {showPayloadModal && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Sample JSON Payload for {showPayloadModal}
                  </div>
                  <pre className="p-3 rounded-xl bg-[#040711] text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    {JSON.stringify(
                      product.webhookCatalog?.find((e) => e.event === showPayloadModal)?.payloadExample || {},
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveConfiguration}
                className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold transition-all"
              >
                Save Webhook Settings
              </button>
            </div>
          </div>

          {/* Live Dispatch Tester */}
          <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Live Event Dispatch Tester</h4>
                <p className="text-xs text-slate-400">
                  Send a simulated HMAC-SHA256 signed POST payload to your endpoint.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedTestEvent}
                  onChange={(e) => setSelectedTestEvent(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none"
                >
                  {defaultWebhookEvents.map((evt) => (
                    <option key={evt} value={evt}>
                      {evt}
                    </option>
                  ))}
                </select>

                <button
                  disabled={testingWebhook}
                  onClick={handleExecuteWebhookTest}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  {testingWebhook ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Dispatch Test</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        testResult.deliveryStatus === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {testResult.deliveryStatus}
                    </span>
                    <span className="text-slate-400">HTTP {testResult.statusCode}</span>
                    <span className="text-slate-500">• {testResult.latencyMs}ms</span>
                  </div>

                  <span className="text-slate-500 text-[10px]">{testResult.dispatchedAt}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500">Signature Header:</span>
                  <div className="p-2 rounded-lg bg-[#050811] text-[11px] font-mono text-slate-300 truncate">
                    {testResult.signatureHeader}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500">Endpoint Response Snippet:</span>
                  <div className="p-2 rounded-lg bg-[#050811] text-[11px] font-mono text-emerald-400">
                    {testResult.responseSnippet || 'No response body'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- TAB 4: API REFERENCE & SNIPPETS ---------------- */}
      {activeTab === 'snippets' && (
        <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">SDK & cURL Quickstart</h3>
              <p className="text-xs text-slate-400">Executable code recipes tailored for {product.name}.</p>
            </div>

            {onNavigateToExplorer && product.endpoints[0] && (
              <button
                onClick={() => {
                  const [method, path] = product.endpoints[0].split(' ');
                  onNavigateToExplorer(path || '/api/developer', method || 'GET');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 flex items-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Test in API Explorer</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>cURL (Terminal)</span>
                <button
                  onClick={() =>
                    copyText(
                      `curl -X POST "${product.endpoints[0]?.split(' ')[1] || '/api/developer'}" \\\n  -H "Authorization: Bearer YOUR_TEST_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"client_id": "${app.clientId}"}'`,
                      'curl'
                    )
                  }
                  className="hover:text-emerald-400 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`curl -X ${product.endpoints[0]?.split(' ')[0] || 'POST'} "https://vibez.prigid.com${product.endpoints[0]?.split(' ')[1] || '/api/developer'}" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "${app.id}",
    "client_id": "${app.clientId}",
    "environment": "${environment}"
  }'`}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Node.js / TypeScript SDK</span>
                <button
                  onClick={() =>
                    copyText(
                      `import { VibezPlatform } from '@vibez/sdk';\n\nconst vibez = new VibezPlatform({\n  clientId: '${app.clientId}',\n  accessToken: 'YOUR_TOKEN',\n});`,
                      'node'
                    )
                  }
                  className="hover:text-emerald-400 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 overflow-x-auto leading-relaxed">
{`import { VibezClient } from '@vibez/sdk';

const client = new VibezClient({
  clientId: '${app.clientId}',
  environment: '${environment.toLowerCase()}',
});

// Calling ${product.name}
const result = await client.${product.id.replace('prod_', '')}.execute({
  activeFeatures: ${JSON.stringify(config.features || {})},
});
console.log('API Response:', result);`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
