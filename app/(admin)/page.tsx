'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { HiOutlineBookOpen, HiOutlinePencilSquare, HiOutlineCheckCircle, HiOutlinePlus } from 'react-icons/hi2';
import type { Book } from '@/lib/types';
import { StatSkeleton, TableSkeleton } from '@/components/Skeleton';

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
        console.error('Gagal memuat buku:', err);
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
          <p className="text-slate-500 mt-1">Selamat datang di Kitabi Admin</p>
        </div>
        <Link href="/books/new" className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={18} />
          Buku Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="bg-teal-100 p-3 rounded-xl">
                  <HiOutlineBookOpen size={24} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total Buku</p>
                  <p className="text-3xl font-bold text-slate-800">{totalBooks}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <HiOutlineCheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Diterbitkan</p>
                  <p className="text-3xl font-bold text-slate-800">{publishedBooks}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <HiOutlinePencilSquare size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Draf</p>
                  <p className="text-3xl font-bold text-slate-800">{draftBooks}</p>
                </div>
              </div>
            </div>
          </>
        )}
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
          <TableSkeleton rows={5} cols={4} />
        ) : recentBooks.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineBookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-1">Belum ada buku.</p>
            <p className="text-sm text-slate-400 mb-4">Mulai dengan menambahkan buku pertama Anda.</p>
            <Link href="/books/new" className="btn-primary inline-block">
              Tambah Buku Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Buku</th>
                  <th className="hidden md:table-cell">Kategori</th>
                  <th>Status</th>
                  <th>Penilaian</th>
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
                    <td className="hidden md:table-cell">
                      <span className="text-sm text-slate-600">
                        {(book.categories || []).join(', ') || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={book.status === 'draft' ? 'badge-draft' : 'badge-published'}>
                        {book.status === 'draft' ? 'Draf' : 'Diterbitkan'}
                      </span>
                    </td>
                    <td><span className="text-sm text-slate-600">⭐ {book.rating || 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
