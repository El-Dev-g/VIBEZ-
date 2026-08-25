'use client';

import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-red-600">500</h1>
        <p className="mt-4 text-xl text-gray-600">Internal system protocol anomaly detected.</p>
        <p className="mt-2 text-xs text-gray-400 font-mono">{error?.message || 'Unknown exception'}</p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-black transition-all"
        >
          Reset Protocol
        </button>
      </div>
    </div>
  );
}
