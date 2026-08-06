'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineFolder } from 'react-icons/hi2';
import type { Category } from '@/lib/types';
import { ListSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    } catch (err) {
      console.error('Gagal memuat kategori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newName.trim(),
        createdAt: new Date().toISOString(),
      });
      toast(`Kategori "${newName.trim()}" ditambahkan.`, 'success');
      setNewName('');
      fetchCategories();
    } catch (err) {
      console.error('Gagal menambah kategori:', err);
      toast('Gagal menambah kategori.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast(`Kategori "${name}" dihapus.`, 'success');
      fetchCategories();
    } catch (err) {
      console.error('Gagal menghapus kategori:', err);
      toast('Gagal menghapus kategori.', 'error');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateDoc(doc(db, 'categories', id), { name: editName.trim() });
      toast('Kategori diperbarui.', 'success');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error('Gagal memperbarui kategori:', err);
      toast('Gagal memperbarui kategori.', 'error');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Kategori</h1>
        <p className="text-slate-500 mt-1">Kelola kategori untuk mengelompokkan buku</p>
      </div>

      {/* Add New */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tambah Kategori</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="form-input flex-1"
            placeholder="Nama kategori baru..."
          />
          <button onClick={handleAdd} className="btn-primary flex items-center gap-1">
            <HiOutlinePlus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <ListSkeleton rows={5} />
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineFolder size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400">Belum ada kategori. Tambahkan yang pertama di atas.</p>
          </div>
        ) : (
          <ul>
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  {editingId === cat.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id!)}
                      onBlur={() => handleUpdate(cat.id!)}
                      className="form-input py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{cat.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(cat.id!); setEditName(cat.name); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    title="Edit"
                  >
                    <HiOutlinePencilSquare size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id!, cat.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
