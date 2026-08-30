'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Shield, 
  Plus, 
  Copy, 
  Check, 
  Globe, 
  Trash2, 
  Zap, 
  Lock,
  Sparkles,
  Eye,
  CheckCircle2,
  User,
  Mail,
  Smartphone,
  Fingerprint,
  RefreshCw,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  HelpCircle
} from 'lucide-react';

export interface AuthScopeDefinition {
  id: string;
  label: string;
  category: string;
  description: string;
  icon: React.ElementType;
  required?: boolean;
}

export const AUTHENTICATION_SCOPES: AuthScopeDefinition[] = [
  {
    id: 'openid',
    label: 'openid',
    category: 'Core Authentication',
    description: 'Verify your account identity and issue an OpenID Connect ID token',
    icon: Fingerprint,
    required: true,
  },
  {
    id: 'profile',
    label: 'profile',
    category: 'User Identity',
    description: 'Access basic profile details (full name, username handle @tag, avatar picture)',
    icon: User,
  },
  {
    id: 'email',
    label: 'email',
    category: 'User Identity',
    description: 'Access and verify your registered primary email address',
    icon: Mail,
  },
  {
    id: 'phone',
    label: 'phone',
    category: 'Security & Verification',
    description: 'Access your verified phone number for SMS and 2-step verification',
    icon: Smartphone,
  },
  {
    id: 'offline_access',
    label: 'offline_access',
    category: 'Session Management',
    description: 'Issue a long-lived Refresh Token to maintain persistent login sessions',
    icon: RefreshCw,
  },
];

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
  developerName?: string;
  websiteUrl?: string;
}

const LOCAL_STORAGE_KEY = 'vibez_developer_oauth_apps_v2';

const DEFAULT_FALLBACK_APPS: OAuthApp[] = [
  {
    id: 'app_vibez_android',
    name: 'VIBEZ Android Native Client',
    description: 'Official production mobile client for Android devices with biometric sign-in.',
    clientId: 'vibez_client_and_9024f',
    clientSecret: 'vbz_sec_7a819b4c0291e77dfa849201',
    redirectUris: ['com.aistudio.vibez://oauth/callback', 'https://vibez.prigid.com/auth/callback'],
    grantTypes: ['authorization_code', 'refresh_token'],
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    createdAt: '2026-08-01',
    environment: 'production',
    developerName: 'PRIGID GROUP Mobile Lab',
    websiteUrl: 'https://vibez.prigid.com',
  },
  {
    id: 'app_enterprise_gateway',
    name: 'Enterprise Single Sign-On Gateway',
    description: 'Corporate authentication gateway integrating employee directory and SSO accounts.',
    clientId: 'vibez_client_srv_4412e',
    clientSecret: 'vbz_sec_99a8b1c4e201d44837ff0019',
    redirectUris: ['https://sso.enterprise.com/v1/auth/callback'],
    grantTypes: ['authorization_code', 'client_credentials'],
    scopes: ['openid', 'profile', 'email', 'phone', 'offline_access'],
    createdAt: '2026-08-15',
    environment: 'production',
    developerName: 'Enterprise Security Division',
    websiteUrl: 'https://enterprise.com',
  },
];

export const OAuthAppsManager: React.FC = () => {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'sandbox'>('all');

  // Create / Edit modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');
  const [grantTypes, setGrantTypes] = useState<string[]>(['authorization_code', 'refresh_token']);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['openid', 'profile', 'email']);
  const [submitting, setSubmitting] = useState(false);

  // Copy indicator
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Token testing state
  const [testingAppId, setTestingAppId] = useState<string | null>(null);
  const [issuedTokenResult, setIssuedTokenResult] = useState<{ appId: string; token: string; expiresIn: number; scope: string } | null>(null);
  const [testingLoading, setTestingLoading] = useState(false);

  // Consent Screen Preview state
  const [previewConsentApp, setPreviewConsentApp] = useState<OAuthApp | null>(null);
  const [simulatingAuth, setSimulatingAuth] = useState(false);
  const [simulatedUserAccount, setSimulatedUserAccount] = useState({
    name: 'Prigid Admin',
    email: 'prigidcollection@gmail.com',
    handle: '@prigid',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  });

  // Load apps from API with LocalStorage fallback
  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/developer/oauth-apps');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setApps(data.data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.data));
        return;
      }
    } catch {
      // fallback
    }

    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try {
        setApps(JSON.parse(localData));
      } catch {
        setApps(DEFAULT_FALLBACK_APPS);
      }
    } else {
      setApps(DEFAULT_FALLBACK_APPS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_FALLBACK_APPS));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingAppId(null);
    setName('');
    setDescription('');
    setRedirectUri('');
    setEnvironment('production');
    setGrantTypes(['authorization_code', 'refresh_token']);
    setSelectedScopes(['openid', 'profile', 'email']);
  };

  const openEditModal = (app: OAuthApp) => {
    setModalMode('edit');
    setEditingAppId(app.id);
    setName(app.name);
    setDescription(app.description);
    setRedirectUri(app.redirectUris.join(', '));
    setEnvironment(app.environment);
    setGrantTypes(app.grantTypes);
    setSelectedScopes(app.scopes);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingAppId(null);
  };

  const toggleGrant = (gt: string) => {
    if (grantTypes.includes(gt)) {
      setGrantTypes(grantTypes.filter((g) => g !== gt));
    } else {
      setGrantTypes([...grantTypes, gt]);
    }
  };

  const toggleScope = (scopeId: string) => {
    if (scopeId === 'openid') return; // Mandatory
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  // CREATE / UPDATE Submission handler
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    const redirectArray = redirectUri
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const cleanedScopes = Array.from(new Set(['openid', ...selectedScopes]));

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/developer/oauth-apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            redirectUris: redirectArray.length > 0 ? redirectArray : ['https://localhost:3000/callback'],
            grantTypes,
            scopes: cleanedScopes,
            environment,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          const updatedList = [data.data, ...apps];
          setApps(updatedList);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
        } else {
          // Client-side fallback creation
          const newApp: OAuthApp = {
            id: `app_${Date.now()}`,
            name,
            description: description || 'Custom authentication client for VIBEZ Single Sign-On.',
            clientId: `vibez_client_${Math.random().toString(36).substring(2, 10)}`,
            clientSecret: `vbz_sec_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`,
            redirectUris: redirectArray.length > 0 ? redirectArray : ['https://localhost:3000/callback'],
            grantTypes,
            scopes: cleanedScopes,
            createdAt: new Date().toISOString().split('T')[0],
            environment,
            developerName: 'PRIGID Verified Developer',
            websiteUrl: redirectArray[0] || 'https://vibez.prigid.com',
          };
          const updatedList = [newApp, ...apps];
          setApps(updatedList);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
        }
      } else if (modalMode === 'edit' && editingAppId) {
        const res = await fetch('/api/developer/oauth-apps', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAppId,
            name,
            description,
            redirectUris: redirectArray.length > 0 ? redirectArray : ['https://localhost:3000/callback'],
            grantTypes,
            scopes: cleanedScopes,
            environment,
          }),
        });

        const data = await res.json();
        const updatedList = apps.map((a) => {
          if (a.id === editingAppId) {
            return data.success && data.data ? data.data : {
              ...a,
              name,
              description,
              redirectUris: redirectArray.length > 0 ? redirectArray : a.redirectUris,
              grantTypes,
              scopes: cleanedScopes,
              environment,
            };
          }
          return a;
        });

        setApps(updatedList);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      }
      closeModal();
    } catch {
      // graceful fallback
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE handler
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the OAuth application "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await fetch(`/api/developer/oauth-apps?id=${id}`, { method: 'DELETE' });
    } catch {
      // proceed with local removal
    }

    const updated = apps.filter((a) => a.id !== id);
    setApps(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // REGENERATE CLIENT SECRET
  const handleRegenerateSecret = async (app: OAuthApp) => {
    if (!confirm(`Regenerate client secret for "${app.name}"? Existing integrations using the old secret will be invalidated.`)) {
      return;
    }

    try {
      const res = await fetch('/api/developer/oauth-apps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: app.id,
          regenerateSecret: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const updated = apps.map((a) => (a.id === app.id ? data.data : a));
        setApps(updated);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        alert('Client Secret regenerated successfully!');
        return;
      }
    } catch {
      // fallback
    }

    const newSecret = `vbz_sec_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`;
    const updated = apps.map((a) => (a.id === app.id ? { ...a, clientSecret: newSecret } : a));
    setApps(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    alert('Client Secret regenerated successfully!');
  };

  // Test live token issuance
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
          scope: data.scope,
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

  const handleAuthorizeSimulation = () => {
    setSimulatingAuth(true);
    setTimeout(() => {
      setSimulatingAuth(false);
      const redirectTarget = previewConsentApp?.redirectUris[0] || 'https://vibez.prigid.com';
      alert(`✓ Authorization Successful!\n\nUser ${simulatedUserAccount.email} granted authentication permissions to ${previewConsentApp?.name}.\n\nSimulating OAuth Callback redirect with auth code to:\n${redirectTarget}?code=v_auth_${Math.random().toString(36).substring(2, 12)}&state=xyz123`);
      setPreviewConsentApp(null);
    }, 1200);
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = envFilter === 'all' || app.environment === envFilter;
    return matchesSearch && matchesEnv;
  });

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
                Register, manage, edit, and issue credentials for third-party OAuth2 & OpenID Connect clients • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register New OAuth App</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#070b13] p-3 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applications, client IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Environment:
          </span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'production', 'sandbox'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvFilter(env)}
                className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                  envFilter === env
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* App Registration / Edit Form Modal */}
      {modalMode && (
        <form onSubmit={handleSaveApp} className="p-6 rounded-3xl bg-[#090d16] border border-emerald-500/40 space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {modalMode === 'create' ? 'Register New OAuth2 Client Application' : 'Edit OAuth2 Application Configuration'}
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
              PRIGID Single Sign-On
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-300 mb-1">Application Name *</label>
              <input
                type="text"
                placeholder="e.g. VIBEZ Mobile App or Partner Portal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="production">Production</option>
                <option value="sandbox">Sandbox (Testing)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Allowed Redirect URI(s) (Comma separated)</label>
            <input
              type="text"
              placeholder="https://yourapp.com/oauth/callback, myapp://callback"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Application Description</label>
            <input
              type="text"
              placeholder="Brief summary of why your application requests user authentication..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Authentication Permissions (Scopes) Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono text-slate-300 font-bold">
                Authentication Scopes & Identity Permissions
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Choose user credentials this app is authorized to request
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {AUTHENTICATION_SCOPES.map((scope) => {
                const Icon = scope.icon;
                const isSelected = selectedScopes.includes(scope.id);
                const isMandatory = scope.required;

                return (
                  <div
                    key={scope.id}
                    onClick={() => !isMandatory && toggleScope(scope.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                            {scope.label}
                            {isMandatory && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                                Mandatory
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">{scope.category}</div>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-xs ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug mt-2 pt-2 border-t border-slate-800/60">
                      {scope.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grant Types Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">
              OAuth2 Grant Types
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'authorization_code', label: 'Authorization Code (PKCE / User Login)' },
                { id: 'refresh_token', label: 'Refresh Token (Silent Token Renewal)' },
                { id: 'client_credentials', label: 'Client Credentials (Service-to-Service)' },
              ].map((gt) => (
                <button
                  key={gt.id}
                  type="button"
                  onClick={() => toggleGrant(gt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                    grantTypes.includes(gt.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                      : 'bg-slate-950 text-slate-500 border border-slate-800'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${grantTypes.includes(gt.id) ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{gt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{modalMode === 'create' ? 'Save Application Credentials' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Apps Grid */}
      {filteredApps.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#070b14] border border-slate-800 space-y-3">
          <KeyRound className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No OAuth2 Applications Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? `No client applications matched "${searchQuery}".` : 'Get started by creating your first OAuth 2.0 client application.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black uppercase hover:bg-emerald-400 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApps.map((app) => (
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
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        app.environment === 'production' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {app.environment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{app.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(app)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                      title="Edit Application Configuration"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewConsentApp(app)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      title="Preview End-User Consent Screen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Consent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id, app.name)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete Application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

                {/* Client Secret Box with Regenerate Option */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1.5 text-slate-300">
                      <Lock className="w-3.5 h-3.5 text-teal-400" />
                      CLIENT_SECRET
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRegenerateSecret(app)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(app.clientSecret, `${app.id}_sec`)}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        {copiedField === `${app.id}_sec` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === `${app.id}_sec` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-slate-400 select-all">{app.clientSecret}</div>
                </div>

                {/* Redirect URIs & Authentication Scopes Badge Row */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <Globe className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="truncate text-[11px] text-slate-300">{app.redirectUris.join(', ')}</span>
                  </div>
                  
                  {/* Scopes Pill Badges */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Auth Scopes:</span>
                    {app.scopes.map((s) => (
                      <span key={s} className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold font-mono">
                        {s}
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
                      <span>Scope: {issuedTokenResult.scope}</span>
                      <span className="text-emerald-400 font-bold">Expires: {issuedTokenResult.expiresIn}s</span>
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
                  <span>{testingLoading && testingAppId === app.id ? 'Issuing Auth Token...' : 'Issue Auth Token'}</span>
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
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONALLY REDESIGNED OAUTH2 CONSENT SCREEN MODAL                     */}
      {/* ========================================================================= */}
      {previewConsentApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c121e] border border-slate-800/90 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Top Browser / SSL Address Header */}
            <div className="bg-[#070b13] px-5 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>https://auth.vibez.prigid.com/oauth/v2/auth</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 hidden sm:inline">256-bit TLS Encrypted</span>
                <button
                  type="button"
                  onClick={() => setPreviewConsentApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Content Body */}
            <div className="p-7 space-y-6">
              
              {/* VIBEZ Platform & Application Identity Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-slate-950 font-black text-2xl">
                    {previewConsentApp.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-slate-950 border border-emerald-500/40 text-emerald-400 shadow">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Sign in to <span className="text-emerald-400">{previewConsentApp.name}</span>
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1 text-xs text-slate-400">
                    <span>wants to use your </span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      VIBEZ Account
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Developer: <strong className="text-slate-300">{previewConsentApp.developerName || 'PRIGID GROUP Verified Partner'}</strong></span>
                </div>
              </div>

              {/* Active User Account Switcher Card */}
              <div className="p-3.5 rounded-2xl bg-[#070b13] border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={simulatedUserAccount.avatar}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {simulatedUserAccount.name}
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-normal">
                        {simulatedUserAccount.handle}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {simulatedUserAccount.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Switching accounts between PRIGID & VIBEZ profiles`)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
                >
                  Switch
                </button>
              </div>

              {/* Permission & Identity Disclosures Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold uppercase text-[11px] tracking-wider text-slate-300">
                    Authentication Permissions Requested
                  </span>
                  <span className="text-[10px] text-slate-500">Single Sign-On</span>
                </div>

                <div className="bg-[#070b13] rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
                  
                  {/* Identity verification item (openid) */}
                  <div className="p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Verify your primary VIBEZ ID & Account Identity
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Allows this application to securely authenticate your credentials without knowing your password.
                      </div>
                    </div>
                  </div>

                  {/* Profile Info Item (profile) */}
                  {previewConsentApp.scopes.includes('profile') && (
                    <div className="p-3.5 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          View your public profile information
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Your full name, username handle (<strong className="text-slate-300">{simulatedUserAccount.handle}</strong>), and profile avatar.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email address item (email) */}
                  {previewConsentApp.scopes.includes('email') && (
                    <div className="p-3.5 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Access your verified email address
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Shares <strong className="text-slate-300">{simulatedUserAccount.email}</strong> with this app for notifications and account linkage.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone number item (phone) */}
                  {previewConsentApp.scopes.includes('phone') && (
                    <div className="p-3.5 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Access your verified phone number
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Enables SMS one-time verification and multi-factor authentication across your devices.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Offline Access item (offline_access) */}
                  {previewConsentApp.scopes.includes('offline_access') && (
                    <div className="p-3.5 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 flex-shrink-0 mt-0.5">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Maintain persistent login session
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Keeps you signed in seamlessly so you don't need to re-enter your credentials every time.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Safety & Privacy Disclosures */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>VIBEZ Privacy & Trust Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  By clicking <strong className="text-white">Allow & Sign In</strong>, you authorize VIBEZ to share your identity information with <strong className="text-slate-300">{previewConsentApp.name}</strong>. You can review or revoke this app’s access anytime in your Account Settings.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500">
                  <a href="#terms" onClick={(e) => { e.preventDefault(); alert('VIBEZ Terms of Service'); }} className="hover:text-emerald-400 underline">Terms of Service</a>
                  <span>•</span>
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('VIBEZ Privacy Policy'); }} className="hover:text-emerald-400 underline">Privacy Policy</a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewConsentApp(null)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAuthorizeSimulation}
                  disabled={simulatingAuth}
                  className="w-2/3 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  {simulatingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Authorizing Access...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Allow & Sign In</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
