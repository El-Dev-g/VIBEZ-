'use client';

import { useState, useEffect } from 'react';
import { EmailLinks, fetchEmailLinks, updateEmailLinks } from '../services/api';

export default function TemplateLinksManager() {
  const [links, setLinks] = useState<EmailLinks>({
    app: 'https://vibez.chat',
    billing: 'https://vibez.chat/billing',
    supportEmail: 'support@vibez.chat',
    twitter: 'https://x.com',
    discord: 'https://discord.com',
    instagram: 'https://instagram.com',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    admin: 'https://admin.vibez.chat'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchEmailLinks();
        if (data) {
          setLinks(data);
        }
      } catch (err) {
        console.error('Failed to load email links:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (field: keyof EmailLinks, value: string) => {
    setLinks(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const res = await updateEmailLinks(links);
      if (res.success) {
        setToast({ text: '✓ Email template links updated successfully!', isError: false });
        if (res.emailLinks) {
          setLinks(res.emailLinks);
        }
      } else {
        setToast({ text: res.error || 'Failed to update email template links.', isError: true });
      }
    } catch (err: any) {
      setToast({ text: err.message || 'An error occurred while saving.', isError: true });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🔗</span> Email Template Links
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure every clickable URL, button endpoint, and social media link injected across all VIBEZ email templates.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            'Save Template Links'
          )}
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl text-sm font-bold animate-fadeIn ${
          toast.isError ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Destinations */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🏠</span> Core Platform Destinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">App Hub / Home Page URL</label>
              <input
                type="url"
                value={links.app}
                onChange={(e) => handleChange('app', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://vibez.chat"
                required
              />
              <p className="text-xs text-gray-500">Used for "Return to VIBEZ", "Visit VIBEZ Hub", and main portal links.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billing Portal URL</label>
              <input
                type="url"
                value={links.billing}
                onChange={(e) => handleChange('billing', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://vibez.chat/billing"
                required
              />
              <p className="text-xs text-gray-500">Used for payment failure and subscription management emails.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Support Email Address</label>
              <input
                type="email"
                value={links.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="support@vibez.chat"
                required
              />
              <p className="text-xs text-gray-500">Displayed in footer of all transactional emails.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Portal URL</label>
              <input
                type="url"
                value={links.admin}
                onChange={(e) => handleChange('admin', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://admin.vibez.chat"
                required
              />
              <p className="text-xs text-gray-500">Used in daily analytics and administrative system digests.</p>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🌐</span> Footer Social Media Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Twitter / X URL</label>
              <input
                type="url"
                value={links.twitter}
                onChange={(e) => handleChange('twitter', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://x.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discord Server URL</label>
              <input
                type="url"
                value={links.discord}
                onChange={(e) => handleChange('discord', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://discord.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instagram URL</label>
              <input
                type="url"
                value={links.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://instagram.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">GitHub URL</label>
              <input
                type="url"
                value={links.github}
                onChange={(e) => handleChange('github', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://github.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">LinkedIn URL</label>
              <input
                type="url"
                value={links.linkedin}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-emerald-500"
                placeholder="https://linkedin.com"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
