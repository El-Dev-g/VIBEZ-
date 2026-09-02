'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle2, 
  ArrowLeft, 
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { fetchPublicAppConfig, submitContactForm, PublicAppConfig } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<PublicAppConfig>({
    appName: 'VIBEZ',
    appVersion: '1.0.0',
    appDownloadUrl: '',
    contactEmail: 'support@vibez.chat',
    contactPhone: '+1 (800) 555-0199',
    supportAddress: 'San Francisco, CA, USA',
    maintenanceMode: false,
    allowNewRegistrations: true
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; ticketId?: string } | null>(null);

  useEffect(() => {
    fetchPublicAppConfig().then(data => {
      if (data) setConfig(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await submitContactForm(formData);
      setSubmitResult({
        success: true,
        message: res.message || t('contact.successMsg'),
        ticketId: res.ticketId
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error.message || t('contact.errorMsg')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white min-h-screen w-full relative overflow-hidden">
      
      {/* Hero & Form Section */}
      <section className="relative pt-12 pb-24 overflow-hidden w-full">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full -z-10 pointer-events-none select-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
              <Sparkles className="h-4 w-4" />
              {t('contact.badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              {t('contact.title')}
            </h1>
            <p className="text-sm sm:text-base text-[#8696a0]">
              {t('contact.subtitle', { appName: config.appName })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-start max-w-6xl mx-auto">
            
            {/* Left Column: Direct Contact Info Cards */}
            <div className="md:col-span-5 space-y-6">
              
              <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>💬</span> {t('contact.directTitle')}
                </h3>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  {t('contact.directSub')}
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0b141a] border border-[#202c33]">
                    <div className="h-10 w-10 rounded-lg bg-[#00a884]/15 flex items-center justify-center text-[#00a884] shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#8696a0]">{t('contact.emailLabel')}</div>
                      <a href={`mailto:${config.contactEmail || 'support@vibez.chat'}`} className="text-sm font-bold text-white hover:text-[#00a884] transition-colors">
                        {config.contactEmail || 'support@vibez.chat'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0b141a] border border-[#202c33]">
                    <div className="h-10 w-10 rounded-lg bg-[#53bdeb]/15 flex items-center justify-center text-[#53bdeb] shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#8696a0]">{t('contact.phoneLabel')}</div>
                      <a href={`tel:${config.contactPhone || '+18005550199'}`} className="text-sm font-bold text-white hover:text-[#53bdeb] transition-colors">
                        {config.contactPhone || '+1 (800) 555-0199'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0b141a] border border-[#202c33]">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#8696a0]">{t('contact.hqLabel')}</div>
                      <p className="text-sm font-bold text-white">
                        {config.supportAddress || 'San Francisco, CA, USA'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0b141a] border border-[#202c33]">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#8696a0]">{t('contact.hoursLabel')}</div>
                      <p className="text-sm font-bold text-white">
                        {t('contact.hoursValue')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick FAQ card */}
              <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#00a884]" />
                  {t('contact.needHelpQ')}
                </h4>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  {t('contact.faqLinkFull', { link: t('contact.faqLinkText') }).split('{link}').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && <Link href="/#faq" className="text-[#00a884] underline">{t('contact.faqLinkText')}</Link>}
                    </React.Fragment>
                  ))}
                </p>
              </div>

            </div>

            {/* Right Column: Interactive Contact Form */}
            <div className="md:col-span-7 bg-[#111b21] p-6 sm:p-8 lg:p-10 rounded-3xl border border-[#202c33] shadow-2xl">
              <h2 className="text-xl font-black text-white mb-1">{t('contact.formTitle')}</h2>
              <p className="text-xs text-[#8696a0] mb-6">{t('contact.formSub')}</p>

              {submitResult && (
                <div className={`p-4 rounded-2xl mb-6 text-xs sm:text-sm font-medium flex items-start gap-3 animate-fade-in ${
                  submitResult.success 
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-red-950/60 border border-red-500/40 text-red-300'
                }`}>
                  {submitResult.success ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{submitResult.success ? t('contact.successTitle') : t('contact.errorTitle')}</p>
                    <p className="mt-1">{submitResult.message}</p>
                    {submitResult.ticketId && (
                      <p className="mt-1 text-[11px] text-emerald-400/80 font-mono">{t('contact.ticketRefLabel')}: {submitResult.ticketId}</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8696a0]">{t('contact.nameLabel')}</label>
                    <input 
                      type="text"
                      required
                      placeholder={t('contact.namePlaceholder')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0b141a] border border-[#202c33] text-sm text-white placeholder-[#8696a0]/50 focus:outline-none focus:border-[#00a884] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8696a0]">{t('contact.emailInputLabel')}</label>
                    <input 
                      type="email"
                      required
                      placeholder={t('contact.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0b141a] border border-[#202c33] text-sm text-white placeholder-[#8696a0]/50 focus:outline-none focus:border-[#00a884] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8696a0]">{t('contact.subjectLabel')}</label>
                  <input 
                    type="text"
                    placeholder={t('contact.subjectPlaceholder')}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0b141a] border border-[#202c33] text-sm text-white placeholder-[#8696a0]/50 focus:outline-none focus:border-[#00a884] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8696a0]">{t('contact.messageLabel')}</label>
                  <textarea 
                    rows={5}
                    required
                    placeholder={t('contact.messagePlaceholder')}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0b141a] border border-[#202c33] text-sm text-white placeholder-[#8696a0]/50 focus:outline-none focus:border-[#00a884] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white font-bold text-sm shadow-xl shadow-[#00a884]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? t('contact.sendingBtn') : t('contact.sendBtn')}
                </button>
              </form>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
