'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import type { Book } from '@/lib/types';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const fetchBooks = async () => {
    setLoading(true);
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

  useEffect(() => { fetchBooks(); }, []);

  const handleDelete = async (bookId: string, title: string) => {
    if (!confirm(`Yakin ingin menghapus buku "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteDoc(doc(db, 'books', bookId));
      setBooks(prev => prev.filter(b => b.id !== bookId));
    } catch (err) {
      console.error('Error deleting book:', err);
      alert('Gagal menghapus buku.');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'published' && (book.status === 'published' || !book.status)) ||
      (filterStatus === 'draft' && book.status === 'draft');
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Buku</h1>
          <p className="text-slate-500 mt-1">{books.length} buku dalam database</p>
        </div>
        <Link href="/books/new" className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={18} />
          Tambah Buku
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <HiOutlineMagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul atau penulis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'published', 'draft'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'Semua' : status === 'published' ? 'Published' : 'Draft'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <p className="text-slate-400 py-12 text-center">Memuat data...</p>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">Tidak ada buku yang cocok dengan pencarian Anda.</p>
            <Link href="/books/new" className="btn-primary inline-block">Tambah Buku Baru</Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Buku</th>
                <th>Kategori</th>
                <th>Tag</th>
                <th>Status</th>
                <th>Rating</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-14 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-400 text-xs">N/A</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{book.title}</p>
                        <p className="text-sm text-slate-500">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm text-slate-600">{book.category || '-'}</span></td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(book.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={book.status === 'draft' ? 'badge-draft' : 'badge-published'}>
                      {book.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                  </td>
                  <td><span className="text-sm text-slate-600">⭐ {book.rating || 0}</span></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        href={`/books/${book.id}/edit`} 
                        className="p-2 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Edit"
                      >
                        <HiOutlinePencilSquare size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(book.id!, book.title)} 
                        className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
