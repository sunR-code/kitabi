// TypeScript types for Kitabi Admin

export interface Book {
  id?: string;
  title: string;
  author: string;
  coverUrl: string;
  synopsis: string;
  content: string;
  rating: number;
  tags: string[];
  category: string;
  isPremium: boolean;
  estimatedReadTime: number;
  status: 'draft' | 'published';
  isbn: string;
  publishedYear: number;
  keyTakeaways: string[]; // Poin-poin "Apa yang akan kamu pelajari"
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id?: string;
  name: string;
  icon: string;
  bookCount: number;
  createdAt: string;
}

export interface Tag {
  id?: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface GoogleBookResult {
  id: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail: string;
  isbn: string;
  publishedDate: string;
  categories: string[];
  pageCount: number;
}
