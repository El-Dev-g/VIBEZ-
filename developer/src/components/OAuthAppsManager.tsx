'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Shield, Plus, Copy, Check, RefreshCw, Globe, Trash2, Code2, Zap, Play, Terminal } from 'lucide-react';

interface OAuthApp {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  grantTypes: string[];
  scopes: string[];
  createdAt: string;
}

export const OAuthAppsManager: React.FC = () => {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Token testing state
  const [testingAppId, setTestingAppId] = useState<string | null>(null);
  const [issuedTokenResult, setIssuedTokenResult] = useState<{ appId: string; token: string; expiresIn: number } | null>(null);
  const [testingLoading, setTestingLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
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
      clientId: `vibez_client_${Math.random().toString(36).substring(2, 10)}`,
      clientSecret: `vbz_sec_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`,
      redirectUris: redirectUri ? [redirectUri] : ['https://localhost:3000/callback'],
      grantTypes,
      scopes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setApps([newApp, ...apps]);
    setIsCreating(false);
    setName('');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              OAuth2 Client Applications
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered OAuth2 clients with Client Credentials & Authorization Code grant support • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register OAuth App</span>
        </button>
      </div>

      {/* Register App Modal/Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-[#090d16] border border-emerald-500/30 space-y-4 shadow-2xl">
          <h4 className="text-sm font-black text-white uppercase tracking-wider">Register New OAuth2 Client</h4>

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
              <label className="block text-xs font-mono text-slate-300 mb-1">Allowed Redirect URI</label>
              <input
                type="text"
                placeholder="https://yourapp.com/oauth/callback"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">Grant Types</label>
            <div className="flex flex-wrap gap-2">
              {['authorization_code', 'client_credentials', 'refresh_token'].map((gt) => (
                <button
                  key={gt}
                  type="button"
                  onClick={() => toggleGrant(gt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase hover:bg-emerald-400 transition-all"
            >
              Save Application
            </button>
          </div>
        </form>
      )}

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.map((app) => (
          <div
            key={app.id}
            className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">{app.name}</h4>
                  <span className="text-[11px] font-mono text-slate-500">Registered {app.createdAt}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(app.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete Application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Client ID */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>CLIENT_ID</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(app.clientId, `${app.id}_id`)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedField === `${app.id}_id` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === `${app.id}_id` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white truncate">{app.clientId}</div>
              </div>

              {/* Client Secret */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>CLIENT_SECRET</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(app.clientSecret, `${app.id}_sec`)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedField === `${app.id}_sec` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === `${app.id}_sec` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-400 truncate">{app.clientSecret}</div>
              </div>

              {/* Redirect URIs & Scopes */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{app.redirectUris.join(', ')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {app.scopes.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Token Result Box */}
              {issuedTokenResult?.appId === app.id && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Generated Access Token (JWT)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(issuedTokenResult.token, `${app.id}_jwt`)}
                      className="text-[10px] text-emerald-300 underline"
                    >
                      {copiedField === `${app.id}_jwt` ? 'Copied Token' : 'Copy JWT'}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800">
                    {issuedTokenResult.token}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Expires in: {issuedTokenResult.expiresIn}s • Type: Bearer
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleTestTokenIssue(app)}
              disabled={testingLoading && testingAppId === app.id}
              className="mt-4 w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{testingLoading && testingAppId === app.id ? 'Issuing Token...' : 'Issue Test OAuth Token'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
