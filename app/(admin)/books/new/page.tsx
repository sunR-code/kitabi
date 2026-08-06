'use client';

import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import BookForm from '@/components/BookForm';

export default function NewBookPage() {
  const handleSave = async (data: Record<string, unknown>) => {
    const now = new Date().toISOString();
    await addDoc(collection(db, 'books'), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  };

  return <BookForm mode="new" onSave={handleSave} />;
}
