'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { HiOutlineBookOpen, HiOutlinePencilSquare, HiOutlineCheckCircle, HiOutlinePlus } from 'react-icons/hi2';
import type { Book } from '@/lib/types';

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'books'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
        setBooks(data);
      } catch (err) {
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const totalBooks = books.length;
  const publishedBooks = books.filter(b => b.status === 'published' || !b.status).length;
  const draftBooks = books.filter(b => b.status === 'draft').length;

  const recentBooks = [...books]
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Selamat datang di Kitab-i Admin</p>
        </div>
        <Link href="/books/new" className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={18} />
          Tambah Buku
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <HiOutlineBookOpen size={24} />
            </div>
            <div>
              <p className="text-teal-100 text-sm">Total Buku</p>
              <p className="text-3xl font-bold">{loading ? '...' : totalBooks}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <HiOutlineCheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Published</p>
              <p className="text-3xl font-bold text-slate-800">{loading ? '...' : publishedBooks}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <HiOutlinePencilSquare size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Draft</p>
              <p className="text-3xl font-bold text-slate-800">{loading ? '...' : draftBooks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Books */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Buku Terbaru</h2>
          <Link href="/books" className="text-teal-600 text-sm font-medium hover:underline">
            Lihat Semua →
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-400 py-8 text-center">Memuat data...</p>
        ) : recentBooks.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineBookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Belum ada buku. Mulai tambahkan buku pertama Anda!</p>
            <Link href="/books/new" className="btn-primary inline-block mt-4">
              Tambah Buku Pertama
            </Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Buku</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {recentBooks.map((book) => (
                <tr key={book.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {book.coverUrl && (
                        <img src={book.coverUrl} alt="" className="w-10 h-14 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{book.title}</p>
                        <p className="text-sm text-slate-500">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm text-slate-600">{book.category || '-'}</span></td>
                  <td>
                    <span className={book.status === 'draft' ? 'badge-draft' : 'badge-published'}>
                      {book.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                  </td>
                  <td><span className="text-sm text-slate-600">⭐ {book.rating || 0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
