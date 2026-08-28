/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const rawBackendUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://vibez-n5h1.onrender.com';

    let backend = rawBackendUrl.trim();
    if (!backend.startsWith('http://') && !backend.startsWith('https://')) {
      backend = `https://${backend}`;
    }
    backend = backend.replace(/\/api\/?$/, '').replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
