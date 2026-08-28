import { fetchContactInquiries } from '../../services/api';
import { InquiriesManager } from '../../components/InquiriesManager';

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
  const inquiries = await fetchContactInquiries();

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Support Inquiries</h2>
          <p className="text-slate-500 font-bold mt-1">Review, preview branded Nodemailer emails, and respond to user inquiries.</p>
        </div>
      </div>

      <InquiriesManager initialInquiries={inquiries} />
    </div>
  );
}

