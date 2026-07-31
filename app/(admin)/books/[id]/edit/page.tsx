'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSparkles } from 'react-icons/hi2';
import type { Book, Category, Tag } from '@/lib/types';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isbn, setIsbn] = useState('');
  const [publishedYear, setPublishedYear] = useState(2024);
  const [estimatedReadTime, setEstimatedReadTime] = useState(15);
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(['']);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookSnap, catSnap, tagSnap] = await Promise.all([
          getDoc(doc(db, 'books', bookId)),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'tags')),
        ]);

        if (bookSnap.exists()) {
          const data = bookSnap.data() as Book;
          setTitle(data.title || '');
          setAuthor(data.author || '');
          setCoverUrl(data.coverUrl || '');
          setSynopsis(data.synopsis || '');
          setContent(data.content || '');
          setRating(data.rating || 0);
          setCategory(data.category || '');
          setSelectedTags(data.tags || []);
          setIsbn(data.isbn || '');
          setPublishedYear(data.publishedYear || 2024);
          setEstimatedReadTime(data.estimatedReadTime || 15);
          setIsPremium(data.isPremium || false);
          setStatus(data.status || 'published');
          setKeyTakeaways(data.keyTakeaways?.length ? data.keyTakeaways : ['']);
        }

        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
        setTags(tagSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
      } catch (err) {
        console.error('Error fetching book:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookId]);

  const addTakeaway = () => setKeyTakeaways([...keyTakeaways, '']);
  const removeTakeaway = (index: number) => setKeyTakeaways(keyTakeaways.filter((_, i) => i !== index));
  const updateTakeaway = (index: number, value: string) => {
    const updated = [...keyTakeaways];
    updated[index] = value;
    setKeyTakeaways(updated);
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
  };

  const handleSave = async () => {
    if (!title.trim() || !author.trim()) {
      alert('Judul dan Penulis wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'books', bookId), {
        title: title.trim(),
        author: author.trim(),
        coverUrl, synopsis, content,
        rating: Number(rating),
        tags: selectedTags,
        category, isPremium,
        estimatedReadTime: Number(estimatedReadTime),
        status, isbn,
        publishedYear: Number(publishedYear),
        keyTakeaways: keyTakeaways.filter(k => k.trim() !== ''),
        updatedAt: new Date().toISOString(),
      });
      router.push('/books');
    } catch (err) {
      console.error('Error updating book:', err);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-20 text-slate-400">Memuat data buku...</p>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Edit Buku</h1>
        <p className="text-slate-500 mt-1">{title}</p>
      </div>

      {/* Metadata */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Informasi Buku</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Penulis *</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
            <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Terbit</label>
            <input type="number" value={publishedYear} onChange={(e) => setPublishedYear(parseInt(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estimasi Waktu Baca (menit)</label>
            <input type="number" value={estimatedReadTime} onChange={(e) => setEstimatedReadTime(parseInt(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
            <input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(parseFloat(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
              <option value="">Pilih kategori...</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">URL Cover</label>
            <div className="flex gap-3 items-start">
              <input type="text" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="form-input flex-1" />
              {coverUrl && <img src={coverUrl} alt="Preview" className="w-16 h-22 rounded object-cover border" />}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Sinopsis</label>
            <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} className="form-input" rows={3} />
          </div>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Apa yang Akan Kamu Pelajari</h2>
        <p className="text-sm text-slate-500 mb-4">Poin-poin ini ditampilkan di halaman detail buku.</p>
        <div className="space-y-3">
          {keyTakeaways.map((takeaway, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-teal-600 font-bold w-6">{index + 1}.</span>
              <input type="text" value={takeaway} onChange={(e) => updateTakeaway(index, e.target.value)} className="form-input flex-1" />
              {keyTakeaways.length > 1 && (
                <button onClick={() => removeTakeaway(index)} className="p-2 text-red-400 hover:text-red-600"><HiOutlineTrash size={18} /></button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addTakeaway} className="mt-3 flex items-center gap-1 text-sm text-teal-600 font-medium hover:text-teal-700">
          <HiOutlinePlus size={16} /> Tambah poin
        </button>
      </div>

      {/* Ringkasan */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Ringkasan Buku</h2>
          <button
            className={`btn-secondary flex items-center gap-2 ${summarizing ? 'opacity-50 cursor-wait' : ''}`}
            disabled={summarizing || (!content && !synopsis)}
            onClick={async () => {
              setSummarizing(true);
              try {
                const sourceText = content || synopsis;
                const res = await fetch('/api/summarize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: sourceText, title, author }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                if (data.summary) setContent(data.summary);
                if (data.keyTakeaways?.length) setKeyTakeaways(data.keyTakeaways);
              } catch (err: any) {
                alert('Gagal meringkas: ' + (err.message || 'Unknown error'));
              } finally {
                setSummarizing(false);
              }
            }}
          >
            <HiOutlineSparkles size={16} />
            {summarizing ? 'Meringkas...' : 'Ringkas dengan AI'}
          </button>
        </div>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      {/* Tags & Status */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tag & Pengaturan</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Tag</label>

          {/* Selected tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-sm px-3 py-1 rounded-full">
                {tag}
                <button onClick={() => toggleTag(tag)} className="hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
          </div>

          {/* Existing tags as quick-pick chips */}
          {tags.filter(t => !selectedTags.includes(t.name)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.filter(t => !selectedTags.includes(t.name)).map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Inline new tag input */}
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Ketik tag baru lalu tekan Enter..."
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (!value) return;
                  if (selectedTags.includes(value)) { input.value = ''; return; }
                  const exists = tags.some(t => t.name.toLowerCase() === value.toLowerCase());
                  if (!exists) {
                    try {
                      const { addDoc, collection, getDocs } = await import('firebase/firestore');
                      const { db } = await import('@/lib/firebase');
                      await addDoc(collection(db, 'tags'), { name: value, createdAt: new Date().toISOString() });
                      const snap = await getDocs(collection(db, 'tags'));
                      const refreshed = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                      setTags(refreshed);
                    } catch (err) { console.error('Error saving tag:', err); }
                  }
                  setSelectedTags(prev => [...prev, value]);
                  input.value = '';
                }
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Pilih tag di atas atau ketik tag baru — otomatis tersimpan ke database.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="form-input w-auto">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="w-4 h-4 text-teal-600 rounded" />
            <span className="text-sm font-medium text-slate-700">Konten Premium</span>
          </label>
        </div>
      </div>

      {/* Save Buttons */}
      <div className="flex items-center gap-3 mb-12">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
        </button>
        <button onClick={() => router.push('/books')} className="btn-secondary">Batal</button>
      </div>
    </div>
  );
}
