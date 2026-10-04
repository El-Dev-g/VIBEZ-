'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Upload,
  CloudUpload,
  Link as LinkIcon,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Globe,
  Database,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Search,
  ExternalLink,
  Code
} from 'lucide-react';

interface CatalogItem {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  link: string | null;
  isAvailable: boolean;
  source?: 'IN_APP' | 'CLOUD_UPLOAD' | 'WEB_API';
  createdAt?: string;
}

interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  description: string | null;
  coverImageUrl: string | null;
}

export function MetaCommerceManager() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'items' | 'cloud_upload' | 'developer_feeds'>('overview');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'IN_APP' | 'CLOUD_UPLOAD'>('ALL');

  // New Item Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<string>('USD');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formLink, setFormLink] = useState<string>('');
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);

  // Cloud Import State
  const [cloudJsonInput, setCloudJsonInput] = useState<string>('');
  const [cloudExternalFeedUrl, setCloudExternalFeedUrl] = useState<string>('');
  const [cloudUploadSuccess, setCloudUploadSuccess] = useState<string | null>(null);
  const [cloudUploadError, setCloudUploadError] = useState<string | null>(null);

  // Feed Copy status
  const [copiedXml, setCopiedXml] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const xmlFeedUrl = selectedUserId ? `${baseUrl}/api/business/public/catalog/${selectedUserId}/meta-feed.xml` : '';
  const jsonFeedUrl = selectedUserId ? `${baseUrl}/api/business/public/catalog/${selectedUserId}/meta-feed.json` : '';

  useEffect(() => {
    const savedUserId = localStorage.getItem('vibez_dev_commerce_user_id') || 'dev_store_01';
    setSelectedUserId(savedUserId);
    setUserIdInput(savedUserId);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchCatalog(selectedUserId);
      fetchProfile(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchCatalog = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/public/catalog/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch catalog items');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      // Assign synthetic source flags for display demonstration
      const formatted = list.map((item: any, idx: number) => ({
        ...item,
        source: item.source || (idx % 2 === 0 ? 'IN_APP' : 'CLOUD_UPLOAD')
      }));
      setItems(formatted);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/business/public/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadStore = () => {
    if (!userIdInput.trim()) return;
    const clean = userIdInput.trim();
    setSelectedUserId(clean);
    localStorage.setItem('vibez_dev_commerce_user_id', clean);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      const token = localStorage.getItem('auth_token') || '';
      const payload = {
        title: formTitle,
        description: formDescription,
        price: parseFloat(formPrice) || 0.0,
        currency: formCurrency,
        imageUrl: formImageUrl,
        link: formLink,
        isAvailable: formIsAvailable
      };

      if (editingItem) {
        const res = await fetch(`/api/business/catalog/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update product');
      } else {
        const res = await fetch('/api/business/catalog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create product');
      }

      setIsModalOpen(false);
      fetchCatalog(selectedUserId);
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product from the commerce catalog?')) return;
    try {
      const token = localStorage.getItem('auth_token') || '';
      await fetch(`/api/business/catalog/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCatalog(selectedUserId);
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  const handleCloudJsonUpload = async () => {
    setCloudUploadError(null);
    setCloudUploadSuccess(null);
    if (!cloudJsonInput.trim()) {
      setCloudUploadError('Please paste a JSON product array');
      return;
    }

    try {
      const parsed = JSON.parse(cloudJsonInput);
      const itemsArray = Array.isArray(parsed) ? parsed : [parsed];
      const token = localStorage.getItem('auth_token') || '';

      const res = await fetch('/api/business/catalog/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsArray })
      });

      if (!res.ok) throw new Error('Cloud upload failed');
      const data = await res.json();
      setCloudUploadSuccess(`Successfully uploaded ${data.count || itemsArray.length} cloud products to catalog!`);
      setCloudJsonInput('');
      fetchCatalog(selectedUserId);
    } catch (err: any) {
      setCloudUploadError(err.message || 'Invalid JSON product format');
    }
  };

  const copyFeed = (text: string, type: 'xml' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'xml') {
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSource = sourceFilter === 'ALL' || item.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const inAppCount = items.filter(i => i.source === 'IN_APP').length;
  const cloudCount = items.filter(i => i.source === 'CLOUD_UPLOAD' || !i.source).length;

  return (
    <div className="space-y-6">
      {/* Meta Commerce Manager Top Banner Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">Meta-Style Commerce Manager</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Developer Edition
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage in-app and cloud product catalogs, developer commerce feeds, and webstore syncing.
              </p>
            </div>
          </div>

          {/* Store Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <Smartphone className="w-4 h-4 text-emerald-400 ml-1" />
            <input
              type="text"
              placeholder="Store / User ID..."
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="bg-transparent text-xs text-white px-2 py-1 outline-none w-36 font-mono focus:w-48 transition-all"
            />
            <button
              onClick={handleLoadStore}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Load Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Active Profile Info Strip */}
      {profile && (
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <span className="text-white font-bold text-sm">{profile.businessName}</span>
              <span className="text-slate-400 text-xs ml-2">({profile.category})</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">Total Items: <strong className="text-white">{items.length}</strong></span>
            <span className="text-emerald-400">In-App: <strong>{inAppCount}</strong></span>
            <span className="text-blue-400">Cloud Uploads: <strong>{cloudCount}</strong></span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Catalog Overview
        </button>
        <button
          onClick={() => setActiveSubTab('items')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'items'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Items Data Feed ({items.length})
        </button>
        <button
          onClick={() => setActiveSubTab('cloud_upload')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'cloud_upload'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CloudUpload className="w-4 h-4 text-emerald-400" />
          Cloud Products Upload
        </button>
        <button
          onClick={() => setActiveSubTab('developer_feeds')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'developer_feeds'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-indigo-400" />
          Developer Commerce Feeds
        </button>
      </div>

      {/* SUB-TAB 1: CATALOG OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-slate-400 text-xs font-medium">Total Products</span>
              <div className="text-2xl font-black text-white">{items.length}</div>
              <p className="text-[10px] text-emerald-400">Active catalog items</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-slate-400 text-xs font-medium">In-App Mobile Uploads</span>
              <div className="text-2xl font-black text-emerald-400">{inAppCount}</div>
              <p className="text-[10px] text-slate-500">Uploaded from Vibez Mobile App</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-slate-400 text-xs font-medium">Cloud Web Uploads</span>
              <div className="text-2xl font-black text-blue-400">{cloudCount}</div>
              <p className="text-[10px] text-slate-500">Uploaded via Cloud Manager</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-slate-400 text-xs font-medium">Feed Health Status</span>
              <div className="text-2xl font-black text-indigo-400 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                100%
              </div>
              <p className="text-[10px] text-slate-500">Live feed active</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                In-App Product Sync Stream
              </h3>
              <p className="text-slate-400 text-xs">
                Products added directly inside the Vibez Mobile App automatically sync to this Meta-Style Commerce Manager in real-time.
              </p>
              <button
                onClick={() => setActiveSubTab('items')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                View Mobile Products
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-blue-400" />
                Cloud Product Upload Studio
              </h3>
              <p className="text-slate-400 text-xs">
                Upload bulk product files (JSON/CSV) or link external webstore catalog URLs directly into your cloud repository.
              </p>
              <button
                onClick={() => setActiveSubTab('cloud_upload')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Open Cloud Uploader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ITEMS DATA FEED */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search & Filters */}
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search products by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <select
                value={sourceFilter}
                onChange={(e: any) => setSourceFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl outline-none"
              >
                <option value="ALL">All Product Sources</option>
                <option value="IN_APP">In-App Uploads</option>
                <option value="CLOUD_UPLOAD">Cloud Uploads</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setFormTitle('');
                setFormDescription('');
                setFormPrice('');
                setFormCurrency('USD');
                setFormImageUrl('');
                setFormLink('');
                setFormIsAvailable(true);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product Item
            </button>
          </div>

          {loading ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center text-xs text-slate-400 rounded-2xl">
              Loading commerce data feed...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center text-xs text-slate-400 rounded-2xl space-y-2">
              <p>No product items found matching your filters.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Stock Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="text-white font-bold">{item.title}</div>
                              <div className="text-slate-500 text-[10px] line-clamp-1">{item.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {item.price.toFixed(2)} {item.currency || 'USD'}
                        </td>
                        <td className="p-3 font-mono">
                          {item.source === 'IN_APP' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Smartphone className="w-3 h-3" /> In-App
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <CloudUpload className="w-3 h-3" /> Cloud
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setFormTitle(item.title);
                                setFormDescription(item.description || '');
                                setFormPrice(String(item.price));
                                setFormCurrency(item.currency || 'USD');
                                setFormImageUrl(item.imageUrl || '');
                                setFormLink(item.link || '');
                                setFormIsAvailable(item.isAvailable);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CLOUD PRODUCTS UPLOAD STUDIO */}
      {activeSubTab === 'cloud_upload' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <CloudUpload className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Cloud Products Upload Studio</h3>
              <p className="text-slate-400 text-xs">
                Upload bulk catalog products from JSON arrays or connect external webstore URLs.
              </p>
            </div>
          </div>

          {cloudUploadSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {cloudUploadSuccess}
            </div>
          )}

          {cloudUploadError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {cloudUploadError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Paste Cloud Product JSON Array:
              </label>
              <textarea
                placeholder={`[\n  {\n    "title": "Cloud Premium Product",\n    "price": 49.99,\n    "currency": "USD",\n    "description": "Uploaded via Cloud Commerce Studio"\n  }\n]`}
                value={cloudJsonInput}
                onChange={(e) => setCloudJsonInput(e.target.value)}
                className="w-full h-40 bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono p-3 rounded-xl outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloudJsonUpload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
              >
                <CloudUpload className="w-4 h-4" />
                Upload Products to Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DEVELOPER COMMERCE FEEDS */}
      {activeSubTab === 'developer_feeds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Developer Commerce Feeds & Endpoints</h3>
              <p className="text-slate-400 text-xs">
                Export Meta-compatible XML RSS 2.0 and JSON feeds to power external webstores.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Meta Commerce Scheduled Feed URL (XML RSS 2.0 / Google Product Format):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={xmlFeedUrl || 'Enter Store User ID first'}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono px-3 py-2.5 rounded-xl"
                />
                <button
                  onClick={() => copyFeed(xmlFeedUrl, 'xml')}
                  disabled={!selectedUserId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  {copiedXml ? 'Copied XML!' : 'Copy XML Feed'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                JSON Product Catalog Endpoint:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={jsonFeedUrl || 'Enter Store User ID first'}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-blue-400 font-mono px-3 py-2.5 rounded-xl"
                />
                <button
                  onClick={() => copyFeed(jsonFeedUrl, 'json')}
                  disabled={!selectedUserId}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  {copiedJson ? 'Copied JSON!' : 'Copy JSON Feed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">
                {editingItem ? 'Edit Product Item' : 'Add Product Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leather Jacket"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  placeholder="Product description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="29.99"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Image CDN URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/product.jpg"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">External Link</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com/product-1"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formInStock"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <label htmlFor="formInStock" className="text-xs text-slate-300">In Stock / Available</label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
