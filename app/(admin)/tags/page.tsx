'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import type { Tag } from '@/lib/types';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchTags = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'tags'));
      setTags(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addDoc(collection(db, 'tags'), {
        name: newName.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewName('');
      fetchTags();
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus tag "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'tags', id));
      fetchTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateDoc(doc(db, 'tags', id), { name: editName.trim() });
      setEditingId(null);
      fetchTags();
    } catch (err) {
      console.error('Error updating tag:', err);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Tag</h1>
        <p className="text-slate-500 mt-1">Kelola tag untuk menandai buku</p>
      </div>

      {/* Add New */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tambah Tag</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="form-input flex-1"
            placeholder="Nama tag baru..."
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
        ) : tags.length === 0 ? (
          <p className="text-center py-12 text-slate-400">Belum ada tag.</p>
        ) : (
          <ul>
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center justify-between px-6 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  {editingId === tag.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(tag.id!)}
                      onBlur={() => handleUpdate(tag.id!)}
                      className="form-input py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{tag.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(tag.id!); setEditName(tag.name); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <HiOutlinePencilSquare size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id!, tag.name)}
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
