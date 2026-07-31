'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineTrash, HiOutlineArrowUpTray, HiOutlineSparkles } from 'react-icons/hi2';
import type { GoogleBookResult, Category, Tag } from '@/lib/types';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });
const EbookExtractor = dynamic(() => import('@/components/EbookExtractor'), { ssr: false });

export default function NewBookPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');

  // Google Books Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  // Categories & Tags from Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catSnap, tagSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'tags')),
        ]);
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
        setTags(tagSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
      } catch (err) {
        console.error('Error fetching meta:', err);
      }
    };
    fetchMeta();
  }, []);

  // --- Google Books API Search ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=6&langRestrict=id`
      );
      const data = await res.json();
      const results: GoogleBookResult[] = (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.volumeInfo?.title || '',
        authors: item.volumeInfo?.authors || [],
        description: item.volumeInfo?.description || '',
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        isbn: (item.volumeInfo?.industryIdentifiers || []).find((i: any) => i.type === 'ISBN_13')?.identifier || '',
        publishedDate: item.volumeInfo?.publishedDate || '',
        categories: item.volumeInfo?.categories || [],
        pageCount: item.volumeInfo?.pageCount || 0,
      }));
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectGoogleBook = (book: GoogleBookResult) => {
    setTitle(book.title);
    setAuthor(book.authors.join(', '));
    setCoverUrl(book.thumbnail);
    setSynopsis(book.description);
    setIsbn(book.isbn);
    setPublishedYear(parseInt(book.publishedDate?.substring(0, 4)) || 2024);
    if (book.categories.length > 0) setCategory(book.categories[0]);
    setSearchResults([]);
    setSearchQuery('');
  };

  // --- Key Takeaways ---
  const addTakeaway = () => setKeyTakeaways([...keyTakeaways, '']);
  const removeTakeaway = (index: number) => {
    setKeyTakeaways(keyTakeaways.filter((_, i) => i !== index));
  };
  const updateTakeaway = (index: number, value: string) => {
    const updated = [...keyTakeaways];
    updated[index] = value;
    setKeyTakeaways(updated);
  };

  // --- Tag Toggle ---
  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  // --- Save Book ---
  const handleSave = async () => {
    if (!title.trim() || !author.trim()) {
      alert('Judul dan Penulis wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'books'), {
        title: title.trim(),
        author: author.trim(),
        coverUrl,
        synopsis,
        content,
        rating: Number(rating),
        tags: selectedTags,
        category,
        isPremium,
        estimatedReadTime: Number(estimatedReadTime),
        status,
        isbn,
        publishedYear: Number(publishedYear),
        keyTakeaways: keyTakeaways.filter(k => k.trim() !== ''),
        createdAt: now,
        updatedAt: now,
      });
      router.push('/books');
    } catch (err) {
      console.error('Error saving book:', err);
      alert('Gagal menyimpan buku.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Tambah Buku Baru</h1>
        <p className="text-slate-500 mt-1">Cari dari Google Books atau masukkan data secara manual</p>
      </div>

      {/* === STEP 1: SOURCE === */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Sumber Buku</h2>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'search' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔍 Cari dari Google Books
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'manual' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <HiOutlineArrowUpTray size={16} /> Input Manual / Upload E-book
            </span>
          </button>
        </div>

        {activeTab === 'search' && (
          <div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <HiOutlineMagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Masukkan judul buku atau ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="form-input pl-10"
                />
              </div>
              <button onClick={handleSearch} disabled={searching} className="btn-primary">
                {searching ? 'Mencari...' : 'Cari'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectGoogleBook(result)}
                    className="w-full flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-teal-50 transition-colors text-left"
                  >
                    {result.thumbnail ? (
                      <img src={result.thumbnail} alt="" className="w-12 h-18 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-18 rounded bg-slate-100 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{result.title}</p>
                      <p className="text-sm text-slate-500">{result.authors.join(', ')}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{result.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <EbookExtractor
            onTextExtracted={(text) => {
              setContent(text);
            }}
          />
        )}
      </div>

      {/* === STEP 2: METADATA === */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Informasi Buku</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Buku *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="Contoh: Atomic Habits" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Penulis *</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="form-input" placeholder="Contoh: James Clear" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
            <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} className="form-input" placeholder="9780735211292" />
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Rating (0-5)</label>
            <input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(parseFloat(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
              <option value="">Pilih kategori...</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="__manual">+ Tulis manual</option>
            </select>
            {category === '__manual' && (
              <input type="text" className="form-input mt-2" placeholder="Nama kategori..." onChange={(e) => setCategory(e.target.value)} />
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">URL Cover</label>
            <div className="flex gap-3 items-start">
              <input type="text" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="form-input flex-1" placeholder="https://..." />
              {coverUrl && (
                <img src={coverUrl} alt="Preview" className="w-16 h-22 rounded object-cover border" />
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Sinopsis</label>
            <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} className="form-input" rows={3} placeholder="Sinopsis singkat buku..." />
          </div>
        </div>
      </div>

      {/* === STEP 3: KEY TAKEAWAYS === */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Apa yang Akan Kamu Pelajari</h2>
        <p className="text-sm text-slate-500 mb-4">Poin-poin ini akan ditampilkan di halaman detail buku sebelum ringkasan.</p>
        
        <div className="space-y-3">
          {keyTakeaways.map((takeaway, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-teal-600 font-bold w-6">{index + 1}.</span>
              <input
                type="text"
                value={takeaway}
                onChange={(e) => updateTakeaway(index, e.target.value)}
                className="form-input flex-1"
                placeholder="Contoh: Cara membangun kebiasaan baik secara konsisten"
              />
              {keyTakeaways.length > 1 && (
                <button onClick={() => removeTakeaway(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                  <HiOutlineTrash size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addTakeaway} className="mt-3 flex items-center gap-1 text-sm text-teal-600 font-medium hover:text-teal-700">
          <HiOutlinePlus size={16} /> Tambah poin
        </button>
      </div>

      {/* === STEP 4: RINGKASAN === */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ringkasan Buku</h2>
            <p className="text-sm text-slate-500">Konten utama yang akan dibaca oleh pengguna</p>
          </div>
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
        <RichTextEditor content={content} onChange={setContent} placeholder="Tulis ringkasan buku di sini..." />
      </div>

      {/* === STEP 5: TAGS & STATUS === */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tag & Pengaturan</h2>

        {/* Tags - unified inline input */}
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
              id="newTagInput"
              className="form-input flex-1"
              placeholder="Ketik tag baru lalu tekan Enter..."
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (!value) return;
                  // Cek duplikat
                  if (selectedTags.includes(value)) { input.value = ''; return; }
                  // Simpan ke Firestore jika belum ada di database
                  const exists = tags.some(t => t.name.toLowerCase() === value.toLowerCase());
                  if (!exists) {
                    try {
                      const { addDoc, collection } = await import('firebase/firestore');
                      const { db } = await import('@/lib/firebase');
                      await addDoc(collection(db, 'tags'), { name: value, createdAt: new Date().toISOString() });
                      // Refresh tags list
                      const { getDocs } = await import('firebase/firestore');
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

        {/* Status & Premium */}
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

      {/* === SAVE BUTTONS === */}
      <div className="flex items-center gap-3 mb-12">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Menyimpan...' : status === 'published' ? '📤 Publish Buku' : '💾 Simpan sebagai Draft'}
        </button>
        <button onClick={() => router.push('/books')} className="btn-secondary">
          Batal
        </button>
      </div>
    </div>
  );
}
