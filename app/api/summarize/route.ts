import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { text, title, author } = await req.json();

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Teks terlalu pendek. Minimal 20 karakter ringkasan.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum dikonfigurasi. Silakan isi di file .env.local' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Batasi teks agar tidak melampaui context window
    const trimmedText = text.substring(0, 15000);

    const prompt = `Kamu adalah asisten editor buku profesional. Tugasmu adalah menganalisis ringkasan buku yang telah ditulis oleh pengguna, lalu mengekstrak Poin Pembelajaran (Key Takeaways), Tag yang relevan, dan estimasi waktu baca dari ringkasan tersebut.

Informasi Buku:
- Judul: ${title || '(tidak diketahui)'}
- Penulis: ${author || '(tidak diketahui)'}

Ringkasan Buku (dari pengguna):
---
${trimmedText}
---

Buatkan output dalam format JSON yang valid dengan struktur berikut:
{
  "keyTakeaways": ["Poin 1", "Poin 2", "Poin 3", "Poin 4"],
  "tags": ["Tag1", "Tag2", "Tag3"],
  "categories": ["Kategori1", "Kategori2"],
  "estimatedReadTime": 5
}

Panduan:
- keyTakeaways (Poin Pembelajaran): Buat poin HOOK (daya tarik) agar pembaca penasaran membaca bukunya. Gunakan gaya copywriting persuasif (mind-blowing realization). WAJIB SANGAT PENDEK, MAKSIMAL 8-12 KATA per poin. Contoh: "Rahasia hubungan terkuat lahir dari spiritualitas, bukan logika." atau "Ternyata, sakit hati adalah senjata rahasia untuk berkembang."
- tags harus 3-5 kata kunci tunggal atau frasa pendek yang relevan.
- categories harus 1-3 kategori besar (contoh: Bisnis, Pengembangan Diri, Fiksi, dsb).
- estimatedReadTime adalah estimasi waktu (dalam menit) untuk membaca ringkasan tersebut (biasanya 2-5 menit tergantung panjangnya).
- Output HARUS berupa JSON valid, tanpa markdown code blocks (\`\`\`).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';

    // Parse JSON dari response (hapus markdown code blocks jika ada)
    const cleanJson = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      // Jika parsing gagal, fallback
      return NextResponse.json({
        keyTakeaways: [],
        tags: [],
        categories: [],
        estimatedReadTime: 3
      });
    }

    return NextResponse.json({
      keyTakeaways: parsed.keyTakeaways || [],
      tags: parsed.tags || [],
      categories: parsed.categories || [],
      estimatedReadTime: parsed.estimatedReadTime || Math.max(1, Math.ceil(text.split(' ').length / 200)),
    });
  } catch (err: any) {
    console.error('Summarize API error:', err);
    let errorMessage = err.message || 'Terjadi kesalahan saat meringkas.';
    
    // Tangkap error kuota dari Google
    if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('429')) {
      errorMessage = 'Kuota API Gemini gratis Anda telah melampaui batas (batas: 15 request/menit atau token habis). Silakan tunggu 1-2 menit lalu coba klik tombol "Ringkas" lagi.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
