'use client';

import React, { useState, useMemo } from 'react';
import { ContactInquiry, replyToContactInquiry } from '../services/api';

export interface InquiryReplyModalProps {
  inquiry: ContactInquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedInquiryId: string) => void;
  initialMessage?: string;
}

export const SUPPORT_TEMPLATES = [
  {
    id: 'resolved',
    label: 'Issue Resolved & Closed',
    badge: 'Resolution',
    text: `Thank you for contacting VIBEZ Support. We have looked into your inquiry and resolved the issue. Everything should now be functioning properly. If you continue encountering any difficulties, please let us know.`
  },
  {
    id: 'feature',
    label: 'Feature Request Under Review',
    badge: 'Feedback',
    text: `Thank you for reaching out with this valuable suggestion! Our product engineering team has logged this request and is currently reviewing it for upcoming releases. We truly appreciate you helping us shape the future of VIBEZ!`
  },
  {
    id: 'troubleshoot',
    label: 'Technical Troubleshooting Steps',
    badge: 'Technical',
    text: `Thank you for reporting this issue. To help resolve this promptly, please ensure you are running the latest version of the app. You can also try clearing your local app cache and restarting. Please reply if the problem persists!`
  },
  {
    id: 'account',
    label: 'Account & Security Assistance',
    badge: 'Security',
    text: `Thank you for reaching out regarding your account. We have verified your status and updated our internal records. Please follow standard account security best practices and ensure two-factor authentication is active.`
  },
  {
    id: 'general',
    label: 'General Follow-up Response',
    badge: 'General',
    text: `Thank you for reaching out to VIBEZ. In response to your question, we are pleased to confirm that our platform supports this. Please let us know if you need any additional details!`
  }
];

export const InquiryReplyModal: React.FC<InquiryReplyModalProps> = ({
  inquiry,
  isOpen,
  onClose,
  onSuccess,
  initialMessage
}) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'preview' | 'split'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [agentName, setAgentName] = useState('VIBEZ Support Team');
  const [agentTitle, setAgentTitle] = useState('Customer Experience & Success');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHtmlCode, setShowHtmlCode] = useState(false);

  // Initialize defaults when inquiry or initialMessage opens
  React.useEffect(() => {
    if (inquiry) {
      if (initialMessage) {
        setResponseMessage(initialMessage);
      } else {
        setResponseMessage(
          `Hi ${inquiry.name || 'there'},\n\nThank you for reaching out regarding "${inquiry.subject}".\n\nWe have reviewed your message and wanted to follow up with you.`
        );
      }
      setErrorMessage(null);
    }
  }, [inquiry, initialMessage]);

  const ticketId = useMemo(() => {
    if (!inquiry) return 'VBZ-PREVIEW';
    return inquiry.id ? inquiry.id.substring(0, 8).toUpperCase() : 'VBZ-INQUIRY';
  }, [inquiry]);

  // Generate the exact HTML representation matching server/src/lib/email.ts
  const renderedHtml = useMemo(() => {
    if (!inquiry) return '';
    const recipientName = inquiry.name || 'Valued User';
    const originalSubject = inquiry.subject || 'General Inquiry';
    const formattedResponse = responseMessage
      ? responseMessage.replace(/\n/g, '<br/>')
      : '<em style="color:#64748b;">(Type your response in the editor to see live preview)</em>';
    const formattedOriginal = inquiry.message ? inquiry.message.replace(/\n/g, '<br/>') : '';
    const currentYear = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Response to your inquiry - VIBEZ</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-text-size-adjust: 100%;
    }
    table { border-collapse: collapse; }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #111827;
      border-radius: 16px;
      border: 1px solid #1f2937;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo-icon {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      background: #ffffff;
      color: #4f46e5;
      font-size: 26px;
      font-weight: 900;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
      margin-bottom: 10px;
      text-align: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 3px;
      margin: 0;
      text-transform: uppercase;
    }
    .tagline {
      color: rgba(255, 255, 255, 0.85);
      font-size: 12px;
      letter-spacing: 1px;
      margin-top: 4px;
      font-weight: 500;
    }
    .content {
      padding: 30px 24px;
    }
    .ticket-badge {
      display: inline-block;
      background: #1e1b4b;
      color: #818cf8;
      border: 1px solid #3730a3;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .intro-text {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 20px;
    }
    .response-card {
      background: #1e293b;
      border-left: 4px solid #6366f1;
      border-radius: 0 12px 12px 0;
      padding: 18px 20px;
      margin-bottom: 24px;
      color: #f8fafc;
      font-size: 14px;
      line-height: 1.7;
    }
    .response-card strong {
      color: #818cf8;
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .quote-box {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .quote-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .quote-subject {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .quote-content {
      font-size: 12px;
      color: #64748b;
      font-style: italic;
      line-height: 1.5;
    }
    .signature {
      border-top: 1px solid #1f2937;
      padding-top: 18px;
      margin-top: 20px;
    }
    .signature-name {
      color: #f1f5f9;
      font-weight: 700;
      font-size: 14px;
    }
    .signature-title {
      color: #818cf8;
      font-size: 12px;
      margin-top: 2px;
    }
    .action-btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      margin: 16px 0 10px 0;
      text-align: center;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .social-section {
      background: #0d1322;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #1f2937;
    }
    .social-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .social-btn {
      display: inline-block;
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1 !important;
      text-decoration: none;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 6px;
      margin: 3px 2px;
    }
    .footer {
      background: #090d16;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: #1f2937;
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="container" align="center" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <div class="logo-icon">V</div>
          <h1 class="logo-text">VIBEZ</h1>
          <div class="tagline">Next-Gen Real-Time Communication</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="ticket-badge">TICKET #${ticketId} &bull; SUPPORT UPDATE</div>
          <div class="greeting">Hello ${recipientName},</div>
          <div class="intro-text">
            Thank you for reaching out to the VIBEZ Customer Support Team. We have reviewed your inquiry and prepared the following resolution for you:
          </div>

          <div class="response-card">
            <strong>Official Support Response</strong>
            ${formattedResponse}
          </div>

          ${
            formattedOriginal
              ? `<div class="quote-box">
            <div class="quote-title">Your Original Message</div>
            <div class="quote-subject">Subject: ${originalSubject}</div>
            <div class="quote-content">&ldquo;${formattedOriginal}&rdquo;</div>
          </div>`
              : ''
          }

          <div style="text-align: center;">
            <a href="https://vibez-n5h1.onrender.com" class="action-btn" target="_blank">Open VIBEZ Hub</a>
          </div>

          <div class="signature">
            <div class="signature-name">${agentName || 'VIBEZ Support Team'}</div>
            <div class="signature-title">${agentTitle || 'Customer Experience & Success'} &bull; VIBEZ Inc.</div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="social-section">
          <div class="social-title">Connect with VIBEZ Community</div>
          <div>
            <span class="social-btn">&#120143; Twitter/X</span>
            <span class="social-btn">&#128172; Discord</span>
            <span class="social-btn">&#128248; Instagram</span>
            <span class="social-btn">&#128187; GitHub</span>
            <span class="social-btn">&#128188; LinkedIn</span>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <div>&copy; ${currentYear} VIBEZ Inc. All rights reserved.</div>
          <div style="margin-top: 4px;">
            San Francisco, CA, USA &bull; <a href="mailto:support@vibez.chat">support@vibez.chat</a>
          </div>
          <div class="divider"></div>
          <div style="font-size: 10px; color: #475569;">
            You received this email because you initiated a support request with the VIBEZ team.
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }, [inquiry, responseMessage, agentName, agentTitle, ticketId]);

  if (!isOpen || !inquiry) return null;

  const handleSendReply = async () => {
    if (!responseMessage.trim()) {
      setErrorMessage('Please provide a response message before sending.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await replyToContactInquiry(inquiry.id, {
        responseMessage: responseMessage.trim(),
        agentName: agentName.trim(),
        agentTitle: agentTitle.trim()
      });

      if (res.success) {
        onSuccess(inquiry.id);
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to dispatch email reply.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (text: string) => {
    setResponseMessage(prev => (prev ? `${prev}\n\n${text}` : text));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg shadow-inner">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Reply to Inquiry
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-[11px] font-bold">
                  #{ticketId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                To: <span className="text-slate-200 font-bold">{inquiry.name}</span> ({inquiry.email})
              </p>
            </div>
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-700/50">
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'compose'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden md:block px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'split'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Template Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-2"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Editor Column */}
          {(activeTab === 'compose' || activeTab === 'split') && (
            <div
              className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-5 bg-slate-900/50 ${
                activeTab === 'split' ? 'md:w-1/2' : 'w-full'
              }`}
            >
              {/* Inquiry Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    User Inquiry Details
                  </span>
                  <span className="text-slate-500 font-medium">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-200">{inquiry.subject}</div>
                <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 font-mono">
                  &ldquo;{inquiry.message}&rdquo;
                </div>
              </div>

              {/* Quick Macro Templates */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Quick Response Templates
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(tmpl.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/40 hover:border-indigo-500/50 border border-slate-700/60 text-slate-300 text-xs font-semibold transition-all text-left"
                    >
                      + {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Message Textarea */}
              <div className="flex-1 flex flex-col">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Support Response Message <span className="text-indigo-400">*</span>
                </label>
                <textarea
                  value={responseMessage}
                  onChange={e => setResponseMessage(e.target.value)}
                  placeholder="Type your official resolution here..."
                  rows={8}
                  className="w-full flex-1 p-4 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-sm font-medium resize-none transition-all placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* Agent Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-indigo-500 text-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Agent Title / Role
                  </label>
                  <input
                    type="text"
                    value={agentTitle}
                    onChange={e => setAgentTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-indigo-500 text-slate-200 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email Preview Column */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div
              className={`flex-1 flex flex-col bg-slate-950 ${
                activeTab === 'split' ? 'md:w-1/2' : 'w-full'
              }`}
            >
              {/* Preview Sub-bar */}
              <div className="px-5 py-2.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                    Live Nodemailer Output
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowHtmlCode(!showHtmlCode)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    {showHtmlCode ? 'View Rendered' : 'View HTML Code'}
                  </button>

                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Container */}
              <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start bg-slate-950/90">
                {showHtmlCode ? (
                  <pre className="w-full text-[11px] font-mono text-emerald-400 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                    {renderedHtml}
                  </pre>
                ) : (
                  <div
                    className={`transition-all duration-300 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 ${
                      previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-[580px]'
                    }`}
                  >
                    <iframe
                      title="Nodemailer Email Preview"
                      srcDoc={renderedHtml}
                      className="w-full h-[520px] bg-[#0b0f19] border-0"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {errorMessage ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                ⚠️ {errorMessage}
              </span>
            ) : (
              <span>
                Dispatches branded support response via <strong className="text-slate-200">Nodemailer SMTP</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex-1 sm:flex-initial"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendReply}
              disabled={isSending || !responseMessage.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              {isSending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending Email...
                </>
              ) : (
                <>
                  <span>✉️</span> Send Branded Response
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
