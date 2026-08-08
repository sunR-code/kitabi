'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowUpTray,
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineDocumentArrowUp,
} from 'react-icons/hi2';
import type { GoogleBookResult, Category, Tag } from '@/lib/types';
import { toast } from '@/components/Toast';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });
const EbookExtractor = dynamic(() => import('@/components/EbookExtractor'), { ssr: false });

interface BookFormProps {
  mode: 'new' | 'edit';
  initialData?: {
    title: string;
    author: string;
    coverUrl: string;
    content: string;
    rating: number;
    categories: string[];
    tags: string[];
    isbn: string;
    publishedYear: number;
    estimatedReadTime: number;
    isPremium: boolean;
    isEditorChoice?: boolean;
    status: 'draft' | 'published';
    keyTakeaways: string[];
  };
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

export default function BookForm({ mode, initialData, onSave }: BookFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');

  // Google Books Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Form fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [author, setAuthor] = useState(initialData?.author || '');
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [isbn, setIsbn] = useState(initialData?.isbn || '');
  const [publishedYear, setPublishedYear] = useState<number | ''>(initialData?.publishedYear || '');
  const [estimatedReadTime, setEstimatedReadTime] = useState(initialData?.estimatedReadTime || 15);
  const [isPremium, setIsPremium] = useState(initialData?.isPremium || false);
  const [isEditorChoice, setIsEditorChoice] = useState(initialData?.isEditorChoice || false);
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialData?.keyTakeaways?.length ? initialData.keyTakeaways : ['']
  );

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
        console.error('Gagal memuat metadata:', err);
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
      console.error('Pencarian gagal:', err);
      toast('Gagal mencari buku. Periksa koneksi internet.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const selectGoogleBook = (book: GoogleBookResult) => {
    setTitle(book.title);
    setAuthor(book.authors.join(', '));
    setCoverUrl(book.thumbnail);
    setIsbn(book.isbn);
    setPublishedYear(parseInt(book.publishedDate?.substring(0, 4)) || new Date().getFullYear());
    if (book.categories.length > 0) {
      setSelectedCategories([...new Set([...selectedCategories, ...book.categories])]);
    }
    setSearchResults([]);
    setSearchQuery('');
    toast(`"${book.title}" dipilih. Lengkapi data di bawah.`, 'success');
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

  // --- Tag & Category Toggle ---
  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };
  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  // --- Add new category inline ---
  const handleNewCategory = async (value: string) => {
    if (!value || selectedCategories.includes(value)) return;
    const exists = categories.some(c => c.name.toLowerCase() === value.toLowerCase());
    if (!exists) {
      try {
        await addDoc(collection(db, 'categories'), { name: value, createdAt: new Date().toISOString() });
        const snap = await getDocs(collection(db, 'categories'));
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      } catch (err) {
        console.error('Gagal menyimpan kategori:', err);
      }
    }
    setSelectedCategories(prev => [...prev, value]);
  };

  // --- Add new tag inline ---
  const handleNewTag = async (value: string) => {
    if (!value || selectedTags.includes(value)) return;
    const exists = tags.some(t => t.name.toLowerCase() === value.toLowerCase());
    if (!exists) {
      try {
        await addDoc(collection(db, 'tags'), { name: value, createdAt: new Date().toISOString() });
        const snap = await getDocs(collection(db, 'tags'));
        setTags(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
      } catch (err) {
        console.error('Gagal menyimpan tag:', err);
      }
    }
    setSelectedTags(prev => [...prev, value]);
  };

  // --- AI Analysis ---
  const handleAIAnalysis = async () => {
    setSummarizing(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, title, author }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.keyTakeaways) setKeyTakeaways(data.keyTakeaways);
      if (data.tags?.length > 0) {
        const newTags = data.tags.filter((t: string) => !selectedTags.includes(t));
        setSelectedTags(prev => [...prev, ...newTags]);
      }
      if (data.categories?.length > 0) {
        const newCats = data.categories.filter((c: string) => !selectedCategories.includes(c));
        setSelectedCategories(prev => [...prev, ...newCats]);
      }
      if (data.estimatedReadTime) setEstimatedReadTime(data.estimatedReadTime);
      toast('Analisis AI selesai. Periksa hasilnya di bawah.', 'success');
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Gagal menganalisis ringkasan.', 'error');
    } finally {
      setSummarizing(false);
    }
  };

  // --- Save Book ---
  const handleSave = async () => {
    if (!title.trim() || !author.trim()) {
      toast('Judul dan Penulis wajib diisi.', 'error');
      return;
    }
    setSaving(true);
    try {
      // Auto-sync missing categories to 'categories' collection in Firestore
      for (const catName of selectedCategories) {
        if (!catName || !catName.trim()) continue;
        const exists = categories.some(c => c.name.toLowerCase() === catName.trim().toLowerCase());
        if (!exists) {
          try {
            await addDoc(collection(db, 'categories'), {
              name: catName.trim(),
              createdAt: new Date().toISOString(),
            });
          } catch (cErr) {
            console.error('Gagal menyelaraskan kategori baru:', cErr);
          }
        }
      }

      await onSave({
        title: title.trim(),
        author: author.trim(),
        coverUrl,
        synopsis: '',
        content,
        rating: Number(rating),
        tags: selectedTags,
        categories: selectedCategories,
        isPremium,
        isEditorChoice,
        estimatedReadTime: Number(estimatedReadTime),
        status,
        isbn,
        publishedYear: Number(publishedYear),
        keyTakeaways: keyTakeaways.filter(k => k.trim() !== ''),
      });
      toast(mode === 'new' ? 'Buku berhasil ditambahkan!' : 'Perubahan berhasil disimpan!', 'success');
      setTimeout(() => router.push('/books'), 600);
    } catch (err) {
      console.error('Gagal menyimpan:', err);
      toast('Gagal menyimpan buku. Coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/books')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
        >
          <HiOutlineArrowLeft size={16} /> Kembali ke Daftar Buku
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {mode === 'new' ? 'Tambah Buku Baru' : 'Edit Buku'}
        </h1>
        <p className="text-slate-500 mt-1">
          {mode === 'new'
            ? 'Cari dari Google Books atau masukkan data secara manual.'
            : title}
        </p>
      </div>

      {/* === STEP 1: SOURCE (New only) === */}
      {mode === 'new' && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Sumber Data</h2>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'search' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <HiOutlineMagnifyingGlass size={16} /> Cari dari Google Books
              </span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'manual' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <HiOutlineArrowUpTray size={16} /> Input Manual / Unggah E-book
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
              onTextExtracted={(text) => setContent(text)}
              onCoverExtracted={(base64) => setCoverUrl(base64)}
              onMetadataExtracted={(metadata) => {
                if (metadata.title && !title) setTitle(metadata.title);
                if (metadata.author && !author) setAuthor(metadata.author);
                if (metadata.year && !publishedYear) setPublishedYear(metadata.year);
              }}
            />
          )}
        </div>
      )}

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
            <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Baca (menit)</label>
            <input type="number" value={estimatedReadTime} onChange={(e) => setEstimatedReadTime(parseInt(e.target.value))} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Penilaian (0–5)</label>
            <input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(parseFloat(e.target.value))} className="form-input" />
          </div>

          {/* Categories */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCategories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {cat}
                    <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-blue-900 focus:outline-none">
                      <HiOutlineXMark size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.filter(c => !selectedCategories.includes(c.name)).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Ketik kategori baru, lalu tekan Enter..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value) {
                    handleNewCategory(value);
                    input.value = '';
                  }
                }
              }}
            />
            <p className="text-xs text-slate-400 mt-1.5">Pilih dari daftar atau ketik kategori baru.</p>
          </div>

          {/* Cover */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Sampul Buku</label>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <input type="text" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="form-input flex-1" placeholder="https://... atau unggah gambar di bawah" />
                {coverUrl && (
                  <img src={coverUrl} alt="Preview" className="w-16 h-22 rounded object-cover border bg-slate-50" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const img = new window.Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      let width = img.width;
                      let height = img.height;
                      if (width > 600) {
                        height = Math.round(height * 600 / width);
                        width = 600;
                      }
                      canvas.width = width;
                      canvas.height = height;
                      ctx?.drawImage(img, 0, 0, width, height);
                      setCoverUrl(canvas.toDataURL('image/jpeg', 0.8));
                    };
                    img.src = e.target?.result as string;
                  };
                  reader.readAsDataURL(file);
                }
              }} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* === STEP 3: KEY TAKEAWAYS === */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Poin Pembelajaran</h2>
        <p className="text-sm text-slate-500 mb-4">Ditampilkan di halaman detail buku sebelum ringkasan.</p>
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
          <h2 className="text-lg font-bold text-slate-800">Ringkasan Buku</h2>
          <button
            className={`btn-secondary flex items-center gap-2 ${summarizing ? 'opacity-50 cursor-wait' : ''}`}
            disabled={summarizing || !content}
            onClick={handleAIAnalysis}
          >
            <HiOutlineSparkles size={16} />
            {summarizing ? 'Menganalisis...' : 'Analisis dengan AI'}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Tulis ringkasan buku, lalu klik tombol AI untuk mengekstrak poin pembelajaran, tag, dan waktu baca secara otomatis.
        </p>
        <RichTextEditor content={content} onChange={setContent} placeholder="Tulis ringkasan buku di sini..." />
      </div>

      {/* === STEP 5: TAGS & STATUS === */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Label & Pengaturan</h2>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Tag</label>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-sm px-3 py-1 rounded-full">
                  {tag}
                  <button onClick={() => toggleTag(tag)} className="hover:text-red-500 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
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
          <input
            type="text"
            className="form-input"
            placeholder="Ketik tag baru, lalu tekan Enter..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget;
                const value = input.value.trim();
                if (value) {
                  handleNewTag(value);
                  input.value = '';
                }
              }
            }}
          />
          <p className="text-xs text-slate-400 mt-1.5">Pilih dari daftar atau ketik tag baru — otomatis tersimpan.</p>
        </div>

        {/* Status & Premium */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="form-input w-auto">
              <option value="draft">Draf</option>
              <option value="published">Diterbitkan</option>
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
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : status === 'published' ? (
            <>
              <HiOutlineCheckCircle size={18} /> Terbitkan Buku
            </>
          ) : (
            <>
              <HiOutlineDocumentArrowUp size={18} /> Simpan Draf
            </>
          )}
        </button>
        <button onClick={() => router.push('/books')} className="btn-secondary">
          Batal
        </button>
      </div>
    </div>
  );
}
