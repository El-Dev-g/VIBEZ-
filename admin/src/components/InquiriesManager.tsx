'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ContactInquiry } from '../services/api';
import { InquiryReplyModal, SUPPORT_TEMPLATES } from './InquiryReplyModal';

interface InquiriesManagerProps {
  initialInquiries: ContactInquiry[];
}

export const InquiriesManager: React.FC<InquiriesManagerProps> = ({ initialInquiries }) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNREAD' | 'RESOLVED'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openQuickMenuId, setOpenQuickMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close quick reply menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenQuickMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenStandardReply = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setInitialMessage(
      `Hi ${inquiry.name || 'there'},\n\nThank you for reaching out regarding "${inquiry.subject}".\n\nWe have reviewed your message and wanted to follow up with you.`
    );
    setIsModalOpen(true);
    setOpenQuickMenuId(null);
  };

  const handleQuickReplyTemplate = (inquiry: ContactInquiry, templateText: string) => {
    const prefilled = `Hi ${inquiry.name || 'there'},\n\nThank you for reaching out regarding "${inquiry.subject}".\n\n${templateText}`;
    setSelectedInquiry(inquiry);
    setInitialMessage(prefilled);
    setIsModalOpen(true);
    setOpenQuickMenuId(null);
  };

  const handleReplySuccess = (updatedInquiryId: string) => {
    setInquiries(prev =>
      prev.map(item =>
        item.id === updatedInquiryId ? { ...item, status: 'RESOLVED' } : item
      )
    );
    setToastMessage('Branded email reply dispatched successfully via Nodemailer!');
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredInquiries = inquiries.filter(item => {
    const matchesFilter =
      filterStatus === 'ALL' ? true : item.status.toUpperCase() === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({inquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('UNREAD')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filterStatus === 'UNREAD'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Unread ({inquiries.filter(i => i.status.toUpperCase() === 'UNREAD').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filterStatus === 'RESOLVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Resolved ({inquiries.filter(i => i.status.toUpperCase() === 'RESOLVED').length})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search inquiries, email, or subject..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Sender
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Subject
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Message
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Status
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Date
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                      No matching support inquiries found.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map(inquiry => {
                  const isQuickMenuOpen = openQuickMenuId === inquiry.id;

                  return (
                    <tr
                      key={inquiry.id}
                      className="group hover:bg-slate-50/50 transition-all duration-200"
                    >
                      <td className="whitespace-nowrap px-8 py-6">
                        <div className="text-sm font-black text-slate-900">{inquiry.name}</div>
                        <div className="text-xs font-medium text-slate-500 font-mono">
                          {inquiry.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-8 py-6">
                        <div className="text-sm font-bold text-slate-800">{inquiry.subject}</div>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <p className="text-sm font-medium text-slate-600 line-clamp-2">
                          {inquiry.message}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-8 py-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            inquiry.status.toUpperCase() === 'UNREAD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inquiry.status.toUpperCase() === 'UNREAD'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          ></span>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-8 py-6 text-xs font-mono font-bold text-slate-500">
                        {new Date(inquiry.createdAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-8 py-6 text-right relative">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Quick Reply Dropdown Trigger */}
                          <div className="relative inline-block text-left" ref={isQuickMenuOpen ? menuRef : null}>
                            <button
                              type="button"
                              onClick={() => setOpenQuickMenuId(isQuickMenuOpen ? null : inquiry.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                                isQuickMenuOpen
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80'
                              }`}
                              title="Pre-populate common response"
                            >
                              <span>⚡</span>
                              <span>Quick Reply</span>
                              <span className="text-[9px]">▼</span>
                            </button>

                            {/* Dropdown Menu */}
                            {isQuickMenuOpen && (
                              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-fadeIn text-left">
                                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Choose Quick Template
                                  </span>
                                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                                    1-Click Setup
                                  </span>
                                </div>
                                <div className="py-1 space-y-1 max-h-64 overflow-y-auto">
                                  {SUPPORT_TEMPLATES.map(tmpl => (
                                    <button
                                      key={tmpl.id}
                                      type="button"
                                      onClick={() => handleQuickReplyTemplate(inquiry, tmpl.text)}
                                      className="w-full p-2.5 rounded-xl hover:bg-slate-800 transition-all text-left group flex flex-col gap-1 border border-transparent hover:border-slate-700"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                          {tmpl.label}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                          {tmpl.badge}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                        {tmpl.text}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Full Preview & Custom Reply */}
                          <button
                            type="button"
                            onClick={() => handleOpenStandardReply(inquiry)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                          >
                            <span>✉️</span>
                            <span>Preview &amp; Reply</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Reply Modal with Live Preview */}
      <InquiryReplyModal
        inquiry={selectedInquiry}
        isOpen={isModalOpen}
        initialMessage={initialMessage}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInquiry(null);
          setInitialMessage(undefined);
        }}
        onSuccess={handleReplySuccess}
      />
    </div>
  );
};

