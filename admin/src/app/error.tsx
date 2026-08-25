'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Try again
      </button>
    </div>
  );
}
