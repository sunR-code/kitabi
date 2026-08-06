'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh(); // Force refresh to apply auth state
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal login. Silakan periksa kembali kredensial Anda.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="Kitab-i Logo" 
            width={120} 
            height={40} 
            className="mb-2 object-contain"
          />
          <p className="text-slate-500 mt-2">Kelola konten buku Anda</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">
            Masuk ke Dashboard
          </h2>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                placeholder="Masukkan username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Sistem Terproteksi. Hanya admin yang berwenang.
          </p>
        </div>
      </div>
    </div>
  );
}
