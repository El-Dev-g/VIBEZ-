'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAdmin } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAdmin(email.trim(), password.trim());
      if (res && res.token && res.id) {
        login({
          id: res.id,
          email: res.email || email.trim(),
          role: res.role || 'SuperAdmin',
          token: res.token,
          name: res.name
        });
        const redirectUrl = (searchParams && searchParams.get('redirect')) ? searchParams.get('redirect')! : '/';
        router.push(redirectUrl);
      } else {
        setError(res?.error || 'Access Denied: You do not have administrator permissions. Regular users cannot access this portal.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during authentication. Access is strictly restricted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1120] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4">
            <span className="text-white font-black text-2xl">V</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            VIBEZ <span className="text-emerald-400">Admin Gate</span>
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Protected Platform Administration Node
          </p>
        </div>

        <div className="bg-[#131d31] border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3.5 bg-[#0b1120] border border-slate-700 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="admin@vibez.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Secret Key / Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3.5 bg-[#0b1120] border border-slate-700 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Authorize Session'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-[11px] font-bold text-slate-500">
              Default Node Credentials: <span className="text-slate-300 font-mono">admin@vibez.com</span> / <span className="text-slate-300 font-mono">adminpassword123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

