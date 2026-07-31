import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { text, title, author } = await req.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Teks terlalu pendek untuk diringkas. Minimal 50 karakter.' },
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
    const trimmedText = text.substring(0, 30000);

    const prompt = `Kamu adalah seorang editor buku profesional. Tugasmu adalah membuat ringkasan buku yang menarik dan informatif dalam Bahasa Indonesia.

Informasi Buku:
- Judul: ${title || '(tidak diketahui)'}
- Penulis: ${author || '(tidak diketahui)'}

Teks Buku (sebagian):
---
${trimmedText}
---

Buatkan output dalam format JSON yang valid dengan struktur berikut:
{
  "summary": "Ringkasan buku dalam bentuk paragraf-paragraf yang mengalir. Tulis 3-5 paragraf yang menjelaskan inti buku dengan bahasa yang engaging dan mudah dipahami. Gunakan format HTML sederhana (<p>, <strong>, <em>, <h3>) agar bisa ditampilkan langsung di editor.",
  "keyTakeaways": ["Poin pembelajaran 1", "Poin pembelajaran 2", "Poin pembelajaran 3", "Poin pembelajaran 4", "Poin pembelajaran 5"]
}

Panduan:
- Ringkasan harus 400-800 kata
- Key takeaways harus 4-7 poin yang spesifik dan actionable
- Gunakan bahasa yang mudah dipahami dan menarik
- Jangan menggunakan markdown, gunakan HTML tags saja
- Output HARUS berupa JSON valid, tanpa backticks atau markdown code blocks`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
      // Jika parsing gagal, coba ambil summary dari teks mentah
      return NextResponse.json({
        summary: `<p>${responseText}</p>`,
        keyTakeaways: [],
      });
    }

    return NextResponse.json({
      summary: parsed.summary || '',
      keyTakeaways: parsed.keyTakeaways || [],
    });
  } catch (err: any) {
    console.error('Summarize API error:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan saat meringkas.' },
      { status: 500 }
    );
  }
}
