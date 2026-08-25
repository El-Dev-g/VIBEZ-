import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">This node does not exist in the VIBEZ network.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-black transition-all"
        >
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
