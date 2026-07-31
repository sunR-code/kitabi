'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import type { Category } from '@/lib/types';

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
      console.error('Error:', err);
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
      setNewName('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateDoc(doc(db, 'categories', id), { name: editName.trim() });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Kategori</h1>
        <p className="text-slate-500 mt-1">Kelola kategori buku untuk memudahkan pencarian</p>
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
          <p className="text-center py-12 text-slate-400">Memuat...</p>
        ) : categories.length === 0 ? (
          <p className="text-center py-12 text-slate-400">Belum ada kategori.</p>
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
                  >
                    <HiOutlinePencilSquare size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id!, cat.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
