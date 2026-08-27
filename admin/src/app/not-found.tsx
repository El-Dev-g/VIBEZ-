export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b1120] text-center px-4">
      <h1 className="text-6xl font-black text-white tracking-tight">404</h1>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4">Administrative Route Not Found</p>
      <a href="/" className="mt-8 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
        Return to Command Center
      </a>
    </div>
  );
}
