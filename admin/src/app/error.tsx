'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b1120] text-center px-4">
      <h1 className="text-6xl font-black text-white tracking-tight">500</h1>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-4">Administrative Error Occurred</p>
      <p className="text-xs font-bold text-red-400 mt-2 max-w-md">{error?.message || "An unexpected system error halted the command session."}</p>
      <button 
        onClick={() => reset()}
        className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
      >
        Retry Gateway Session
      </button>
    </div>
  );
}
