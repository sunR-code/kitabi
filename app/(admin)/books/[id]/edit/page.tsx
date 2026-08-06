'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import BookForm from '@/components/BookForm';
import type { Book } from '@/lib/types';

export default function EditBookPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Book | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookSnap = await getDoc(doc(db, 'books', bookId));
        if (bookSnap.exists()) {
          const data = bookSnap.data() as Book;
          // Handle legacy single category field
          if (!data.categories && data.category) {
            data.categories = [data.category];
          }
          setInitialData(data);
        }
      } catch (err) {
        console.error('Gagal memuat buku:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  const handleSave = async (data: Record<string, unknown>) => {
    await updateDoc(doc(db, 'books', bookId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Memuat data buku...</p>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Buku tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <BookForm
      mode="edit"
      initialData={{
        title: initialData.title || '',
        author: initialData.author || '',
        coverUrl: initialData.coverUrl || '',
        content: initialData.content || '',
        rating: initialData.rating || 0,
        categories: initialData.categories || [],
        tags: initialData.tags || [],
        isbn: initialData.isbn || '',
        publishedYear: initialData.publishedYear || new Date().getFullYear(),
        estimatedReadTime: initialData.estimatedReadTime || 15,
        isPremium: initialData.isPremium || false,
        status: initialData.status || 'published',
        keyTakeaways: initialData.keyTakeaways?.length ? initialData.keyTakeaways : [''],
      }}
      onSave={handleSave}
    />
  );
}
