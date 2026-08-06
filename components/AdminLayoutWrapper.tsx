'use client';

import Image from 'next/image';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { HiMenu } from 'react-icons/hi';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-30">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Kitab-i Logo" 
            width={90} 
            height={28} 
            className="object-contain"
          />
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open Sidebar"
        >
          <HiMenu size={24} />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
