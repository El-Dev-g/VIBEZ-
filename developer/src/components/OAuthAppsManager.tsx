'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Shield, 
  Plus, 
  Copy, 
  Check, 
  RefreshCw, 
  Globe, 
  Trash2, 
  Code2, 
  Zap, 
  Play, 
  Terminal,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  Smartphone
} from 'lucide-react';

interface OAuthApp {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  grantTypes: string[];
  scopes: string[];
  createdAt: string;
  environment: 'production' | 'sandbox';
  description: string;
}

const DEFAULT_INITIAL_APPS: OAuthApp[] = [
  {
    id: 'app_vibez_android',
    name: 'VIBEZ Android Native Client',
    description: 'Official production mobile client for Android devices with biometric sign-in.',
    clientId: 'vibez_client_and_9024f',
    clientSecret: 'vbz_sec_7a819b4c0291e77dfa849201',
    redirectUris: ['com.aistudio.vibez://oauth/callback', 'https://vibez.prigid.com/auth/callback'],
    grantTypes: ['authorization_code', 'refresh_token'],
    scopes: ['messages:read', 'messages:write', 'rtc:signaling', 'contacts:sync'],
    createdAt: '2026-08-01',
    environment: 'production',
  },
  {
    id: 'app_enterprise_gateway',
    name: 'Enterprise Backend Gateway',
    description: 'Server-to-server daemon for automated webhook ingestion and high-volume dispatch.',
    clientId: 'vibez_client_srv_4412e',
    clientSecret: 'vbz_sec_99a8b1c4e201d44837ff0019',
    redirectUris: ['https://api.enterprise.com/v1/auth/callback'],
    grantTypes: ['client_credentials'],
    scopes: ['messages:write', 'rtc:signaling', 'admin:telemetry'],
    createdAt: '2026-08-15',
    environment: 'production',
  },
];

export const OAuthAppsManager: React.FC = () => {
  const [apps, setApps] = useState<OAuthApp[]>(DEFAULT_INITIAL_APPS);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Token testing state
  const [testingAppId, setTestingAppId] = useState<string | null>(null);
  const [issuedTokenResult, setIssuedTokenResult] = useState<{ appId: string; token: string; expiresIn: number } | null>(null);
  const [testingLoading, setTestingLoading] = useState(false);

  // Snippet language selection
  const [selectedSnippetLang, setSelectedSnippetLang] = useState<'curl' | 'node' | 'kotlin' | 'python'>('curl');
  const [previewConsentApp, setPreviewConsentApp] = useState<OAuthApp | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [grantTypes, setGrantTypes] = useState<string[]>(['authorization_code', 'client_credentials']);
  const [scopes, setScopes] = useState<string[]>(['messages:read', 'messages:write', 'rtc:signaling']);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newApp: OAuthApp = {
      id: `app_${Date.now()}`,
      name,
      description: description || 'Custom client application for VIBEZ platform APIs.',
      clientId: `vibez_client_${Math.random().toString(36).substring(2, 10)}`,
      clientSecret: `vbz_sec_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`,
      redirectUris: redirectUri ? redirectUri.split(',').map((u) => u.trim()) : ['https://localhost:3000/callback'],
      grantTypes,
      scopes,
      createdAt: new Date().toISOString().split('T')[0],
      environment: 'production',
    };

    setApps([newApp, ...apps]);
    setIsCreating(false);
    setName('');
    setDescription('');
    setRedirectUri('');
  };

  const handleDelete = (id: string) => {
    setApps(apps.filter((a) => a.id !== id));
  };

  const toggleGrant = (gt: string) => {
    if (grantTypes.includes(gt)) {
      setGrantTypes(grantTypes.filter((g) => g !== gt));
    } else {
      setGrantTypes([...grantTypes, gt]);
    }
  };

  const toggleScope = (sc: string) => {
    if (scopes.includes(sc)) {
      setScopes(scopes.filter((s) => s !== sc));
    } else {
      setScopes([...scopes, sc]);
    }
  };

  const handleTestTokenIssue = async (app: OAuthApp) => {
    setTestingAppId(app.id);
    setTestingLoading(true);
    try {
      const res = await fetch('/api/developer/server/issue-oauth-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: app.clientId,
          client_secret: app.clientSecret,
          grant_type: 'client_credentials',
          scope: app.scopes.join(' '),
        }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        setIssuedTokenResult({
          appId: app.id,
          token: data.access_token,
          expiresIn: data.expires_in,
        });
      } else {
        alert(`OAuth error: ${data.error_description || 'Failed to issue token'}`);
      }
    } catch (err: any) {
      alert(`Token error: ${err.message}`);
    } finally {
      setTestingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                OAuth2 Client Applications
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Register third-party OAuth2 clients, grant types, redirect URIs, and credentials • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register New App</span>
        </button>
      </div>

      {/* App Registration Form Modal */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-6 rounded-3xl bg-[#090d16] border border-emerald-500/30 space-y-5 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Register New OAuth2 Client Application
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
              PRIGID Cloud Auth
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Application Name</label>
              <input
                type="text"
                placeholder="e.g. Flutter Mobile Client"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Allowed Redirect URI(s)</label>
              <input
                type="text"
                placeholder="https://yourapp.com/oauth/callback, myapp://callback"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Application Description</label>
            <input
              type="text"
              placeholder="Brief description of the app's integration purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Grant Types</label>
              <div className="flex flex-wrap gap-2">
                {['authorization_code', 'client_credentials', 'refresh_token'].map((gt) => (
                  <button
                    key={gt}
                    type="button"
                    onClick={() => toggleGrant(gt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      grantTypes.includes(gt)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {gt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Authorized Scopes</label>
              <div className="flex flex-wrap gap-2">
                {['messages:read', 'messages:write', 'rtc:signaling', 'contacts:sync', 'admin:telemetry'].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => toggleScope(sc)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      scopes.includes(sc)
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              Create Application Credentials
            </button>
          </div>
        </form>
      )}

      {/* Apps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apps.map((app) => (
          <div
            key={app.id}
            className="p-6 rounded-3xl bg-[#070b14] border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header of Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-white">{app.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                      {app.environment}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{app.description}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewConsentApp(app)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                    title="Preview End-User Consent Screen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(app.id)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete Application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Client ID Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    CLIENT_ID
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(app.clientId, `${app.id}_id`)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    {copiedField === `${app.id}_id` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === `${app.id}_id` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white select-all">{app.clientId}</div>
              </div>

              {/* Client Secret Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    CLIENT_SECRET
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(app.clientSecret, `${app.id}_sec`)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    {copiedField === `${app.id}_sec` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === `${app.id}_sec` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-400 select-all">{app.clientSecret}</div>
              </div>

              {/* Redirect URIs & Scopes */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <Globe className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="truncate text-[11px] text-slate-300">{app.redirectUris.join(', ')}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {app.scopes.map((s) => (
                    <span key={s} className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
                      {s}
                    </span>
                  ))}
                  {app.grantTypes.map((gt) => (
                    <span key={gt} className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-bold">
                      {gt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Generated Token Result Console */}
              {issuedTokenResult?.appId === app.id && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Live Issued Access Token (JWT)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(issuedTokenResult.token, `${app.id}_jwt`)}
                      className="text-[11px] text-emerald-300 underline font-bold"
                    >
                      {copiedField === `${app.id}_jwt` ? 'Copied Token' : 'Copy JWT'}
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-slate-300 break-all bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {issuedTokenResult.token}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Expires in: {issuedTokenResult.expiresIn}s (2 hours)</span>
                    <span className="text-emerald-400 font-bold">Type: Bearer</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTestTokenIssue(app)}
                disabled={testingLoading && testingAppId === app.id}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>{testingLoading && testingAppId === app.id ? 'Issuing Token...' : 'Issue Live Token'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewConsentApp(app)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consent Preview</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* End-User OAuth Consent Screen Preview Modal */}
      {previewConsentApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101b] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>OAuth 2.0 Consent Screen Preview</span>
              </div>
              <button
                onClick={() => setPreviewConsentApp(null)}
                className="text-xs text-slate-500 hover:text-white font-mono"
              >
                Close [ESC]
              </button>
            </div>

            {/* App Branding */}
            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-xl text-slate-950 font-black text-2xl">
                {previewConsentApp.name.charAt(0)}
              </div>
              <h4 className="text-lg font-black text-white">{previewConsentApp.name}</h4>
              <p className="text-xs text-slate-400">
                wants to access your <strong className="text-white">VIBEZ Account</strong>
              </p>
              <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block border border-emerald-500/20">
                Verified PRIGID Developer
              </div>
            </div>

            {/* Scopes Requested */}
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                This app will be able to:
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {previewConsentApp.scopes.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>
                      {s === 'messages:read' && 'Read your chat messages and channel history'}
                      {s === 'messages:write' && 'Send messages and rich media on your behalf'}
                      {s === 'rtc:signaling' && 'Initiate WebRTC audio and video calling rooms'}
                      {s === 'contacts:sync' && 'Access and synchronize contact buddy lists'}
                      {s === 'admin:telemetry' && 'View network telemetry status'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPreviewConsentApp(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Authorized ${previewConsentApp.name} successfully! Redirecting to ${previewConsentApp.redirectUris[0]}...`);
                  setPreviewConsentApp(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
              >
                Authorize App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
