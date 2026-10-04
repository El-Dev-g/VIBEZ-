'use client';

import React, { useState, useEffect } from 'react';

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

export default function CatalogManager() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'meta-feed' | 'import-export'>('items');

  // Form state for creating/editing
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<string>('USD');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formLink, setFormLink] = useState<string>('');
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);

  // Feed Copy status
  const [copiedFeedXml, setCopiedFeedXml] = useState<boolean>(false);
  const [copiedFeedJson, setCopiedFeedJson] = useState<boolean>(false);
  const [feedPreviewContent, setFeedPreviewContent] = useState<string>('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const xmlFeedUrl = selectedUserId ? `${baseUrl}/api/business/public/catalog/${selectedUserId}/meta-feed.xml` : '';
  const jsonFeedUrl = selectedUserId ? `${baseUrl}/api/business/public/catalog/${selectedUserId}/meta-feed.json` : '';

  useEffect(() => {
    // Try to get token / profile
    const savedUserId = localStorage.getItem('vibez_web_catalog_user_id');
    if (savedUserId) {
      setSelectedUserId(savedUserId);
      setUserIdInput(savedUserId);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchCatalog(selectedUserId);
      fetchProfile(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchCatalog = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/business/public/catalog/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch catalog items');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading catalog');
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

  const handleLoadUser = () => {
    if (!userIdInput.trim()) return;
    setSelectedUserId(userIdInput.trim());
    localStorage.setItem('vibez_web_catalog_user_id', userIdInput.trim());
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormCurrency('USD');
    setFormImageUrl('');
    setFormLink('');
    setFormIsAvailable(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormPrice(String(item.price));
    setFormCurrency(item.currency || 'USD');
    setFormImageUrl(item.imageUrl || '');
    setFormLink(item.link || '');
    setFormIsAvailable(item.isAvailable);
    setIsModalOpen(true);
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
        // Update
        const res = await fetch(`/api/business/catalog/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update catalog item');
      } else {
        // Create
        const res = await fetch('/api/business/catalog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to add catalog item');
      }

      setIsModalOpen(false);
      fetchCatalog(selectedUserId);
    } catch (err: any) {
      alert(err.message || 'Save error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this catalog item?')) return;
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`/api/business/catalog/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete item');
      fetchCatalog(selectedUserId);
    } catch (err: any) {
      alert(err.message || 'Delete error');
    }
  };

  const fetchFeedPreview = async (type: 'xml' | 'json') => {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`/api/business/public/catalog/${selectedUserId}/meta-feed.${type}`);
      const text = await res.text();
      setFeedPreviewContent(text);
    } catch (e) {
      setFeedPreviewContent('Error loading feed preview');
    }
  };

  const copyToClipboard = (text: string, type: 'xml' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'xml') {
      setCopiedFeedXml(true);
      setTimeout(() => setCopiedFeedXml(false), 2000);
    } else {
      setCopiedFeedJson(true);
      setTimeout(() => setCopiedFeedJson(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Catalogue Web Manager</h1>
              <p className="text-slate-400 text-sm">
                Manage online products & sync catalogs with Meta / Facebook Developer Commerce Manager
              </p>
            </div>
          </div>
        </div>

        {/* User Account Lookup Bar */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
          <input
            type="text"
            placeholder="Enter Business User ID..."
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            className="bg-transparent text-sm text-white px-3 py-2 outline-none w-48 focus:w-64 transition-all"
          />
          <button
            onClick={handleLoadUser}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Load Store
          </button>
        </div>
      </div>

      {/* Selected Business Banner */}
      {profile && (
        <div className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
            <div>
              <h2 className="text-white font-semibold text-base">{profile.businessName}</h2>
              <p className="text-emerald-400 text-xs">{profile.category} • ID: {selectedUserId}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-full">
            Active Catalog Syncing
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'items'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Product Catalog ({items.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('meta-feed');
            fetchFeedPreview('xml');
          }}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'meta-feed'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Meta Catalogs & Facebook Feed
        </button>
        <button
          onClick={() => setActiveTab('import-export')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'import-export'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Bulk Feed Import & Export
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG ITEMS */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">All Store Products</h3>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Product
            </button>
          </div>

          {!selectedUserId ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl text-slate-400">
              Please enter your Business User ID above to manage your web catalog.
            </div>
          ) : loading ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl text-slate-400">
              Loading catalog items...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl text-slate-400 space-y-3">
              <p className="text-base text-slate-300">No catalog items found for this store.</p>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg"
              >
                + Add your first item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div className="space-y-3">
                    {item.imageUrl ? (
                      <div className="h-40 w-full rounded-xl bg-slate-950 overflow-hidden relative">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        <span className={`absolute top-2 right-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          item.isAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                        }`}>
                          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    ) : (
                      <div className="h-40 w-full rounded-xl bg-slate-950 flex items-center justify-center text-slate-600 relative">
                        <span>No Image</span>
                        <span className={`absolute top-2 right-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          item.isAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                        }`}>
                          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    )}

                    <div>
                      <h4 className="text-white font-bold text-base leading-snug">{item.title}</h4>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-emerald-400 font-extrabold text-lg">
                      {item.price.toFixed(2)} {item.currency || 'USD'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: META / FACEBOOK CATALOG FEED LINK */}
      {activeTab === 'meta-feed' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Meta / Facebook Commerce Catalog Integration</h3>
                <p className="text-slate-400 text-xs">
                  Connect your Vibez catalog directly to Facebook Business Manager, Instagram Shopping, and Meta Ads.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Scheduled XML Catalog Feed URL (Meta Commerce Manager RSS 2.0 / Google Feed):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={xmlFeedUrl || 'Enter Business User ID first'}
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 text-xs px-3 py-2.5 rounded-xl font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(xmlFeedUrl, 'xml')}
                    disabled={!selectedUserId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {copiedFeedXml ? 'Copied XML Link!' : 'Copy XML Feed'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  JSON Product Feed Endpoint:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={jsonFeedUrl || 'Enter Business User ID first'}
                    className="w-full bg-slate-950 border border-slate-800 text-blue-400 text-xs px-3 py-2.5 rounded-xl font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(jsonFeedUrl, 'json')}
                    disabled={!selectedUserId}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {copiedFeedJson ? 'Copied JSON Link!' : 'Copy JSON Feed'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Guide Step-by-Step */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              How to Link to Meta Catalogs in Facebook Developer / Business Manager
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 font-bold rounded-full inline-flex items-center justify-center">1</span>
                <p className="font-semibold text-white">Go to Commerce Manager</p>
                <p className="text-slate-400">Log into Facebook Business Manager / Meta Commerce Manager and navigate to <strong>Catalogs</strong>.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 font-bold rounded-full inline-flex items-center justify-center">2</span>
                <p className="font-semibold text-white">Add Data Feed Source</p>
                <p className="text-slate-400">Click <strong>Add Items</strong> &gt; <strong>Data feed</strong> &gt; <strong>Scheduled feed</strong>.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 font-bold rounded-full inline-flex items-center justify-center">3</span>
                <p className="font-semibold text-white">Paste Vibez XML Feed URL</p>
                <p className="text-slate-400">Paste the XML Feed URL copied above and set automatic daily or hourly sync frequency.</p>
              </div>
            </div>
          </div>

          {/* Live Feed Output Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-white">Meta Feed Live Output Preview</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchFeedPreview('xml')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 rounded-lg"
                >
                  XML RSS 2.0
                </button>
                <button
                  onClick={() => fetchFeedPreview('json')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 rounded-lg"
                >
                  JSON Format
                </button>
              </div>
            </div>
            <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto max-h-64 scrollbar-thin">
              {feedPreviewContent || 'Click XML or JSON above to preview feed output.'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: BULK IMPORT & EXPORT */}
      {activeTab === 'import-export' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white">Bulk Feed Import & Export</h3>
          <p className="text-slate-400 text-xs">
            Export your catalog in Meta-compatible formats or import items from external websites like Shopify, WooCommerce, or Meta.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="text-white font-semibold text-sm">Download Meta Catalog CSV / JSON</h4>
              <p className="text-slate-400 text-xs">Export your current store products directly into a Meta Commerce Manager spreadsheet.</p>
              <a
                href={jsonFeedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
              >
                Export Catalog JSON
              </a>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="text-white font-semibold text-sm">Bulk Import Items</h4>
              <p className="text-slate-400 text-xs">Import product items via raw JSON or catalog payload.</p>
              <button
                onClick={() => {
                  const sample = JSON.stringify([
                    { title: "Sample Product 1", price: 29.99, currency: "USD", description: "Meta synced item" }
                  ], null, 2);
                  const userJSON = prompt('Paste Catalog JSON array:', sample);
                  if (userJSON) {
                    try {
                      const itemsArray = JSON.parse(userJSON);
                      const token = localStorage.getItem('auth_token') || '';
                      fetch('/api/business/catalog/import', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ items: itemsArray })
                      }).then(r => r.json()).then(data => {
                        alert(`Successfully imported ${data.count || 0} items!`);
                        fetchCatalog(selectedUserId);
                      });
                    } catch (e: any) {
                      alert('Invalid JSON format');
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                Import JSON Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingItem ? 'Edit Product Item' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Denim Jacket"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  placeholder="Product features, sizes, material..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2 rounded-xl focus:border-emerald-500 outline-none h-20 resize-none"
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
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2 rounded-xl focus:border-emerald-500 outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/images/product.jpg"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">External Website Link</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com/products/item-1"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="isAvailable" className="text-xs text-slate-300 font-medium">In Stock / Available for Sale</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
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
