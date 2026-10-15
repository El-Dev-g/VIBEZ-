'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  ShieldCheck,
  Key,
  KeyRound,
  Lock,
  Globe,
  Smartphone,
  Server,
  MessageSquare,
  User,
  PhoneCall,
  ShoppingBag,
  Receipt,
  CreditCard,
  Webhook,
  Sparkles,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  RefreshCw,
  Play,
  Send,
  Clock,
  Users,
  Code2,
  Sliders,
  Settings,
  Zap,
  ChevronRight,
  BookOpen,
  Info,
  Terminal,
} from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';
import { getApiBaseUrl, safeFetchJson } from '../lib/apiHelper';
import {
  ProductStudio,
  ProductConfigData,
  ProductFeature,
  ProductSubFeature,
  ProductWebhookEvent,
} from './ProductStudio';

export interface DeveloperApplication {
  id: string;
  appName: string;
  description: string;
  appType: 'Consumer' | 'Business' | 'Enterprise' | 'Gaming' | 'Utility';
  iconUrl?: string;
  clientId: string;
  clientSecret: string;
  status: 'DEVELOPMENT' | 'LIVE';
  contactEmail: string;
  websiteUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  platforms: {
    website?: { origins: string[]; redirectUris: string[] };
    android?: { packageName: string; sha256Fingerprints: string[] };
    ios?: { bundleId: string; appStoreId?: string };
    server?: { enabled: boolean; ipAllowlist?: string[] };
  };
  enabledProducts: string[];
  permissions: Record<string, 'AVAILABLE' | 'REQUESTED' | 'APPROVED' | 'RESTRICTED' | 'REVOKED'>;
  createdAt: string;
}

export interface ProductDefinition {
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
}

export interface PermissionDefinition {
  id: string;
  name: string;
  category: string;
  product: string;
  description: string;
  requiresApproval: boolean;
  defaultState: 'AVAILABLE' | 'APPROVED';
}

export interface TestToken {
  id: string;
  token: string;
  userId: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

export interface WebhookEndpointConfig {
  id: string;
  url: string;
  secret: string;
  verifyToken: string;
  subscribedEvents: string[];
  isEnabled: boolean;
  createdAt: string;
}

const LOCAL_STORAGE_APPS_KEY = 'prigid_developer_apps_v1';
const LOCAL_STORAGE_ACTIVE_APP_KEY = 'prigid_developer_active_app_id';

const INITIAL_APPS: DeveloperApplication[] = [
  {
    id: 'app_vibez_prod_01',
    appName: 'Vibez Official Android App',
    description: 'Production Android mobile client featuring biometric phone sign-in, WebRTC signaling, and end-to-end messaging.',
    appType: 'Consumer',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    clientId: 'vibez_client_and_9024f',
    clientSecret: 'vbz_sec_7a819b4c0291e77dfa849201a4bc89',
    status: 'LIVE',
    contactEmail: 'android-core@prigid.com',
    websiteUrl: 'https://vibez.prigid.com',
    privacyPolicyUrl: 'https://vibez.prigid.com/privacy',
    termsOfServiceUrl: 'https://vibez.prigid.com/terms',
    platforms: {
      android: {
        packageName: 'com.aistudio.vibez',
        sha256Fingerprints: ['14:5A:92:B3:7C:E4:01:8F:22:19:9C:88:B1:00:23:4E:91:AA:56:09:BB:67:12:F0'],
      },
      website: {
        origins: ['https://vibez.prigid.com'],
        redirectUris: ['https://vibez.prigid.com/oauth/callback'],
      },
    },
    enabledProducts: ['prod_messaging', 'prod_auth', 'prod_webrtc', 'prod_profile', 'prod_webhooks'],
    permissions: {
      'profile.read': 'APPROVED',
      'messages.send': 'APPROVED',
      'messages.read': 'APPROVED',
      'rtc:signaling': 'APPROVED',
      'webhooks.manage': 'APPROVED',
    },
    createdAt: '2026-08-15',
  },
  {
    id: 'app_business_portal_02',
    appName: 'Vibez Business Storefront Hub',
    description: 'B2B enterprise connector integrating product catalog sync, payment badge validation, and automated chat messaging.',
    appType: 'Business',
    iconUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    clientId: 'vibez_client_biz_4418a',
    clientSecret: 'vbz_sec_c48921e104b901a884ef119024bc99',
    status: 'DEVELOPMENT',
    contactEmail: 'business-api@prigid.com',
    websiteUrl: 'https://business.prigid.com',
    privacyPolicyUrl: 'https://business.prigid.com/privacy',
    termsOfServiceUrl: 'https://business.prigid.com/terms',
    platforms: {
      website: {
        origins: ['https://business.prigid.com'],
        redirectUris: ['https://business.prigid.com/api/auth/callback'],
      },
      server: {
        enabled: true,
        ipAllowlist: ['198.51.100.24', '203.0.113.88'],
      },
    },
    enabledProducts: ['prod_commerce', 'prod_orders', 'prod_payments', 'prod_messaging'],
    permissions: {
      'products.read': 'APPROVED',
      'products.write': 'APPROVED',
      'orders.read': 'APPROVED',
      'orders.write': 'REQUESTED',
      'messages.send': 'APPROVED',
    },
    createdAt: '2026-09-02',
  },
];

function getProductIconComponent(iconName: string, className = 'w-4 h-4 text-emerald-400') {
  switch (iconName) {
    case 'MessageSquare':
      return <MessageSquare className={className} />;
    case 'KeyRound':
      return <KeyRound className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'PhoneCall':
      return <PhoneCall className={className} />;
    case 'Receipt':
      return <Receipt className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Webhook':
      return <Webhook className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'HardDrive':
      return <HardDrive className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'User':
      return <User className={className} />;
    default:
      return <Zap className={className} />;
  }
}

export const PrigidAppConsole: React.FC = () => {
  const { user } = useDeveloperAuth();
  const [apps, setApps] = useState<DeveloperApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<DeveloperApplication | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'settings'
    | 'platforms'
    | 'products'
    | 'permissions'
    | 'credentials'
    | 'webhooks'
    | 'explorer'
    | 'logs'
    | 'analytics'
    | 'roles'
    | 'review'
    | 'product_studio'
  >('overview');

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productConfigs, setProductConfigs] = useState<Record<string, ProductConfigData>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEVELOPMENT' | 'LIVE'>('ALL');

  // Wizard modal state
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  // Wizard form fields
  const [wizardName, setWizardName] = useState('');
  const [wizardDesc, setWizardDesc] = useState('');
  const [wizardType, setWizardType] = useState<'Consumer' | 'Business' | 'Enterprise' | 'Gaming' | 'Utility'>('Consumer');
  const [wizardIcon, setWizardIcon] = useState('');
  const [wizardEmail, setWizardEmail] = useState(user?.email || 'developer@prigid.com');
  const [wizardWebsite, setWizardWebsite] = useState('');
  const [wizardPrivacy, setWizardPrivacy] = useState('');
  const [wizardTerms, setWizardTerms] = useState('');
  const [platformWeb, setPlatformWeb] = useState(true);
  const [platformAndroid, setPlatformAndroid] = useState(false);
  const [platformIos, setPlatformIos] = useState(false);
  const [platformServer, setPlatformServer] = useState(false);
  const [webOrigin, setWebOrigin] = useState('');
  const [webRedirect, setWebRedirect] = useState('');
  const [androidPackage, setAndroidPackage] = useState('');
  const [androidCert, setAndroidCert] = useState('');
  const [iosBundle, setIosBundle] = useState('');

  // Products catalogue
  const [productsCatalogue, setProductsCatalogue] = useState<ProductDefinition[]>([]);
  const [selectedProductForSetup, setSelectedProductForSetup] = useState<ProductDefinition | null>(null);

  // Permissions catalogue
  const [permissionsCatalogue, setPermissionsCatalogue] = useState<PermissionDefinition[]>([]);
  const [permissionCategoryFilter, setPermissionCategoryFilter] = useState('ALL');

  // Tokens state
  const [tokens, setTokens] = useState<TestToken[]>([]);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenUserId, setTokenUserId] = useState('usr_developer_sandbox');
  const [tokenScopes, setTokenScopes] = useState<string[]>(['profile.read', 'messages.send']);
  const [tokenTtl, setTokenTtl] = useState(24);
  const [justGeneratedToken, setJustGeneratedToken] = useState<TestToken | null>(null);
  const [tokenDecoderInput, setTokenDecoderInput] = useState('');
  const [decodedTokenData, setDecodedTokenData] = useState<any>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookEndpointConfig[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['message.sent', 'message.delivered']);
  const [webhookTestEvent, setWebhookTestEvent] = useState('message.sent');
  const [webhookDispatching, setWebhookDispatching] = useState(false);
  const [webhookDispatchResult, setWebhookDispatchResult] = useState<any>(null);

  // API Explorer state
  const [explorerEndpoint, setExplorerEndpoint] = useState('POST /api/developer/messages/send');
  const [explorerMethod, setExplorerMethod] = useState('POST');
  const [explorerUrlPath, setExplorerUrlPath] = useState('/api/developer/messages/send');
  const [explorerBody, setExplorerBody] = useState(
    JSON.stringify(
      {
        channelId: 'chat_support_general',
        content: 'Hello from PRIGID API Explorer Sandbox test call!',
        messageType: 'TEXT',
      },
      null,
      2
    )
  );
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerResponse, setExplorerResponse] = useState<any>(null);

  // Secrets reveal toggle
  const [revealSecret, setRevealSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load applications from Backend / LocalStorage
  useEffect(() => {
    async function loadApps() {
      setLoading(true);
      try {
        const token = localStorage.getItem('vibez_developer_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await safeFetchJson('/developer/apps', { headers });
        if (res.ok && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const mapped: DeveloperApplication[] = res.data.data.map((srvApp: any) => ({
            id: srvApp.id,
            appName: srvApp.appName,
            description: srvApp.description || 'Custom server application registered in Vibez backend.',
            appType: 'Consumer',
            iconUrl: srvApp.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
            clientId: srvApp.clientId,
            clientSecret: srvApp.clientSecret || 'vbz_sec_••••••••••••••••••••••••',
            status: srvApp.isProduction ? 'LIVE' : 'DEVELOPMENT',
            contactEmail: user?.email || 'developer@prigid.com',
            websiteUrl: srvApp.websiteUrl || 'https://vibez.prigid.com',
            platforms: {
              website: {
                origins: srvApp.allowedRedirectUris || [],
                redirectUris: srvApp.allowedRedirectUris || [],
              },
            },
            enabledProducts: ['prod_messaging', 'prod_auth', 'prod_webhooks'],
            permissions: { 'profile.read': 'APPROVED', 'messages.send': 'APPROVED' },
            createdAt: srvApp.createdAt?.split('T')[0] || '2026-08-15',
          }));
          setApps(mapped);
          saveAppsToStorage(mapped);
        } else {
          // Fallback to storage or defaults
          const saved = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setApps(parsed);
            } catch {
              setApps(INITIAL_APPS);
            }
          } else {
            setApps(INITIAL_APPS);
            saveAppsToStorage(INITIAL_APPS);
          }
        }
      } catch {
        setApps(INITIAL_APPS);
      } finally {
        setLoading(false);
      }
    }

    loadApps();
  }, [user]);

  // Load products & permissions catalogue
  useEffect(() => {
    async function loadCatalogues() {
      try {
        const prodRes = await safeFetchJson('/developer/products');
        if (prodRes.ok && Array.isArray(prodRes.data?.data)) {
          setProductsCatalogue(prodRes.data.data);
        }
        const permRes = await safeFetchJson('/developer/permissions');
        if (permRes.ok && Array.isArray(permRes.data?.data)) {
          setPermissionsCatalogue(permRes.data.data);
        }
      } catch {
        // Fallbacks will be handled gracefully
      }
    }
    loadCatalogues();
  }, []);

  // Sync active app
  useEffect(() => {
    if (apps.length > 0 && !activeApp) {
      const savedActiveId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_APP_KEY);
      const found = apps.find((a) => a.id === savedActiveId);
      if (found) {
        setActiveApp(found);
      }
    }
  }, [apps, activeApp]);

  // Load webhooks & test tokens for current app
  useEffect(() => {
    if (!activeApp) return;

    const savedTokensKey = `prigid_tokens_${activeApp.id}`;
    const savedTokens = localStorage.getItem(savedTokensKey);
    if (savedTokens) {
      try {
        setTokens(JSON.parse(savedTokens));
      } catch {
        setTokens([]);
      }
    } else {
      const defaultToken: TestToken = {
        id: `tok_${activeApp.clientId.slice(-6)}_01`,
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfZGV2ZWxvcGVyXzAxIiwiYXBwSWQiOiIke2FjdGl2ZUFwcC5pZH0iLCJzY29wZXMiOlsicHJvZmlsZS5yZWFkIiwibWVzc2FnZXMuc2VuZCJdfQ.sig`,
        userId: 'usr_developer_01',
        scopes: ['profile.read', 'messages.send'],
        createdAt: '2026-10-01',
        expiresAt: '2026-10-15',
        status: 'ACTIVE',
      };
      setTokens([defaultToken]);
    }

    const savedWebhooksKey = `prigid_webhooks_${activeApp.id}`;
    const savedWebhooks = localStorage.getItem(savedWebhooksKey);
    if (savedWebhooks) {
      try {
        setWebhooks(JSON.parse(savedWebhooks));
      } catch {
        setWebhooks([]);
      }
    } else {
      const defaultWebhook: WebhookEndpointConfig = {
        id: `wh_${activeApp.clientId.slice(-6)}_01`,
        url: 'https://api.yourdomain.com/v1/webhooks/vibez',
        secret: 'whsec_vibez_live_c48921e104b901a884ef11',
        verifyToken: 'vibez_verify_token_998877',
        subscribedEvents: ['message.sent', 'message.delivered', 'call.initiated'],
        isEnabled: true,
        createdAt: '2026-09-10',
      };
      setWebhooks([defaultWebhook]);
    }
  }, [activeApp]);

  // Load product configurations for activeApp
  useEffect(() => {
    if (!activeApp) return;

    const storageKey = `prigid_app_product_configs_${activeApp.id}`;
    const saved = localStorage.getItem(storageKey);
    let loaded: Record<string, ProductConfigData> = {};
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch {}
    }

    safeFetchJson(`/developer/apps/${activeApp.id}/products`)
      .then((res) => {
        if (res.ok && Array.isArray(res.data?.data)) {
          res.data.data.forEach((ap: any) => {
            if (ap.productId && ap.config) {
              loaded[ap.productId] = { ...loaded[ap.productId], ...ap.config };
            }
          });
          setProductConfigs({ ...loaded });
        }
      })
      .catch(() => {});

    setProductConfigs(loaded);
  }, [activeApp]);

  function handleUpdateProductConfig(productId: string, newConfig: ProductConfigData) {
    if (!activeApp) return;
    const updated = {
      ...productConfigs,
      [productId]: newConfig,
    };
    setProductConfigs(updated);
    localStorage.setItem(`prigid_app_product_configs_${activeApp.id}`, JSON.stringify(updated));

    safeFetchJson(`/developer/apps/${activeApp.id}/products/${productId}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: newConfig }),
    }).catch(() => {});
  }

  function saveAppsToStorage(updatedApps: DeveloperApplication[]) {
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(updatedApps));
  }

  function handleSelectApp(app: DeveloperApplication) {
    setActiveApp(app);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_APP_KEY, app.id);
    setSelectedProductId(null);
    setActiveTab('overview');
  }

  function handleBackToApps() {
    setActiveApp(null);
    setSelectedProductId(null);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_APP_KEY);
  }

  function copyToClipboard(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  // Create Application Wizard handler
  async function handleCreateApplicationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wizardName.trim() || !wizardEmail.trim()) return;

    setWizardSubmitting(true);
    const newAppId = `app_${wizardName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const newClientId = `vibez_client_${Math.random().toString(36).substring(2, 10)}`;
    const newClientSecret = `vbz_sec_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`;

    const newApp: DeveloperApplication = {
      id: newAppId,
      appName: wizardName.trim(),
      description: wizardDesc.trim() || 'Custom application on the PRIGID Developer Platform.',
      appType: wizardType,
      iconUrl: wizardIcon.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      clientId: newClientId,
      clientSecret: newClientSecret,
      status: 'DEVELOPMENT',
      contactEmail: wizardEmail.trim(),
      websiteUrl: wizardWebsite.trim() || undefined,
      privacyPolicyUrl: wizardPrivacy.trim() || undefined,
      termsOfServiceUrl: wizardTerms.trim() || undefined,
      platforms: {
        website: platformWeb ? { origins: webOrigin ? [webOrigin] : [], redirectUris: webRedirect ? [webRedirect] : [] } : undefined,
        android: platformAndroid ? { packageName: androidPackage, sha256Fingerprints: androidCert ? [androidCert] : [] } : undefined,
        ios: platformIos ? { bundleId: iosBundle } : undefined,
        server: platformServer ? { enabled: true } : undefined,
      },
      enabledProducts: ['prod_messaging', 'prod_auth'],
      permissions: {
        'profile.read': 'APPROVED',
        'messages.send': 'APPROVED',
      },
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Attempt backend registration
    try {
      const token = localStorage.getItem('vibez_developer_token');
      await safeFetchJson('/developer/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          appName: newApp.appName,
          description: newApp.description,
          appType: newApp.appType,
          contactEmail: newApp.contactEmail,
          websiteUrl: newApp.websiteUrl,
          privacyPolicyUrl: newApp.privacyPolicyUrl,
          termsOfServiceUrl: newApp.termsOfServiceUrl,
          platforms: newApp.platforms,
        }),
      });
    } catch {
      // Local fallback continues
    }

    const updated = [newApp, ...apps];
    setApps(updated);
    saveAppsToStorage(updated);
    setActiveApp(newApp);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_APP_KEY, newApp.id);
    setWizardSubmitting(false);
    setShowCreateWizard(false);
    setWizardStep(1);
  }

  // Toggle App Status (Development <-> Live)
  function handleToggleAppStatus() {
    if (!activeApp) return;
    const newStatus: 'DEVELOPMENT' | 'LIVE' = activeApp.status === 'DEVELOPMENT' ? 'LIVE' : 'DEVELOPMENT';
    const updated = apps.map((a) => (a.id === activeApp.id ? { ...a, status: newStatus } : a));
    setApps(updated);
    setActiveApp({ ...activeApp, status: newStatus });
    saveAppsToStorage(updated);
  }


  // Install / Remove Product
  function handleToggleProduct(productId: string) {
    if (!activeApp) return;
    const isInstalled = activeApp.enabledProducts.includes(productId);
    const newProducts = isInstalled
      ? activeApp.enabledProducts.filter((p) => p !== productId)
      : [...activeApp.enabledProducts, productId];

    const updated = apps.map((a) => (a.id === activeApp.id ? { ...a, enabledProducts: newProducts } : a));
    setApps(updated);
    setActiveApp({ ...activeApp, enabledProducts: newProducts });
    saveAppsToStorage(updated);
    setSelectedProductForSetup(null);

    if (!isInstalled) {
      setSelectedProductId(productId);
      setActiveTab('product_studio');
    } else if (selectedProductId === productId) {
      setSelectedProductId(null);
      setActiveTab('overview');
    }
  }

  // Update Permission status
  function handleTogglePermission(permId: string) {
    if (!activeApp) return;
    const current = activeApp.permissions[permId] || 'AVAILABLE';
    let nextState: 'AVAILABLE' | 'REQUESTED' | 'APPROVED' | 'RESTRICTED' = 'AVAILABLE';

    if (current === 'AVAILABLE') nextState = 'REQUESTED';
    else if (current === 'REQUESTED') nextState = 'APPROVED';
    else if (current === 'APPROVED') nextState = 'AVAILABLE';
    else nextState = 'AVAILABLE';

    const newPerms = { ...activeApp.permissions, [permId]: nextState };
    const updated = apps.map((a) => (a.id === activeApp.id ? { ...a, permissions: newPerms } : a));
    setApps(updated);
    setActiveApp({ ...activeApp, permissions: newPerms });
    saveAppsToStorage(updated);
  }

  // Generate Test Token
  async function handleGenerateTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeApp) return;

    let issuedToken: TestToken;
    try {
      const tokenHeader = localStorage.getItem('vibez_developer_token');
      const res = await safeFetchJson(`/developer/apps/${activeApp.id}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenHeader ? { Authorization: `Bearer ${tokenHeader}` } : {}),
        },
        body: JSON.stringify({
          userId: tokenUserId,
          scopes: tokenScopes,
          ttlHours: tokenTtl,
        }),
      });

      if (res.ok && res.data?.data?.token) {
        issuedToken = {
          id: res.data.data.tokenId,
          token: res.data.data.token,
          userId: tokenUserId,
          scopes: tokenScopes,
          createdAt: new Date().toISOString().split('T')[0],
          expiresAt: res.data.data.expiresAt?.split('T')[0] || new Date(Date.now() + tokenTtl * 3600000).toISOString().split('T')[0],
          status: 'ACTIVE',
        };
      } else {
        throw new Error('Fallback to local generation');
      }
    } catch {
      issuedToken = {
        id: `tok_${Math.random().toString(36).substring(2, 8)}`,
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
          JSON.stringify({
            sub: tokenUserId,
            appId: activeApp.id,
            scopes: tokenScopes,
            exp: Math.floor(Date.now() / 1000) + tokenTtl * 3600,
          })
        )}.sig_${Math.random().toString(36).substring(2, 12)}`,
        userId: tokenUserId,
        scopes: tokenScopes,
        createdAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + tokenTtl * 3600000).toISOString().split('T')[0],
        status: 'ACTIVE',
      };
    }

    const updatedTokens = [issuedToken, ...tokens];
    setTokens(updatedTokens);
    localStorage.setItem(`prigid_tokens_${activeApp.id}`, JSON.stringify(updatedTokens));
    setJustGeneratedToken(issuedToken);
    setShowTokenModal(false);
  }

  // Revoke Test Token
  function handleRevokeToken(tokenId: string) {
    if (!activeApp) return;
    const updated = tokens.map((t) => (t.id === tokenId ? { ...t, status: 'REVOKED' as const } : t));
    setTokens(updated);
    localStorage.setItem(`prigid_tokens_${activeApp.id}`, JSON.stringify(updated));
  }

  // Decode Token Inspect
  function handleDecodeToken() {
    if (!tokenDecoderInput.trim()) return;
    try {
      const parts = tokenDecoderInput.trim().split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        setDecodedTokenData(payload);
      } else {
        setDecodedTokenData({ error: 'Invalid JWT structure. Needs header.payload.signature' });
      }
    } catch (e: any) {
      setDecodedTokenData({ error: 'Could not decode token base64 payload: ' + e.message });
    }
  }

  // Add Webhook Endpoint
  function handleAddWebhookSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeApp || !newWebhookUrl.trim()) return;

    const newEndpoint: WebhookEndpointConfig = {
      id: `wh_${Math.random().toString(36).substring(2, 8)}`,
      url: newWebhookUrl.trim(),
      secret: newWebhookSecret.trim() || `whsec_${Math.random().toString(36).substring(2, 16)}`,
      verifyToken: `vtoken_${Math.random().toString(36).substring(2, 10)}`,
      subscribedEvents: newWebhookEvents,
      isEnabled: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newEndpoint, ...webhooks];
    setWebhooks(updated);
    localStorage.setItem(`prigid_webhooks_${activeApp.id}`, JSON.stringify(updated));
    setNewWebhookUrl('');
    setNewWebhookSecret('');
  }

  // Send Test Webhook
  async function handleDispatchTestWebhook(endpointUrl: string, secretKey: string) {
    setWebhookDispatching(true);
    setWebhookDispatchResult(null);

    try {
      const token = localStorage.getItem('vibez_developer_token');
      const res = await safeFetchJson('/developer/webhooks/test-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          endpointUrl,
          secretKey,
          event: webhookTestEvent,
        }),
      });

      if (res.ok && res.data?.data) {
        setWebhookDispatchResult(res.data.data);
      } else {
        setWebhookDispatchResult({
          deliveryStatus: 'SIMULATED_SUCCESS',
          statusCode: 200,
          latencyMs: 142,
          endpointUrl,
          signatureHeader: `t=${Math.floor(Date.now() / 1000)},v1=a84bc9120e8ff...`,
          responseSnippet: '{"received":true,"status":"acknowledged"}',
        });
      }
    } catch {
      setWebhookDispatchResult({
        deliveryStatus: 'SIMULATED_DELIVERED',
        statusCode: 200,
        latencyMs: 185,
        endpointUrl,
        signatureHeader: `t=${Math.floor(Date.now() / 1000)},v1=99e4f201aa99...`,
        responseSnippet: 'OK',
      });
    } finally {
      setWebhookDispatching(false);
    }
  }

  // API Explorer Execute
  async function handleExecuteExplorerCall() {
    setExplorerLoading(true);
    setExplorerResponse(null);
    const startTime = Date.now();

    try {
      let bodyData: any = undefined;
      if (explorerMethod !== 'GET' && explorerMethod !== 'HEAD' && explorerBody.trim()) {
        try {
          bodyData = JSON.parse(explorerBody);
        } catch {
          bodyData = explorerBody;
        }
      }

      const activeAuthToken = tokens.find((t) => t.status === 'ACTIVE')?.token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client': 'PRIGID-API-Explorer',
        ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
      };

      const res = await safeFetchJson(explorerUrlPath, {
        method: explorerMethod,
        headers,
        ...(bodyData ? { body: JSON.stringify(bodyData) } : {}),
      });

      const latency = Date.now() - startTime;
      setExplorerResponse({
        status: res.status || (res.ok ? 200 : 400),
        statusText: res.ok ? 'OK' : 'Error',
        latencyMs: latency,
        data: res.data,
      });
    } catch (err: any) {
      setExplorerResponse({
        status: 500,
        statusText: 'Internal Error',
        latencyMs: Date.now() - startTime,
        data: { error: err.message },
      });
    } finally {
      setExplorerLoading(false);
    }
  }

  // Filtered Apps list
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* View 1: Application Dashboard for an active app */}
      {activeApp ? (
        <div className="space-y-6">
          {/* Top Bar / Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[#090d18] border border-slate-800 shadow-xl">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={handleBackToApps}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">All Apps</span>
              </button>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 overflow-hidden shrink-0 flex items-center justify-center p-1">
                {activeApp.iconUrl ? (
                  <img src={activeApp.iconUrl} alt={activeApp.appName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Layers className="w-6 h-6 text-emerald-400" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white truncate">{activeApp.appName}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      activeApp.status === 'LIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {activeApp.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                  <span className="flex items-center gap-1">
                    App ID: <span className="text-slate-200 font-bold">{activeApp.id}</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(activeApp.id, 'app_id')}
                    className="hover:text-emerald-400 transition-colors"
                    title="Copy App ID"
                  >
                    {copiedKey === 'app_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleAppStatus}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border ${
                  activeApp.status === 'LIVE'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 font-black'
                }`}
              >
                {activeApp.status === 'LIVE' ? (
                  <>
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Switch to Development</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Go Live (Production)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab('explorer')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">API Explorer</span>
              </button>
            </div>
          </div>

          {/* App Workspace with Dedicated Left Navigation */}
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Dedicated Left-Navigation Sidebar */}
            <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:sticky lg:top-20">
              <div className="p-3 rounded-2xl bg-[#090d18] border border-slate-800/80 space-y-4 shadow-xl">
                {/* Application Core Navigation */}
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Application Tools
                  </div>
                  {[
                    { id: 'overview', label: 'Overview', icon: Layers },
                    { id: 'settings', label: 'App Settings', icon: Settings },
                    { id: 'platforms', label: 'Platforms', icon: Globe },
                    { id: 'products', label: 'Product Catalog', icon: ShoppingBag, badge: productsCatalogue.length },
                    { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
                    { id: 'credentials', label: 'Tokens & Keys', icon: KeyRound },
                    { id: 'webhooks', label: 'Global Webhooks', icon: Webhook, badge: webhooks.length },
                    { id: 'explorer', label: 'API Explorer', icon: Terminal },
                    { id: 'logs', label: 'Traffic Logs', icon: Activity },
                    { id: 'analytics', label: 'Analytics', icon: Sliders },
                    { id: 'roles', label: 'Roles', icon: Users },
                    { id: 'review', label: 'App Review', icon: CheckCircle2 },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSelectedProductId(null);
                          setActiveTab(tab.id as any);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
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

                {/* Dedicated Left-Navigation for Activated Products */}
                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      Activated Products
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      {activeApp.enabledProducts.length}
                    </span>
                  </div>

                  {activeApp.enabledProducts.length === 0 ? (
                    <div className="p-3 text-center rounded-xl bg-slate-950/60 border border-slate-800/40 text-[11px] font-mono text-slate-500">
                      No products added yet.
                    </div>
                  ) : (
                    activeApp.enabledProducts.map((prodId) => {
                      const prod = productsCatalogue.find((p) => p.id === prodId) || {
                        id: prodId,
                        name: prodId.replace('prod_', '').toUpperCase(),
                        category: 'API Product',
                      };
                      const isSelected = activeTab === 'product_studio' && selectedProductId === prodId;

                      return (
                        <button
                          key={prodId}
                          onClick={() => {
                            setSelectedProductId(prodId);
                            setActiveTab('product_studio');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all group ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25'
                              : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Zap
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-slate-950' : 'text-emerald-400 group-hover:scale-110 transition-transform'
                              }`}
                            />
                            <span className="truncate">{prod.name}</span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                              isSelected
                                ? 'bg-slate-950/20 text-slate-950'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            Active
                          </span>
                        </button>
                      );
                    })
                  )}

                  <button
                    onClick={() => {
                      setSelectedProductId(null);
                      setActiveTab('products');
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-dashed border-slate-700/80 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 text-xs font-mono flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Products</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 w-full space-y-6">

          {/* Tab Content 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#090d18] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>App Status</span>
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{activeApp.status}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Type: <span className="text-slate-200 font-bold">{activeApp.appType}</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#090d18] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Installed Products</span>
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{activeApp.enabledProducts.length}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Active API products</div>
                </div>

                <div className="p-5 rounded-3xl bg-[#090d18] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Active Tokens</span>
                    <KeyRound className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{tokens.filter((t) => t.status === 'ACTIVE').length}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Scoped test JWTs</div>
                </div>

                <div className="p-5 rounded-3xl bg-[#090d18] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Configured Webhooks</span>
                    <Webhook className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{webhooks.length}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Signed with HMAC-SHA256</div>
                </div>
              </div>

              {/* Client Credentials Card */}
              <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Application Credentials</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">OAuth2 Client Credentials Grant</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>App ID / Client ID</span>
                      <button
                        onClick={() => copyToClipboard(activeApp.clientId, 'client_id')}
                        className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === 'client_id' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-white break-all">{activeApp.clientId}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>App Secret (Confidential)</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setRevealSecret(!revealSecret)}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          {revealSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{revealSecret ? 'Hide' : 'Reveal'}</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(activeApp.clientSecret, 'client_secret')}
                          className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'client_secret' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-white break-all">
                      {revealSecret ? activeApp.clientSecret : '••••••••••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Installed Products Grid preview */}
              <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Installed Products</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs text-emerald-400 hover:underline font-mono flex items-center gap-1"
                  >
                    <span>Browse Product Catalogue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activeApp.enabledProducts.map((prodId) => {
                      const prod = productsCatalogue.find((p) => p.id === prodId) || {
                        id: prodId,
                        name: prodId.replace('prod_', '').toUpperCase() + ' API',
                        category: 'Core Service',
                        description: 'Installed platform service.',
                      };
                      return (
                        <div
                          key={prodId}
                          onClick={() => {
                            setSelectedProductId(prodId);
                            setActiveTab('product_studio');
                          }}
                          className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 space-y-2 cursor-pointer transition-all group shadow-sm hover:shadow-emerald-500/5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-emerald-400" />
                              {prod.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{prod.description}</p>
                          <div className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1 pt-1">
                            <span>Configure Features & Webhooks</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Settings */}
          {activeTab === 'settings' && (
            <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Application Settings</h3>
                  <p className="text-xs text-slate-400">Configure core metadata, contact points, and compliance policies.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Application Name</label>
                  <input
                    type="text"
                    defaultValue={activeApp.appName}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Contact Email</label>
                  <input
                    type="email"
                    defaultValue={activeApp.contactEmail}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Privacy Policy URL</label>
                  <input
                    type="url"
                    defaultValue={activeApp.privacyPolicyUrl || ''}
                    placeholder="https://yourdomain.com/privacy"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Terms of Service URL</label>
                  <input
                    type="url"
                    defaultValue={activeApp.termsOfServiceUrl || ''}
                    placeholder="https://yourdomain.com/terms"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3 mt-6">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Permanently delete this application and revoke all active tokens.</span>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this application?')) {
                        const updated = apps.filter((a) => a.id !== activeApp.id);
                        setApps(updated);
                        saveAppsToStorage(updated);
                        handleBackToApps();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 font-mono text-xs font-bold transition-all"
                  >
                    Delete Application
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Platforms */}
          {activeTab === 'platforms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Supported Platforms</h3>
                  <p className="text-xs text-slate-400">Configure client credentials, package identifiers, and redirect origins.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Website Platform */}
                <div className="p-5 rounded-3xl bg-[#090d18] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-white text-sm">Website / Web Client</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Configured</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-slate-400">Allowed Origins:</div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                      {activeApp.platforms.website?.origins?.[0] || 'https://vibez.prigid.com'}
                    </div>
                    <div className="text-slate-400">OAuth Callback Redirect URIs:</div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                      {activeApp.platforms.website?.redirectUris?.[0] || 'https://vibez.prigid.com/oauth/callback'}
                    </div>
                  </div>
                </div>

                {/* Android Platform */}
                <div className="p-5 rounded-3xl bg-[#090d18] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-white text-sm">Android App</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Configured</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-slate-400">Package Name:</div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                      {activeApp.platforms.android?.packageName || 'com.aistudio.vibez'}
                    </div>
                    <div className="text-slate-400">SHA-256 Certificate Fingerprint:</div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 truncate">
                      {activeApp.platforms.android?.sha256Fingerprints?.[0] || '14:5A:92:B3:7C:E4:01:8F:22:19:9C:88:B1:00:23:4E'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: Products Catalogue & Add Product */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Product Catalogue</h3>
                  <p className="text-xs text-slate-400">Add or manage API products enabled for this application.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsCatalogue.map((product) => {
                  const isInstalled = activeApp.enabledProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                        isInstalled
                          ? 'bg-[#090d18] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                          : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                            {product.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isInstalled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isInstalled ? 'Installed' : 'Available'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white">{product.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-slate-500">Endpoints:</div>
                          <div className="flex flex-wrap gap-1">
                            {product.endpoints.slice(0, 2).map((ep, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                                {ep}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {isInstalled ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setActiveTab('product_studio');
                              }}
                              className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black transition-all shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Configure</span>
                            </button>
                            <button
                              onClick={() => handleToggleProduct(product.id)}
                              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 text-xs transition-all"
                              title="Remove Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleProduct(product.id)}
                            className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Set Up & Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content 5: Permissions Matrix */}
          {activeTab === 'permissions' && (
            <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Permissions Matrix</h3>
                  <p className="text-xs text-slate-400">Control granular scopes requested by this application.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Filter:</span>
                  <select
                    value={permissionCategoryFilter}
                    onChange={(e) => setPermissionCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="User Identity">User Identity</option>
                    <option value="Messaging">Messaging</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Calling">Calling</option>
                    <option value="Webhooks">Webhooks</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Permission Name</th>
                      <th className="pb-3 font-semibold">Product</th>
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {permissionsCatalogue
                      .filter((p) => permissionCategoryFilter === 'ALL' || p.category === permissionCategoryFilter)
                      .map((perm) => {
                        const status = activeApp.permissions[perm.id] || 'AVAILABLE';
                        return (
                          <tr key={perm.id} className="hover:bg-slate-900/40">
                            <td className="py-3 font-bold text-emerald-400">{perm.name}</td>
                            <td className="py-3 text-slate-300">{perm.product}</td>
                            <td className="py-3 text-slate-400 max-w-xs">{perm.description}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  status === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : status === 'REQUESTED'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleTogglePermission(perm.id)}
                                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-200 text-xs font-bold transition-all"
                              >
                                {status === 'AVAILABLE' ? 'Request' : status === 'REQUESTED' ? 'Approve' : 'Toggle'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content 6: Credentials & Tokens */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Token Management</h3>
                  <p className="text-xs text-slate-400">Generate scoped test access tokens and inspect live JWT structures.</p>
                </div>

                <button
                  onClick={() => setShowTokenModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Test Token</span>
                </button>
              </div>

              {/* Just Generated Token Highlight */}
              {justGeneratedToken && (
                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>New Test Token Generated (Save Now)</span>
                    </div>
                    <button
                      onClick={() => setJustGeneratedToken(null)}
                      className="text-slate-400 hover:text-white text-xs font-mono"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-white break-all flex items-center justify-between gap-2">
                    <span className="truncate">{justGeneratedToken.token}</span>
                    <button
                      onClick={() => copyToClipboard(justGeneratedToken.token, 'just_token')}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black shrink-0 text-xs"
                    >
                      {copiedKey === 'just_token' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Active Tokens Table */}
              <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white">Active Test Tokens</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3 font-semibold">Token ID</th>
                        <th className="pb-3 font-semibold">Subject / User</th>
                        <th className="pb-3 font-semibold">Scopes</th>
                        <th className="pb-3 font-semibold">Expires At</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {tokens.map((tok) => (
                        <tr key={tok.id} className="hover:bg-slate-900/40">
                          <td className="py-3 font-bold text-white">{tok.id}</td>
                          <td className="py-3 text-slate-300">{tok.userId}</td>
                          <td className="py-3 text-emerald-400">{tok.scopes.join(', ')}</td>
                          <td className="py-3 text-slate-400">{tok.expiresAt}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tok.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {tok.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {tok.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleRevokeToken(tok.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold transition-all"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-slate-600">Revoked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Token Inspector */}
              <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white">Token Inspector & Decoder</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste any JWT token here to inspect payload..."
                      value={tokenDecoderInput}
                      onChange={(e) => setTokenDecoderInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleDecodeToken}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold"
                    >
                      Decode
                    </button>
                  </div>

                  {decodedTokenData && (
                    <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                      {JSON.stringify(decodedTokenData, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 7: Webhooks */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Webhooks & Event Stream</h3>
                  <p className="text-xs text-slate-400">Receive real-time push events signed with HMAC-SHA256 headers.</p>
                </div>
              </div>

              {/* Add Webhook Form */}
              <form onSubmit={handleAddWebhookSubmit} className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white">Register Webhook Endpoint</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400">Callback HTTPS URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://api.yourdomain.com/v1/webhooks"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400">Signing Secret Key (optional)</label>
                    <input
                      type="text"
                      placeholder="whsec_auto_generated..."
                      value={newWebhookSecret}
                      onChange={(e) => setNewWebhookSecret(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
                >
                  Save Webhook Endpoint
                </button>
              </form>

              {/* Endpoints List */}
              <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white">Registered Endpoints</h4>
                <div className="space-y-3">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs font-mono truncate">{wh.url}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Secret: <span className="text-slate-200">{wh.secret}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDispatchTestWebhook(wh.url, wh.secret)}
                          disabled={webhookDispatching}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{webhookDispatching ? 'Sending...' : 'Test Event'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Dispatch Result */}
              {webhookDispatchResult && (
                <div className="p-5 rounded-3xl bg-[#090d18] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Test Event Dispatch Results
                    </span>
                    <span className="text-slate-400">Latency: {webhookDispatchResult.latencyMs}ms</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                    {JSON.stringify(webhookDispatchResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 8: API Explorer */}
          {activeTab === 'explorer' && (
            <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Interactive API Explorer</h3>
                  <p className="text-xs text-slate-400">Execute live requests authenticated with this app’s credentials.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Method & URL selector */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={explorerMethod}
                    onChange={(e) => setExplorerMethod(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>

                  <input
                    type="text"
                    value={explorerUrlPath}
                    onChange={(e) => setExplorerUrlPath(e.target.value)}
                    className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    onClick={handleExecuteExplorerCall}
                    disabled={explorerLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{explorerLoading ? 'Running...' : 'Execute'}</span>
                  </button>
                </div>

                {/* Pre-set endpoints dropdown */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Templates:</span>
                  {[
                    { label: 'Send Message', method: 'POST', path: '/developer/messages/send' },
                    { label: 'RTC Token', method: 'POST', path: '/developer/rtc/token' },
                    { label: 'Health Check', method: 'GET', path: '/developer/health' },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      onClick={() => {
                        setExplorerMethod(tpl.method);
                        setExplorerUrlPath(tpl.path);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px]"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                {/* Body editor */}
                {explorerMethod !== 'GET' && (
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400">JSON Request Body</label>
                    <textarea
                      rows={5}
                      value={explorerBody}
                      onChange={(e) => setExplorerBody(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Response output */}
                {explorerResponse && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">HTTP Response:</span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold ${
                            explorerResponse.status >= 200 && explorerResponse.status < 300
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          Status: {explorerResponse.status}
                        </span>
                        <span className="text-slate-400">Latency: {explorerResponse.latencyMs}ms</span>
                      </div>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-80">
                      {JSON.stringify(explorerResponse.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content 9: Logs */}
          {activeTab === 'logs' && (
            <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Traffic Audit Logs</h3>
              <p className="text-xs text-slate-400">Live stream of API requests received for App ID {activeApp.id}.</p>
              <div className="space-y-2">
                {[
                  { method: 'POST', endpoint: '/api/developer/messages/send', status: 200, time: '2026-10-13 11:04:12', latency: 45 },
                  { method: 'POST', endpoint: '/api/developer/rtc/token', status: 200, time: '2026-10-13 10:52:00', latency: 32 },
                  { method: 'GET', endpoint: '/api/developer/health', status: 200, time: '2026-10-13 10:40:19', latency: 12 },
                  { method: 'POST', endpoint: '/api/developer/oauth/token', status: 200, time: '2026-10-13 09:15:33', latency: 68 },
                ].map((log, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{log.method}</span>
                      <span className="text-white">{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>Status: {log.status}</span>
                      <span>{log.latency}ms</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content 10: Analytics */}
          {activeTab === 'analytics' && (
            <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
              <h3 className="text-base font-bold text-white">Performance Telemetry</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-mono text-slate-400">Success Rate</div>
                  <div className="text-2xl font-black text-emerald-400">99.98%</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-mono text-slate-400">Average Latency</div>
                  <div className="text-2xl font-black text-white">38ms</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-mono text-slate-400">Total Requests Today</div>
                  <div className="text-2xl font-black text-teal-400">4,812</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 11: Roles */}
          {activeTab === 'roles' && (
            <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Roles & Collaborators</h3>
                  <p className="text-xs text-slate-400">Manage developer team members and role privileges.</p>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs font-mono">
                  + Add Member
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {user?.name?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{user?.name || 'Primary Developer'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user?.email || 'developer@prigid.com'}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                    Administrator (Owner)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 12: App Review */}
          {activeTab === 'review' && (
            <div className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 space-y-6">
              <h3 className="text-base font-bold text-white">App Review & Going Live</h3>
              <p className="text-xs text-slate-400">
                To move your app from Development to Live status, complete all policy and integration requirements.
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Valid Developer Contact Email provided', complete: true },
                  { label: 'Application Icon and description uploaded', complete: true },
                  { label: 'Privacy Policy URL and Terms configured', complete: !!activeApp.privacyPolicyUrl },
                  { label: 'At least one supported platform verified', complete: true },
                  { label: 'Security test token issued and verified', complete: tokens.length > 0 },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-200">{item.label}</span>
                    {item.complete ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono">
                        <Check className="w-4 h-4" /> Passed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                        <AlertTriangle className="w-4 h-4" /> Action Required
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleToggleAppStatus}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                >
                  {activeApp.status === 'LIVE' ? 'Application is Currently Live' : 'Request Production Access & Go Live'}
                </button>
              </div>
            </div>
          )}

          {/* Tab Content 13: Dedicated Product Studio (Configuration, Features, Sub-Features & Webhooks) */}
          {activeTab === 'product_studio' && (() => {
            const currentProd =
              productsCatalogue.find((p) => p.id === selectedProductId) ||
              productsCatalogue.find((p) => activeApp.enabledProducts.includes(p.id)) ||
              productsCatalogue[0];

            if (!currentProd) {
              return (
                <div className="p-12 rounded-3xl bg-[#090d18] border border-slate-800 text-center space-y-4">
                  <Layers className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-mono text-slate-400">Please select an activated product from the left navigation.</p>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono text-xs font-bold"
                  >
                    Browse Products Catalog
                  </button>
                </div>
              );
            }

            return (
              <ProductStudio
                key={currentProd.id}
                product={currentProd}
                app={activeApp}
                config={productConfigs[currentProd.id] || {}}
                onUpdateConfig={(updatedCfg) => handleUpdateProductConfig(currentProd.id, updatedCfg)}
                onRemoveProduct={() => handleToggleProduct(currentProd.id)}
                onNavigateToExplorer={(endpoint, method) => {
                  setExplorerEndpoint(endpoint.split(' ')[1] || endpoint);
                  setExplorerMethod((endpoint.split(' ')[0] || 'POST') as any);
                  setActiveTab('explorer');
                }}
              />
            );
          })()}
            </main>
          </div>
        </div>
      ) : (
        /* View 2: "My Apps" Dashboard */
        <div className="space-y-6">
          {/* Dashboard Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-[#090d18] border border-slate-800 shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>PRIGID DEVELOPER CONSOLE</span>
              </div>
              <h1 className="text-2xl font-black text-white">My Applications</h1>
              <p className="text-xs text-slate-400">
                Register, configure, and monitor applications powered by the Vibez developer ecosystem.
              </p>
            </div>

            <button
              onClick={() => {
                setWizardStep(1);
                setShowCreateWizard(true);
              }}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create App</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#090d18] border border-slate-800/80">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Search apps by name, App ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Status:</span>
              {(['ALL', 'LIVE', 'DEVELOPMENT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all font-bold ${
                    statusFilter === st
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Apps Cards Grid */}
          {filteredApps.length === 0 ? (
            /* Welcome / Zero State Screen */
            <div className="p-12 rounded-3xl bg-[#090d18] border border-slate-800 text-center max-w-2xl mx-auto space-y-6 my-8">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Layers className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Welcome to PRIGID Developer Platform</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Build and scale applications with high-concurrency Messaging APIs, WebRTC calling signaling, HMAC-SHA256 webhooks, and secure scoped tokens.
                </p>
              </div>

              <button
                onClick={() => {
                  setWizardStep(1);
                  setShowCreateWizard(true);
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Application</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-3xl bg-[#090d18] border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {app.iconUrl ? (
                            <img src={app.iconUrl} alt={app.appName} className="w-full h-full object-cover" />
                          ) : (
                            <Layers className="w-6 h-6 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {app.appName}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-500">{app.appType}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          app.status === 'LIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{app.description}</p>

                    {/* App ID snippet */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span className="truncate">ID: {app.id}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(app.id, app.id);
                        }}
                        className="text-slate-500 hover:text-emerald-400 ml-2"
                        title="Copy App ID"
                      >
                        {copiedKey === app.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Products & Platforms Summary */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {app.enabledProducts.length} Products
                      </span>
                      {app.platforms.android && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                          Android
                        </span>
                      )}
                      {app.platforms.website && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-teal-400">
                          Web
                        </span>
                      )}
                      {app.platforms.server && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400">
                          Server
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectApp(app)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 border border-slate-800 hover:border-emerald-400 text-slate-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Manage Application</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create Application Multi-Step Wizard */}
      {showCreateWizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#090d18] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Create New Application</h3>
                <p className="text-xs text-slate-400">Step {wizardStep} of 4</p>
              </div>
              <button
                onClick={() => setShowCreateWizard(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              {[
                { s: 1, label: 'App Info' },
                { s: 2, label: 'Contact & Policy' },
                { s: 3, label: 'Platforms' },
                { s: 4, label: 'Review' },
              ].map((step) => (
                <div
                  key={step.s}
                  className={`py-1.5 rounded-xl border text-[11px] font-bold ${
                    wizardStep === step.s
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : wizardStep > step.s
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-950 text-slate-600 border-slate-800'
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>

            {/* Step 1: App Info */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">App Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., My Awesome App"
                    value={wizardName}
                    onChange={(e) => setWizardName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe what your app accomplishes..."
                    value={wizardDesc}
                    onChange={(e) => setWizardDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">App Type</label>
                  <select
                    value={wizardType}
                    onChange={(e) => setWizardType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Consumer">Consumer App</option>
                    <option value="Business">Business Solution</option>
                    <option value="Enterprise">Enterprise SSO</option>
                    <option value="Gaming">Gaming / Interactive</option>
                    <option value="Utility">Utility Service</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">App Icon Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={wizardIcon}
                    onChange={(e) => setWizardIcon(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact & Policy */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={wizardEmail}
                    onChange={(e) => setWizardEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.com"
                    value={wizardWebsite}
                    onChange={(e) => setWizardWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Privacy Policy URL</label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.com/privacy"
                    value={wizardPrivacy}
                    onChange={(e) => setWizardPrivacy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Terms of Service URL</label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.com/terms"
                    value={wizardTerms}
                    onChange={(e) => setWizardTerms(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Platforms */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-mono">Select target platforms for this app:</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformWeb}
                      onChange={(e) => setPlatformWeb(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-white font-mono">Website</span>
                  </label>
                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformAndroid}
                      onChange={(e) => setPlatformAndroid(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-white font-mono">Android</span>
                  </label>
                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformIos}
                      onChange={(e) => setPlatformIos(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-white font-mono">iOS</span>
                  </label>
                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformServer}
                      onChange={(e) => setPlatformServer(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-white font-mono">Server-to-Server</span>
                  </label>
                </div>

                {platformAndroid && (
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs font-bold text-emerald-400 font-mono">Android Configuration</div>
                    <input
                      type="text"
                      placeholder="Package Name: com.example.app"
                      value={androidPackage}
                      onChange={(e) => setAndroidPackage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                    />
                    <input
                      type="text"
                      placeholder="SHA-256 Fingerprint: 14:5A:92:B3..."
                      value={androidCert}
                      onChange={(e) => setAndroidCert(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="text-slate-400">
                    App Name: <span className="text-white font-bold">{wizardName}</span>
                  </div>
                  <div className="text-slate-400">
                    Type: <span className="text-white font-bold">{wizardType}</span>
                  </div>
                  <div className="text-slate-400">
                    Contact: <span className="text-white font-bold">{wizardEmail}</span>
                  </div>
                  <div className="text-slate-400">
                    Status: <span className="text-amber-400 font-bold">DEVELOPMENT</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  After creating your app, a unique Client ID and secret will be provisioned. You can add products and request permissions immediately.
                </p>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  disabled={wizardStep === 1 && !wizardName.trim()}
                  onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs font-mono uppercase tracking-wider"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateApplicationSubmit}
                  disabled={wizardSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider"
                >
                  {wizardSubmitting ? 'Creating...' : 'Confirm & Create App'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Generate Test Token */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleGenerateTokenSubmit}
            className="w-full max-w-md bg-[#090d18] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Generate Test Token</h3>
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Subject / User ID</label>
              <input
                type="text"
                required
                value={tokenUserId}
                onChange={(e) => setTokenUserId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Token Validity (TTL Hours)</label>
              <select
                value={tokenTtl}
                onChange={(e) => setTokenTtl(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
              >
                <option value={1}>1 Hour (Short lived)</option>
                <option value={24}>24 Hours (Standard)</option>
                <option value={168}>7 Days (Extended Sandbox)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-mono text-slate-400">Select Scopes:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {['profile.read', 'profile.update', 'messages.send', 'messages.read', 'rtc:signaling', 'webhooks.manage'].map((sc) => (
                  <label key={sc} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tokenScopes.includes(sc)}
                      onChange={(e) => {
                        if (e.target.checked) setTokenScopes([...tokenScopes, sc]);
                        else setTokenScopes(tokenScopes.filter((s) => s !== sc));
                      }}
                      className="accent-emerald-500"
                    />
                    <span className="text-slate-300 text-[11px] truncate">{sc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                Issue Token
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
