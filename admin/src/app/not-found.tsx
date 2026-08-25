import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <h2 className="text-3xl font-bold text-gray-900">404 - Page Not Found</h2>
      <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Return Home
      </Link>
    </div>
  );
}
