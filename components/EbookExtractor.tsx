'use client';

import { useState, useRef } from 'react';
import { HiOutlineArrowUpTray, HiOutlineDocumentText, HiOutlineXMark } from 'react-icons/hi2';

interface EbookExtractorProps {
  onTextExtracted: (text: string) => void;
  onCoverExtracted?: (base64Image: string) => void;
  onMetadataExtracted?: (metadata: { title?: string, author?: string, year?: number }) => void;
}

export default function EbookExtractor({ onTextExtracted, onCoverExtracted, onMetadataExtracted }: EbookExtractorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    // Use the bundled worker from unpkg
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Extract first page as cover image if requested
    if (onCoverExtracted) {
      try {
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await firstPage.render({ canvasContext: context, viewport: viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onCoverExtracted(dataUrl);
        }
      } catch (err) {
        console.error('Gagal mengekstrak cover dari PDF', err);
      }
    }

    // Extract metadata
    if (onMetadataExtracted) {
      try {
        const metadata = await pdf.getMetadata();
        if (metadata && metadata.info) {
          const title = metadata.info.Title;
          const author = metadata.info.Author;
          let year;
          const creationDate = metadata.info.CreationDate;
          if (creationDate && creationDate.startsWith('D:')) {
            year = parseInt(creationDate.substring(2, 6));
          }
          onMetadataExtracted({ title, author, year });
        }
      } catch (err) {
        console.error('Gagal mengekstrak metadata', err);
      }
    }

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  };

  const extractEpubText = async (file: File): Promise<string> => {
    const ePub = (await import('epubjs')).default;
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    
    await book.ready;
    const spine = book.spine as any;
    
    let fullText = '';
    for (const section of spine.items) {
      try {
        const doc = await section.load(book.load.bind(book));
        const bodyEl = doc?.querySelector?.('body') || doc;
        if (bodyEl && bodyEl.textContent) {
          fullText += bodyEl.textContent.trim() + '\n\n';
        }
      } catch {
        // Skip sections that fail to load
      }
    }
    
    return fullText.trim();
  };

  const processFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsProcessing(true);

    try {
      let text = '';
      const ext = file.name.toLowerCase().split('.').pop();
      
      if (ext === 'pdf') {
        text = await extractPdfText(file);
      } else if (ext === 'epub') {
        text = await extractEpubText(file);
      } else {
        throw new Error('Format tidak didukung. Gunakan file PDF atau EPUB.');
      }

      if (!text || text.length < 50) {
        throw new Error('Tidak berhasil mengekstrak teks yang cukup dari file ini. Mungkin file hanya berisi gambar/scan.');
      }

      onTextExtracted(text);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses file.');
      setFileName(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      {fileName && !isProcessing ? (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiOutlineDocumentText size={24} className="text-teal-600" />
            <div>
              <p className="text-sm font-medium text-teal-800">{fileName}</p>
              <p className="text-xs text-teal-600">Teks berhasil diekstrak dan dimasukkan ke editor di bawah</p>
            </div>
          </div>
          <button onClick={reset} className="p-1.5 rounded-lg text-teal-500 hover:text-red-500 hover:bg-red-50 transition-colors">
            <HiOutlineXMark size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-teal-500 bg-teal-50' 
              : 'border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.epub"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isProcessing ? (
            <div>
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-teal-700">Mengekstrak teks dari {fileName}...</p>
              <p className="text-xs text-slate-400 mt-1">Proses ini mungkin memakan waktu beberapa detik</p>
            </div>
          ) : (
            <div>
              <HiOutlineArrowUpTray size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Drag & drop file PDF atau EPUB di sini
              </p>
              <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file</p>
              <p className="text-xs text-teal-600 font-medium mt-3">
                Teks akan diekstrak otomatis dan dimasukkan ke editor
              </p>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
