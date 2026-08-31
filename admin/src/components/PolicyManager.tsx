'use client';

import { useState } from 'react';
import { SystemSettings, updateSettings } from '../services/api';

interface PolicyManagerProps {
  initialSettings?: SystemSettings | null;
}

export default function PolicyManager({ initialSettings }: PolicyManagerProps) {
  const [formData, setFormData] = useState({
    privacyPolicyUrl: initialSettings?.privacyPolicyUrl || '',
    termsOfServiceUrl: initialSettings?.termsOfServiceUrl || '',
    privacyPolicyContent: initialSettings?.privacyPolicyContent || '',
    termsOfServiceContent: initialSettings?.termsOfServiceContent || '',
    helpCenterUrl: initialSettings?.helpCenterUrl || '',
    faqUrl: initialSettings?.faqUrl || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const updated = await updateSettings(formData);
      if (updated) {
        setToast({ text: 'Privacy policy, terms & links updated successfully!', isError: false });
      } else {
        setToast({ text: 'Failed to update settings. Please try again.', isError: true });
      }
    } catch (err: any) {
      setToast({ text: err.message || 'An error occurred while saving.', isError: true });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Policy & Support Links</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage legal policies, terms of service, privacy documents, and help/FAQ URLs synced across the VIBEZ server backend.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Changes...
            </>
          ) : (
            <>Save Policy & Links</>
          )}
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          toast.isError ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* URLs Section */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">External Links & URLs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Privacy Policy URL
              </label>
              <input
                type="url"
                value={formData.privacyPolicyUrl}
                onChange={(e) => handleChange('privacyPolicyUrl', e.target.value)}
                placeholder="https://vibez.chat/privacy"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Terms of Service URL
              </label>
              <input
                type="url"
                value={formData.termsOfServiceUrl}
                onChange={(e) => handleChange('termsOfServiceUrl', e.target.value)}
                placeholder="https://vibez.chat/terms"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Help Center URL
              </label>
              <input
                type="url"
                value={formData.helpCenterUrl}
                onChange={(e) => handleChange('helpCenterUrl', e.target.value)}
                placeholder="https://support.vibez.chat"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                FAQ / Support URL
              </label>
              <input
                type="url"
                value={formData.faqUrl}
                onChange={(e) => handleChange('faqUrl', e.target.value)}
                placeholder="https://vibez.chat/faq"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Embedded Policy Content (Markdown / Text)</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Privacy Policy Content
              </label>
              <textarea
                rows={6}
                value={formData.privacyPolicyContent}
                onChange={(e) => handleChange('privacyPolicyContent', e.target.value)}
                placeholder="Enter full privacy policy text or markdown..."
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Terms of Service Content
              </label>
              <textarea
                rows={6}
                value={formData.termsOfServiceContent}
                onChange={(e) => handleChange('termsOfServiceContent', e.target.value)}
                placeholder="Enter full terms of service text or markdown..."
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
